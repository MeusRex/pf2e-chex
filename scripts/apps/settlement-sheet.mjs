import * as C from "../const.mjs";
import * as E from "../economy/engine.mjs";
import * as Store from "../economy/realm-store.mjs";
import * as UI from "./economy-ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * A settlement: size, needs, buildings and construction.
 */
export default class SettlementSheet extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.realmId = options.realmId;
        this.settlementId = options.settlementId;
    }

    static DEFAULT_OPTIONS = {
        classes: ["chex-economy", "chex-economy-live", "chex-settlement"],
        window: {
            icon: "fa-solid fa-city",
            resizable: true
        },
        position: {width: 640, height: 720},
        actions: {
            build: SettlementSheet.#onBuild,
            demolish: SettlementSheet.#onDemolish,
            rename: SettlementSheet.#onRename,
            panTo: SettlementSheet.#onPanTo,
            unplace: SettlementSheet.#onUnplace,
            deleteSettlement: SettlementSheet.#onDelete,
            openKingdom: SettlementSheet.#onOpenKingdom
        }
    };

    static PARTS = {
        main: {template: `${UI.TEMPLATES}/settlement-sheet.hbs`, scrollable: [".chex-scroll"], templates: [`${UI.TEMPLATES}/amounts-inline.hbs`]}
    };

    static open(realmId, settlementId) {
        if (!Store.canManage(game.user, realmId)) {
            ui.notifications.warn(game.i18n.localize("CHEX.ECONOMY.Error.NoPermission"));
            return null;
        }
        const id = `chex-settlement-${realmId}-${settlementId}`;
        const app = foundry.applications.instances.get(id) ?? new SettlementSheet({id, realmId, settlementId});
        return app.render({force: true});
    }

    /**
     * Pan the canvas to a settlement, switching scenes if needed.
     */
    static async panTo(settlement) {
        const scene = game.scenes.get(settlement?.sceneId);
        if (!scene || settlement.hexKey === "") return;
        if (canvas.scene?.id !== scene.id) {
            // listen before switching, the canvas may be ready before view() resolves
            const ready = new Promise(resolve => Hooks.once("canvasReady", resolve));
            await scene.view();
            await ready;
        }
        const hex = chex.manager.hexes.get(Number(settlement.hexKey));
        if (hex) canvas.animatePan({...hex.center, scale: Math.max(canvas.stage.scale.x, 0.6)});
    }

    get settlement() {
        return Store.getRealmState(this.realmId).settlements[this.settlementId];
    }

    /** @override */
    get title() {
        return this.settlement?.name ?? game.i18n.localize("CHEX.ECONOMY.Settlement.Title");
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const state = Store.getRealmState(this.realmId);
        const settlement = state.settlements[this.settlementId];
        if (!settlement) return Object.assign(context, {missing: true});

        const defs = Store.getDefs();
        const size = defs.sizes[settlement.size];
        const {preview} = Store.previewTurn(this.realmId);
        const result = preview.settlements[settlement.id];
        const active = preview.buildings[settlement.id] ?? {};
        const scene = game.scenes.get(settlement.sceneId);
        const isGM = game.user.isGM;

        // keep the window title in sync after renames
        if (this.window?.title) this.window.title.textContent = settlement.name;

        return Object.assign(context, {
            settlement,
            realm: chex.realms[this.realmId],
            isGM,
            sizes: Object.values(defs.sizes).sort((a, b) => a.rank - b.rank),
            sizeLabel: size?.label ?? settlement.size,
            lots: E.usedLots(settlement, defs.buildings),
            maxLots: size?.lots ?? 0,
            nextHappiness: result?.happiness ?? 100,
            location: scene && settlement.hexKey !== "" ? `${scene.name} ${UI.hexLabel(settlement.hexKey)}` : null,
            needs: Object.entries(size?.needs ?? {}).map(([key, required]) => {
                const received = result?.needs[key]?.received ?? 0;
                return {
                    label: UI.keyLabel(key), img: UI.keyImg(key), required,
                    received: UI.round(received), met: received >= required
                };
            }),
            buildings: settlement.buildings.map(instance => {
                const building = defs.buildings[instance.type];
                return {
                    uid: instance.uid,
                    label: building?.label ?? instance.type,
                    img: building?.img ?? C.FALLBACK_IMAGE,
                    lots: building?.lots ?? 0,
                    upkeep: UI.amountList(building?.upkeep),
                    production: UI.amountList(building?.production),
                    active: active[instance.uid] !== false,
                    missing: !building
                };
            }),
            constructable: Object.values(defs.buildings).map(building => {
                const reason = E.canBuild(state.stockpile, settlement, building.id, defs);
                return {
                    id: building.id,
                    label: building.label,
                    img: building.img,
                    lots: building.lots,
                    minSize: defs.sizes[building.minSize]?.label ?? "",
                    cost: UI.amountList(building.cost),
                    upkeep: UI.amountList(building.upkeep),
                    production: UI.amountList(building.production),
                    reason: reason ? game.i18n.localize(reason) : null,
                    // hide buildings the settlement can never have at its size
                    locked: reason === "CHEX.ECONOMY.Error.TooSmall"
                };
            }).sort((a, b) => a.locked - b.locked || (!!a.reason - !!b.reason) || a.label.localeCompare(b.label))
        });
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);
        this.element.querySelector("select[name=size]")?.addEventListener("change", async event => {
            await Store.request(this.realmId, "updateSettlement", {settlementId: this.settlementId, changes: {size: event.target.value}});
        });
    }

    /* -------------------------------------------- */

    static async #onBuild(event, target) {
        await Store.request(this.realmId, "build", {settlementId: this.settlementId, building: target.dataset.building});
    }

    static async #onDemolish(event, target) {
        const uid = target.closest("[data-uid]").dataset.uid;
        const type = this.settlement.buildings.find(b => b.uid === uid)?.type;
        const name = foundry.utils.escapeHTML(chex.buildings[type]?.label ?? type);
        if (!await UI.confirm(game.i18n.localize("CHEX.ECONOMY.Settlement.Demolish"), game.i18n.format("CHEX.ECONOMY.Settlement.DemolishConfirm", {name}))) return;
        await Store.request(this.realmId, "demolish", {settlementId: this.settlementId, uid});
    }

    static async #onRename() {
        const data = await foundry.applications.api.DialogV2.input({
            window: {title: "CHEX.ECONOMY.Settlement.Rename"},
            content: `<input type="text" name="name" value="${foundry.utils.escapeHTML(this.settlement.name)}" required autofocus>`,
            rejectClose: false
        });
        if (data?.name) await Store.request(this.realmId, "updateSettlement", {settlementId: this.settlementId, changes: {name: data.name}});
    }

    static #onPanTo() {
        SettlementSheet.panTo(this.settlement);
    }

    static async #onUnplace() {
        await Store.request(this.realmId, "updateSettlement", {settlementId: this.settlementId, changes: {sceneId: "", hexKey: ""}});
    }

    static async #onDelete() {
        const name = foundry.utils.escapeHTML(this.settlement.name);
        if (!await UI.confirm(game.i18n.localize("CHEX.ECONOMY.Settlement.Delete"), game.i18n.format("CHEX.ECONOMY.ConfirmDelete", {name}))) return;
        await Store.request(this.realmId, "deleteSettlement", {settlementId: this.settlementId});
        await this.close();
    }

    static async #onOpenKingdom() {
        const { default: KingdomView } = await import("./kingdom-view.mjs");
        KingdomView.open(this.realmId);
    }
}
