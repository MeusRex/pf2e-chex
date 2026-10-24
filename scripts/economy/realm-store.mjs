import * as C from "../const.mjs";
import * as E from "./engine.mjs";

export const REALM_STATE_SETTING = "RealmState";
export const QUERY = `${C.MODULE_ID}.realm`;
const LOG_LENGTH = 10;

/**
 * The configured definitions in the shape the engine expects.
 */
export function getDefs() {
    return {
        resources: chex.resources,
        improvements: chex.improvements,
        buildings: chex.buildings,
        sizes: chex.settlementSizes
    };
}

export function emptyRealmState() {
    return {turn: 0, happiness: 100, stockpile: {}, settlements: {}, drains: {}, offers: {}, agreements: {}, log: []};
}

/**
 * A copy of the state of a realm.
 */
export function getRealmState(realmId) {
    const all = game.settings.get(C.MODULE_ID, REALM_STATE_SETTING) ?? {};
    return foundry.utils.mergeObject(emptyRealmState(), foundry.utils.deepClone(all[realmId] ?? {}));
}

export const PLAYER_REALM_SETTING = "PlayerRealm";

/**
 * Id of the realm the players manage, or "".
 */
export function playerRealm() {
    const id = game.settings.get(C.MODULE_ID, PLAYER_REALM_SETTING);
    return chex.realms[id] ? id : "";
}

/**
 * Can the user change the economy of the realm? GMs manage every realm, players the player kingdom.
 */
export function canManage(user, realmId) {
    return user.isGM || (!!realmId && realmId === playerRealm());
}

/**
 * Users that manage a realm, e.g. to whisper them.
 */
export function managers(realmId) {
    return game.users.filter(u => canManage(u, realmId));
}

/**
 * All hexes of all cHex scenes.
 * @returns {Generator<{sceneId: string, key: string, data: object}>}
 */
export function* allHexes() {
    for (const scene of game.scenes) {
        const hexes = scene.getFlag(C.MODULE_ID, C.CHEX_DATA_KEY)?.hexes;
        if (!hexes) continue;
        for (const [key, data] of Object.entries(hexes)) yield {sceneId: scene.id, key, data};
    }
}

/**
 * All settlements of all realms.
 * @returns {{realmId: string, settlement: object}[]}
 */
export function allSettlements() {
    const all = game.settings.get(C.MODULE_ID, REALM_STATE_SETTING) ?? {};
    return Object.entries(all)
        .filter(([realmId]) => chex.realms[realmId])
        .flatMap(([realmId, state]) => Object.values(state.settlements ?? {}).map(settlement => ({realmId, settlement})));
}

/**
 * The settlement located on a hex, if any.
 */
export function findSettlementAt(sceneId, hexKey) {
    return allSettlements().find(({settlement}) => settlement.sceneId === sceneId && String(settlement.hexKey) === String(hexKey)) ?? null;
}

export function realmHexProduction(realmId) {
    return E.hexProduction(allHexes(), realmId, getDefs());
}

/**
 * Stockpiles of all realms, by realm id.
 */
function allStockpiles(all) {
    return Object.fromEntries(Object.entries(all).map(([id, state]) => [id, state.stockpile]));
}

/**
 * Preview the next turn without changing anything.
 * @returns {{state: object, production: object, preview: object}}
 */
export function previewTurn(realmId) {
    const state = getRealmState(realmId);
    const production = realmHexProduction(realmId);
    const partners = {};
    for (const agreement of Object.values(state.agreements)) partners[agreement.partner] = getRealmState(agreement.partner).stockpile;
    return {state, production, preview: E.simulateTurn(state, getDefs(), production.total, {partners})};
}

/**
 * Pending trade offers made to a realm.
 * @returns {{from: string, offer: object}[]}
 */
export function incomingOffers(realmId) {
    return Object.keys(chex.realms).filter(id => id !== realmId).flatMap(from =>
        Object.values(getRealmState(from).offers).filter(o => o.partner === realmId).map(offer => ({from, offer})));
}

/**
 * Trade agreements of other realms with this realm.
 * @returns {{owner: string, agreement: object}[]}
 */
export function incomingAgreements(realmId) {
    return Object.keys(chex.realms).filter(id => id !== realmId).flatMap(owner =>
        Object.values(getRealmState(owner).agreements).filter(a => a.partner === realmId).map(agreement => ({owner, agreement})));
}

/* -------------------------------------------- */
/*  Operations                                  */
/* -------------------------------------------- */

/**
 * Operations change a realm state in place and may return a result for the caller.
 * gm: only the GM may run it, otherwise players may too if it's the player kingdom.
 */
const OPERATIONS = {
    setStockpile: {gm: true, run(state, {stockpile}) {
        state.stockpile = E.addAmounts({}, stockpile);
    }},

    createSettlement: {gm: true, run(state, {name, size, sceneId, hexKey}) {
        if (!chex.settlementSizes[size]) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.UnknownSize"));
        if (hexKey && findSettlementAt(sceneId, hexKey)) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.HexOccupied"));
        const id = foundry.utils.randomID();
        state.settlements[id] = {id, name: name || game.i18n.localize("CHEX.ECONOMY.NewSettlement"), size, sceneId: sceneId ?? "", hexKey: hexKey ?? "", buildings: [], happiness: 100};
        return id;
    }},

    updateSettlement: {gm: true, run(state, {settlementId, changes}) {
        const settlement = requireSettlement(state, settlementId);
        if ("size" in changes && !chex.settlementSizes[changes.size]) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.UnknownSize"));
        const occupant = changes.hexKey ? findSettlementAt(changes.sceneId ?? settlement.sceneId, changes.hexKey) : null;
        if (occupant && occupant.settlement.id !== settlementId) {
            throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.HexOccupied"));
        }
        for (const field of ["name", "size", "sceneId", "hexKey"]) {
            if (field in changes) settlement[field] = changes[field];
        }
    }},

    // hand a settlement with its buildings to another realm. The stockpile stays with the old realm.
    transferSettlement: {gm: true, run(state, {realmId, settlementId, to}, {all}) {
        const settlement = requireSettlement(state, settlementId);
        if (!all[to] || to === realmId) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.UnknownRealm"));
        delete state.settlements[settlementId];
        all[to].settlements[settlementId] = settlement;
    }},

    deleteSettlement: {gm: true, run(state, {settlementId}) {
        requireSettlement(state, settlementId);
        delete state.settlements[settlementId];
    }},

    build: {gm: false, run(state, {settlementId, building}) {
        const settlement = requireSettlement(state, settlementId);
        const defs = getDefs();
        const reason = E.canBuild(state.stockpile, settlement, building, defs);
        if (reason) throw new Error(game.i18n.localize(reason));
        E.tryPay(state.stockpile, defs.buildings[building].cost, defs.resources);
        settlement.buildings.push({uid: foundry.utils.randomID(), type: building});
    }},

    demolish: {gm: false, run(state, {settlementId, uid}) {
        const settlement = requireSettlement(state, settlementId);
        settlement.buildings = settlement.buildings.filter(b => b.uid !== uid);
    }},

    saveDrain: {gm: false, run(state, {drain}) {
        const id = drain.id || foundry.utils.randomID();
        state.drains[id] = {
            id,
            name: drain.name ?? "",
            img: drain.img ?? "",
            actorUuid: drain.actorUuid ?? "",
            upkeep: E.addAmounts({}, drain.upkeep),
            active: drain.active !== false,
            paid: state.drains[id]?.paid ?? true
        };
        return id;
    }},

    deleteDrain: {gm: false, run(state, {drainId}) {
        delete state.drains[drainId];
    }},

    proposeTrade: {gm: false, run(state, {realmId, partner, give, receive, recurring}, {user}) {
        if (!chex.realms[partner] || partner === realmId) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.UnknownRealm"));
        give = positiveAmounts(give);
        receive = positiveAmounts(receive);
        if (!Object.keys(give).length && !Object.keys(receive).length) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.EmptyTrade"));
        if (!recurring && !E.tryPay({...state.stockpile}, give, chex.resources)) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.CantAfford"));
        const id = foundry.utils.randomID();
        state.offers[id] = {id, partner, give, receive, recurring: !!recurring, by: user.id};
        return id;
    }},

    cancelOffer: {gm: false, run(state, {offerId}) {
        delete state.offers[offerId];
    }},

    // runs for the realm the offer was made to
    respondOffer: {gm: false, run(state, {realmId, from, offerId, accept}, {all}) {
        const fromState = all[from];
        const offer = fromState?.offers[offerId];
        if (!offer || offer.partner !== realmId) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.UnknownOffer"));
        delete fromState.offers[offerId];
        if (!accept) return {accepted: false};
        if (offer.recurring) {
            fromState.agreements[offer.id] = {id: offer.id, partner: realmId, give: offer.give, receive: offer.receive, executed: null};
        } else if (!E.exchange(fromState.stockpile, offer.give, state.stockpile, offer.receive, chex.resources)) {
            throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.TradeCantAfford"));
        }
        return {accepted: true, recurring: offer.recurring};
    }},

    // either side may cancel an agreement
    cancelAgreement: {gm: false, run(state, {realmId, owner, agreementId}, {all}) {
        const agreement = all[owner]?.agreements[agreementId];
        if (!agreement || (owner !== realmId && agreement.partner !== realmId)) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.UnknownOffer"));
        delete all[owner].agreements[agreementId];
    }},

    endTurn: {gm: true, run(state, {realmId}, {all}) {
        const production = E.hexProduction(allHexes(), realmId, getDefs());
        const result = E.simulateTurn(state, getDefs(), production.total, {partners: allStockpiles(all)});
        const before = state.stockpile;
        for (const [partner, stockpile] of Object.entries(result.partnerStockpiles)) {
            if (all[partner]) all[partner].stockpile = stockpile;
        }
        for (const [id, ok] of Object.entries(result.trades)) state.agreements[id].executed = ok;
        state.turn += 1;
        state.stockpile = result.stockpile;
        for (const [id, s] of Object.entries(result.settlements)) state.settlements[id].happiness = s.happiness;
        for (const [id, paid] of Object.entries(result.drains)) state.drains[id].paid = paid;
        state.happiness = result.happiness;
        state.log = [{turn: state.turn, happiness: result.happiness, net: E.netChange(before, result.stockpile)}, ...state.log].slice(0, LOG_LENGTH);
        return {result, before};
    }}
};

function positiveAmounts(amounts) {
    return Object.fromEntries(Object.entries(amounts ?? {})
        .map(([id, amount]) => [id, Math.floor(Number(amount) || 0)])
        .filter(([id, amount]) => chex.resources[id] && amount > 0));
}

function requireSettlement(state, settlementId) {
    const settlement = state.settlements[settlementId];
    if (!settlement) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.UnknownSettlement"));
    return settlement;
}

// GM side: operations are applied one after another, so concurrent requests can't overwrite each other.
let queue = Promise.resolve();

async function apply({realmId, op, data}, user) {
    const operation = OPERATIONS[op];
    if (!operation) throw new Error(`cHex | Unknown realm operation ${op}`);
    if (!chex.realms[realmId]) throw new Error(`cHex | Unknown realm ${realmId}`);
    if (operation.gm ? !user.isGM : !canManage(user, realmId)) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.NoPermission"));

    // operations may change other realms too (trades), so they work on a copy of everything
    const all = {};
    for (const id of Object.keys(chex.realms)) all[id] = getRealmState(id);
    const result = operation.run(all[realmId], {...data, realmId}, {all, user});
    await game.settings.set(C.MODULE_ID, REALM_STATE_SETTING, all);
    return result ?? null;
}

/**
 * Handler of the GM query.
 */
export function handleQuery(queryData, {user}) {
    const run = queue.then(() => apply(queryData, user));
    queue = run.catch(() => {});
    return run;
}

/**
 * Change a realm. Runs on the active GM's client.
 * @param {string} realmId
 * @param {string} op       name of the operation
 * @param {object} data     operation parameters
 */
export async function request(realmId, op, data = {}) {
    try {
        if (game.user.isGM) return await handleQuery({realmId, op, data}, {user: game.user});
        const gm = game.users.activeGM;
        if (!gm) throw new Error(game.i18n.localize("CHEX.ECONOMY.Error.NoGM"));
        return await gm.query(QUERY, {realmId, op, data});
    } catch (error) {
        ui.notifications.error(error.message);
        throw error;
    }
}
