import * as C from "../const.mjs";
import ChexData from "../chex-data.mjs";
import { extractionCandidates, isExtracting } from "../economy/engine.mjs";
import { assignExtraction } from "../economy/migration.mjs";
import * as Store from "../economy/realm-store.mjs";
import SettlementSheet from "./settlement-sheet.mjs";
import { TEMPLATES } from "./economy-ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// lists on a hex: the definitions they refer to and their extra field
const LISTS = {
    improvements: {definitions: () => chex.improvements, blank: () => ({id: "", resource: "", show: false})},
    resources: {definitions: () => chex.resources, blank: () => ({id: "", amount: 1, show: false})},
    forageables: {definitions: () => chex.resources, blank: () => ({id: "", amount: 1, show: false})},
    features: {definitions: () => chex.features, blank: () => ({id: "", name: "", show: false})}
};

/**
 * Edit everything stored on a hex. GM only.
 */
export default class HexEditor extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.hex = options.hex;
        this.#draft = HexEditor.#normalize(foundry.utils.deepClone(this.hex.hexData ?? {}));
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        classes: ["chex-app", "chex-hex-editor"],
        window: {
            icon: C.ICONS.overlay,
            resizable: true
        },
        position: {width: 520, height: 680},
        form: {
            handler: HexEditor.#onSubmit,
            closeOnSubmit: true
        },
        actions: {
            addRow: HexEditor.#onAddRow,
            deleteRow: HexEditor.#onDeleteRow,
            openSettlement: HexEditor.#onOpenSettlement,
            unplaceSettlement: HexEditor.#onUnplaceSettlement,
            placeSettlement: HexEditor.#onPlaceSettlement,
            foundSettlement: HexEditor.#onFoundSettlement
        }
    };

    static PARTS = {
        main: {template: `${TEMPLATES}/hex-editor.hbs`, scrollable: [".chex-scroll"]},
        footer: {template: "templates/generic/form-footer.hbs"}
    };

    /**
     * Open the editor of a hex next to the cursor.
     */
    static open(hex, {left, top} = {}) {
        const id = `chex-hex-${hex.sceneId}-${ChexData.getKey(hex.offset)}`;
        const app = foundry.applications.instances.get(id) ?? new HexEditor({id, hex});
        return app.render({force: true, position: {left, top}});
    }

    #draft;

    static #normalize(data) {
        for (const list of Object.keys(LISTS)) data[list] = (data[list] ?? []).filter(e => e);
        return data;
    }

    get key() {
        return ChexData.getKey(this.hex.offset);
    }

    /** @override */
    get title() {
        return game.i18n.format("CHEX.HEXEDIT.Title", {hex: this.hex.toString()});
    }

    /** @override */
    async _prepareContext(options) {
        const draft = this.#draft;
        const options_ = defs => Object.values(defs).map(d => ({id: d.id, label: d.label || d.id}));
        const row = (list, entry) => {
            const def = LISTS[list].definitions()[entry.id];
            return {...entry, img: def?.img || C.FALLBACK_IMAGE};
        };
        return {
            hex: draft,
            icons: C.ICONS,
            terrains: options_(chex.terrains),
            travels: options_(chex.travels),
            realms: options_(chex.realms),
            explorationStates: Object.values(C.EXPLORATION_STATES),
            improvementOptions: options_(chex.improvements),
            resourceOptions: options_(chex.resources),
            featureOptions: options_(chex.features),
            improvements: draft.improvements.map(i => ({
                ...row("improvements", i),
                extracting: isExtracting(chex.improvements[i.id]),
                candidates: extractionCandidates(chex.improvements[i.id], chex.resources).map(r => ({id: r.id, label: r.label}))
            })),
            resources: draft.resources.map(r => row("resources", r)),
            forageables: draft.forageables.map(r => row("forageables", r)),
            features: draft.features.map(f => row("features", f)),
            ...this.#settlementContext(),
            buttons: [{type: "submit", icon: "fa-solid fa-save", label: "CHEX.Save"}]
        };
    }

    #settlementContext() {
        const found = Store.findSettlementAt(this.hex.sceneId, this.key);
        if (found) {
            return {settlement: {
                ...found.settlement,
                realmLabel: chex.realms[found.realmId]?.label,
                sizeLabel: chex.settlementSizes[found.settlement.size]?.label ?? found.settlement.size
            }};
        }
        // settlements belong to the saved claim of the hex
        const claimed = this.hex.hexData.claimed;
        return {
            canFound: !!chex.realms[claimed],
            unplaced: chex.realms[claimed]
                ? Object.values(Store.getRealmState(claimed).settlements).filter(s => s.hexKey === "" || s.hexKey == null)
                : []
        };
    }

    /**
     * Copy the form values into the draft.
     */
    #sync() {
        if (!this.form) return;
        const data = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.form).object);
        const toArray = obj => obj ? Object.keys(obj).sort((a, b) => a - b).map(k => obj[k]) : [];
        for (const field of ["terrain", "travel", "claimed", "cleared"]) this.#draft[field] = data[field] ?? this.#draft[field];
        this.#draft.exploration = Number(data.exploration) || 0;
        for (const list of Object.keys(LISTS)) this.#draft[list] = toArray(data[list]);
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);
        // changing the type of a row changes its icon and extraction options
        for (const select of this.element.querySelectorAll("select[data-rerender]")) {
            select.addEventListener("change", () => {
                this.#sync();
                this.render();
            });
        }
    }

    static #onAddRow(event, target) {
        this.#sync();
        this.#draft[target.dataset.list].push(LISTS[target.dataset.list].blank());
        this.render();
    }

    static #onDeleteRow(event, target) {
        this.#sync();
        this.#draft[target.dataset.list].splice(Number(target.dataset.index), 1);
        this.render();
    }

    static #onOpenSettlement() {
        const found = Store.findSettlementAt(this.hex.sceneId, this.key);
        if (found) SettlementSheet.open(found.realmId, found.settlement.id);
    }

    static async #onUnplaceSettlement() {
        const found = Store.findSettlementAt(this.hex.sceneId, this.key);
        if (!found) return;
        this.#sync();
        await Store.request(found.realmId, "updateSettlement", {settlementId: found.settlement.id, changes: {sceneId: "", hexKey: ""}});
        this.render();
    }

    static async #onPlaceSettlement() {
        const settlementId = this.element.querySelector(".chex-unplaced-settlement")?.value;
        if (!settlementId) return;
        this.#sync();
        await Store.request(this.hex.hexData.claimed, "updateSettlement", {settlementId, changes: {sceneId: this.hex.sceneId, hexKey: String(this.key)}});
        this.render();
    }

    static async #onFoundSettlement() {
        const realmId = this.hex.hexData.claimed;
        const sizes = Object.values(chex.settlementSizes).sort((a, b) => a.rank - b.rank);
        const options = sizes.map(s => `<option value="${s.id}">${foundry.utils.escapeHTML(s.label)}</option>`).join("");
        const data = await foundry.applications.api.DialogV2.input({
            window: {title: "CHEX.ECONOMY.Kingdom.CreateSettlement", icon: C.ICONS.settlement},
            content: `
                <div class="form-group"><label>${game.i18n.localize("CHEX.Label")}</label><input type="text" name="name" required autofocus></div>
                <div class="form-group"><label>${game.i18n.localize("CHEX.ECONOMY.Settlement.Size")}</label><select name="size">${options}</select></div>`,
            rejectClose: false
        });
        if (!data) return;
        this.#sync();
        const id = await Store.request(realmId, "createSettlement", {name: data.name, size: data.size, sceneId: this.hex.sceneId, hexKey: String(this.key)});
        this.render();
        SettlementSheet.open(realmId, id);
    }

    /**
     * @this {HexEditor}
     */
    static async #onSubmit() {
        this.#sync();
        const data = this.#draft;
        data.cleared = !!data.cleared;
        for (const list of ["resources", "forageables"]) {
            data[list] = data[list].filter(e => e.id).map(e => ({...e, amount: Math.max(1, Number(e.amount) || 1), show: !!e.show}));
        }
        data.features = data.features.filter(e => e.id).map(e => ({...e, show: !!e.show}));
        data.improvements = data.improvements.filter(e => e.id).map(e => ({...e, show: !!e.show}));
        data.improvements = assignExtraction(data) ?? data.improvements;
        const scene = game.scenes.get(this.hex.sceneId);
        await scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, {hexes: {[this.key]: data}});
    }
}
