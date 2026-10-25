import * as E from "../economy/engine.mjs";
import * as Store from "../economy/realm-store.mjs";
import * as UI from "./economy-ui.mjs";
import SettlementSheet from "./settlement-sheet.mjs";
import TradeWindow from "./trade-window.mjs";
import { postTurnReport } from "../economy/turn-report.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Overview of the economy of one realm: stockpile, settlements, work sites and drains.
 */
export default class KingdomView extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.realmId = options.realmId;
    }

    static DEFAULT_OPTIONS = {
        classes: ["chex-app", "chex-live", "chex-kingdom"],
        window: {
            icon: "fa-solid fa-crown",
            resizable: true
        },
        position: {width: 760, height: 760},
        actions: {
            openSettlement: KingdomView.#onOpenSettlement,
            createSettlement: KingdomView.#onCreateSettlement,
            panTo: KingdomView.#onPanTo,
            editStockpile: KingdomView.#onEditStockpile,
            addDrain: KingdomView.#onAddDrain,
            editDrain: KingdomView.#onEditDrain,
            toggleDrain: KingdomView.#onToggleDrain,
            deleteDrain: KingdomView.#onDeleteDrain,
            endTurn: KingdomView.#onEndTurn,
            openTrade: KingdomView.#onOpenTrade,
            respondOffer: KingdomView.#onRespondOffer,
            cancelOffer: KingdomView.#onCancelOffer,
            cancelAgreement: KingdomView.#onCancelAgreement
        }
    };

    static PARTS = {
        main: {template: `${UI.TEMPLATES}/kingdom-view.hbs`, scrollable: [".chex-scroll"], templates: [`${UI.TEMPLATES}/amounts-inline.hbs`]}
    };

    /**
     * Open the view of a realm, or bring it to front if already open.
     */
    static open(realmId) {
        const id = `chex-kingdom-${realmId}`;
        const app = foundry.applications.instances.get(id) ?? new KingdomView({id, realmId});
        return app.render({force: true});
    }

    get realm() {
        return chex.realms[this.realmId];
    }

    /** @override */
    get title() {
        return this.realm?.label ?? game.i18n.localize("CHEX.ECONOMY.Kingdom.Title");
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const realm = this.realm;
        if (!realm) return Object.assign(context, {missing: true});

        const {state, production, preview} = Store.previewTurn(this.realmId);
        const defs = Store.getDefs();
        const isGM = game.user.isGM;
        const canManage = Store.canManage(game.user, this.realmId);

        return Object.assign(context, {
            realm,
            state,
            isGM,
            canManage,
            isPlayerRealm: Store.playerRealm() === this.realmId,
            realmImg: UI.realmImg(realm),
            preview,
            stockpile: this.#stockpileRows(state, preview),
            shortages: this.#shortages(state, preview),
            settlements: this.#settlementRows(state, preview, defs),
            sites: this.#siteRows(production.sites),
            drains: Object.values(state.drains).map(drain => ({
                ...drain,
                img: drain.img || "icons/svg/sword.svg",
                upkeep: UI.amountList(drain.upkeep),
                willPay: drain.active === false || preview.drains[drain.id] !== false
            })),
            log: state.log.map(entry => ({...entry, net: UI.amountList(entry.net)})),
            ...this.#tradeContext(state, preview)
        });
    }

    #tradeContext(state, preview) {
        const realmLabel = id => chex.realms[id]?.label ?? id;
        const deal = (give, receive) => ({give: UI.amountList(give), receive: UI.amountList(receive)});
        return {
            outgoingOffers: Object.values(state.offers).map(o => ({
                ...o, ...deal(o.give, o.receive), partnerLabel: realmLabel(o.partner)
            })),
            incomingOffers: Store.incomingOffers(this.realmId).map(({from, offer}) => ({
                ...offer, from, fromLabel: realmLabel(from),
                // seen from this realm: we give what they want to receive
                ...deal(offer.receive, offer.give)
            })),
            agreements: [
                ...Object.values(state.agreements).map(a => ({
                    ...a, owner: this.realmId, partnerLabel: realmLabel(a.partner), ...deal(a.give, a.receive),
                    willExecute: preview.trades[a.id] !== false
                })),
                ...Store.incomingAgreements(this.realmId).map(({owner, agreement}) => ({
                    ...agreement, owner, partnerLabel: realmLabel(owner), ...deal(agreement.receive, agreement.give),
                    willExecute: true, incoming: true
                }))
            ]
        };
    }

    #stockpileRows(state, preview) {
        const ids = new Set([...Object.keys(state.stockpile), ...Object.keys(preview.stockpile),
            ...Object.keys(preview.produced.hexes), ...Object.keys(preview.produced.buildings)]);
        const consumed = {};
        for (const part of Object.values(preview.consumed)) E.addAmounts(consumed, part);
        E.addAmounts(consumed, preview.traded.given);
        const produced = E.addAmounts({...preview.produced.hexes}, preview.produced.buildings);
        E.addAmounts(produced, preview.traded.received);

        return [...ids].map(id => {
            const resource = chex.resources[id];
            const have = state.stockpile[id] ?? 0;
            const next = preview.stockpile[id] ?? 0;
            return {
                id,
                label: resource?.label ?? id,
                img: UI.keyImg(id),
                kind: resource?.kind ?? "raw",
                have,
                produced: UI.round(produced[id] ?? 0),
                consumed: UI.round(consumed[id] ?? 0),
                net: UI.round(next - have),
                next: UI.round(next)
            };
        }).sort((a, b) => a.kind.localeCompare(b.kind) * -1 || a.label.localeCompare(b.label));
    }

    #shortages(state, preview) {
        const shortages = [];
        for (const [id, result] of Object.entries(preview.settlements)) {
            const settlement = state.settlements[id];
            for (const [key, need] of Object.entries(result.needs)) {
                if (need.received >= need.required) continue;
                shortages.push(game.i18n.format("CHEX.ECONOMY.Kingdom.ShortageNeed", {
                    settlement: settlement.name, resource: UI.keyLabel(key),
                    missing: UI.round(need.required - need.received)
                }));
            }
        }
        for (const [settlementId, buildings] of Object.entries(preview.buildings)) {
            const settlement = state.settlements[settlementId];
            for (const [uid, active] of Object.entries(buildings)) {
                if (active) continue;
                const type = settlement.buildings.find(b => b.uid === uid)?.type;
                shortages.push(game.i18n.format("CHEX.ECONOMY.Kingdom.ShortageBuilding", {
                    settlement: settlement.name, building: chex.buildings[type]?.label ?? type
                }));
            }
        }
        for (const [id, paid] of Object.entries(preview.drains)) {
            if (!paid) shortages.push(game.i18n.format("CHEX.ECONOMY.Kingdom.ShortageDrain", {drain: state.drains[id].name}));
        }
        return shortages;
    }

    #settlementRows(state, preview, defs) {
        return Object.values(state.settlements).map(settlement => {
            const size = defs.sizes[settlement.size];
            const scene = game.scenes.get(settlement.sceneId);
            return {
                ...settlement,
                sizeLabel: size?.label ?? settlement.size,
                lots: E.usedLots(settlement, defs.buildings),
                maxLots: size?.lots ?? 0,
                buildingCount: settlement.buildings.length,
                nextHappiness: preview.settlements[settlement.id]?.happiness ?? 100,
                location: scene && settlement.hexKey !== "" ? `${scene.name} ${UI.hexLabel(settlement.hexKey)}` : null
            };
        }).sort((a, b) => (defs.sizes[b.size]?.rank ?? 0) - (defs.sizes[a.size]?.rank ?? 0) || a.name.localeCompare(b.name));
    }

    #siteRows(sites) {
        const groups = {};
        for (const site of sites) {
            const key = `${site.improvement}|${site.resource}`;
            const group = groups[key] ??= {
                improvement: chex.improvements[site.improvement]?.label ?? site.improvement,
                img: chex.improvements[site.improvement]?.img,
                resource: UI.keyLabel(site.resource),
                resourceImg: UI.keyImg(site.resource),
                count: 0,
                amount: 0
            };
            group.count += 1;
            group.amount += site.amount;
        }
        return Object.values(groups).sort((a, b) => a.improvement.localeCompare(b.improvement) || b.amount - a.amount);
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);
        // drop actors to add them as drains, e.g. armies
        const zone = this.element.querySelector(".chex-drains");
        if (!zone || !context.canManage) return;
        zone.addEventListener("dragover", event => event.preventDefault());
        zone.addEventListener("drop", this.#onDropActor.bind(this));
    }

    async #onDropActor(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data?.type !== "Actor") return;
        const actor = await fromUuid(data.uuid);
        if (!actor) return;
        const id = await Store.request(this.realmId, "saveDrain", {drain: {name: actor.name, img: actor.img, actorUuid: actor.uuid, upkeep: {}}});
        await this.#editDrain(id);
    }

    async #editDrain(drainId) {
        const drain = Store.getRealmState(this.realmId).drains[drainId] ?? {name: "", img: "", upkeep: {}};
        const header = `
            <div class="form-group"><label>${game.i18n.localize("CHEX.Label")}</label>
                <input type="text" name="name" value="${foundry.utils.escapeHTML(drain.name ?? "")}" required></div>
            <input type="hidden" name="img" value="${foundry.utils.escapeHTML(drain.img ?? "")}">`;
        const data = await UI.editAmounts({
            title: game.i18n.localize("CHEX.ECONOMY.Kingdom.EditDrain"),
            values: drain.upkeep,
            header
        });
        if (!data) return;
        await Store.request(this.realmId, "saveDrain", {drain: {...drain, id: drainId, name: data.name, img: data.img, upkeep: data.amounts}});
    }

    /* -------------------------------------------- */

    static #onOpenSettlement(event, target) {
        SettlementSheet.open(this.realmId, target.closest("[data-settlement-id]").dataset.settlementId);
    }

    static async #onCreateSettlement() {
        const sizes = Object.values(chex.settlementSizes).sort((a, b) => a.rank - b.rank);
        const options = sizes.map(s => `<option value="${s.id}">${foundry.utils.escapeHTML(s.label)}</option>`).join("");
        const data = await foundry.applications.api.DialogV2.input({
            window: {title: "CHEX.ECONOMY.Kingdom.CreateSettlement", icon: "fa-solid fa-city"},
            content: `
                <div class="form-group"><label>${game.i18n.localize("CHEX.Label")}</label><input type="text" name="name" required autofocus></div>
                <div class="form-group"><label>${game.i18n.localize("CHEX.ECONOMY.Settlement.Size")}</label><select name="size">${options}</select></div>
                <p class="hint">${game.i18n.localize("CHEX.ECONOMY.Kingdom.CreateSettlementHint")}</p>`,
            rejectClose: false
        });
        if (!data) return;
        const id = await Store.request(this.realmId, "createSettlement", {name: data.name, size: data.size});
        SettlementSheet.open(this.realmId, id);
    }

    static #onPanTo(event, target) {
        const settlementId = target.closest("[data-settlement-id]").dataset.settlementId;
        SettlementSheet.panTo(Store.getRealmState(this.realmId).settlements[settlementId]);
    }

    static async #onEditStockpile() {
        const data = await UI.editAmounts({
            title: game.i18n.localize("CHEX.ECONOMY.Kingdom.EditStockpile"),
            values: Store.getRealmState(this.realmId).stockpile,
            groups: false
        });
        if (data) await Store.request(this.realmId, "setStockpile", {stockpile: data.amounts});
    }

    static async #onAddDrain() {
        await this.#editDrain(foundry.utils.randomID());
    }

    static async #onEditDrain(event, target) {
        await this.#editDrain(target.closest("[data-drain-id]").dataset.drainId);
    }

    static async #onToggleDrain(event, target) {
        const drain = Store.getRealmState(this.realmId).drains[target.closest("[data-drain-id]").dataset.drainId];
        await Store.request(this.realmId, "saveDrain", {drain: {...drain, active: drain.active === false}});
    }

    static async #onDeleteDrain(event, target) {
        const drainId = target.closest("[data-drain-id]").dataset.drainId;
        const drain = Store.getRealmState(this.realmId).drains[drainId];
        if (!await UI.confirm(game.i18n.localize("CHEX.ECONOMY.Kingdom.DeleteDrain"), game.i18n.format("CHEX.ECONOMY.ConfirmDelete", {name: foundry.utils.escapeHTML(drain.name)}))) return;
        await Store.request(this.realmId, "deleteDrain", {drainId});
    }

    static async #onEndTurn() {
        const confirmed = await UI.confirm(game.i18n.localize("CHEX.ECONOMY.Kingdom.EndTurn"),
            game.i18n.format("CHEX.ECONOMY.Kingdom.EndTurnConfirm", {realm: foundry.utils.escapeHTML(this.realm.label)}));
        if (!confirmed) return;
        const {result, before} = await Store.request(this.realmId, "endTurn");
        await postTurnReport(this.realmId, result, before);
    }

    static async #onRespondOffer(event, target) {
        const row = target.closest("[data-offer-id]");
        const accept = target.dataset.accept === "true";
        const result = await Store.request(this.realmId, "respondOffer", {from: row.dataset.from, offerId: row.dataset.offerId, accept});
        const key = !result.accepted ? "Declined" : result.recurring ? "AgreementStarted" : "Accepted";
        ui.notifications.info(game.i18n.localize(`CHEX.ECONOMY.Trade.${key}`));
    }

    static async #onCancelOffer(event, target) {
        await Store.request(this.realmId, "cancelOffer", {offerId: target.closest("[data-offer-id]").dataset.offerId});
    }

    static async #onCancelAgreement(event, target) {
        const row = target.closest("[data-agreement-id]");
        if (!await UI.confirm(game.i18n.localize("CHEX.ECONOMY.Trade.CancelAgreement"), game.i18n.localize("CHEX.ECONOMY.Trade.CancelAgreementConfirm"))) return;
        await Store.request(this.realmId, "cancelAgreement", {owner: row.dataset.owner, agreementId: row.dataset.agreementId});
    }

    static #onOpenTrade() {
        TradeWindow.open(this.realmId);
    }
}
