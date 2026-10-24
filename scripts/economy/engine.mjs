/**
 * Pure economy calculations. No Foundry globals in here, so this can be tested outside of Foundry.
 *
 * Definitions (`defs`) are the configured customizables:
 * {resources, improvements, buildings, sizes}, each keyed by id.
 */

export const GROUP_PREFIX = "group:";

/**
 * Add the amounts of source to target, multiplied by factor.
 * @param {Record<string, number>} target
 * @param {Record<string, number>} source
 */
export function addAmounts(target, source = {}, factor = 1) {
    for (const [id, amount] of Object.entries(source)) {
        const value = (target[id] ?? 0) + (Number(amount) || 0) * factor;
        if (value === 0) delete target[id];
        else target[id] = value;
    }
    return target;
}

/**
 * Does the improvement extract resources at all?
 */
export function isExtracting(improvement) {
    return !!improvement && (!!improvement.extracts || (improvement.allowed?.length ?? 0) > 0);
}

/**
 * Raw resources an improvement may extract: the explicitly allowed ones,
 * otherwise all raw resources of its category.
 */
export function extractionCandidates(improvement, resources) {
    if (!isExtracting(improvement)) return [];
    const raw = Object.values(resources).filter(r => r.kind === "raw");
    const allowed = improvement.allowed ?? [];
    if (allowed.length) return raw.filter(r => allowed.includes(r.id));
    return raw.filter(r => r.category === improvement.extracts);
}

/**
 * Choose the resource an improvement extracts on a hex. A matching deposit on the hex wins,
 * otherwise a resource of the category is rolled using the spawn weights.
 * @returns {string} resource id or "" if nothing can be extracted
 */
export function pickExtractedResource(improvement, hexData, resources, rng = Math.random) {
    const candidates = extractionCandidates(improvement, resources);
    if (!candidates.length) return "";

    const deposit = (hexData?.resources ?? []).find(d => candidates.some(c => c.id === d.id));
    if (deposit) return deposit.id;

    const weighted = candidates.filter(c => Number(c.spawnWeight) > 0);
    const totalWeight = weighted.reduce((sum, c) => sum + Number(c.spawnWeight), 0);
    if (totalWeight <= 0) return candidates[0].id;

    let roll = rng() * totalWeight;
    for (const c of weighted) {
        roll -= Number(c.spawnWeight);
        if (roll < 0) return c.id;
    }
    return weighted.at(-1).id;
}

/**
 * Production of all hexes claimed by a realm.
 * @param {Iterable<{sceneId: string, key: string, data: object}>} hexes
 * @returns {{total: Record<string, number>, sites: object[]}}
 */
export function hexProduction(hexes, realmId, defs) {
    const total = {};
    const sites = [];
    for (const {sceneId, key, data} of hexes) {
        if (!data || data.claimed !== realmId) continue;
        for (const instance of data.improvements ?? []) {
            const improvement = defs.improvements[instance.id];
            if (!isExtracting(improvement) || !instance.resource) continue;
            const deposit = (data.resources ?? []).find(d => d.id === instance.resource);
            const amount = (Number(improvement.yield) || 0) * (deposit ? (Number(deposit.amount) || 1) : 1);
            if (amount <= 0) continue;
            addAmounts(total, {[instance.resource]: amount});
            sites.push({sceneId, key, improvement: improvement.id, resource: instance.resource, amount, deposit: !!deposit});
        }
    }
    return {total, sites};
}

/**
 * Resource ids that a key (resource id or group:<name>) refers to.
 */
export function resolveKey(key, resources) {
    if (key.startsWith(GROUP_PREFIX)) {
        const group = key.slice(GROUP_PREFIX.length);
        return Object.values(resources).filter(r => r.group === group).map(r => r.id);
    }
    return [key];
}

/**
 * Units available for a key.
 */
export function available(stock, key, resources) {
    return resolveKey(key, resources).reduce((sum, id) => sum + Math.max(0, stock[id] ?? 0), 0);
}

/**
 * Take up to amount units for a key. Groups take from the largest stock first.
 * @returns {Record<string, number>} what was actually taken
 */
export function take(stock, key, amount, resources) {
    const taken = {};
    const ids = resolveKey(key, resources);
    let remaining = amount;
    while (remaining > 0) {
        let best = null;
        for (const id of ids) {
            if ((stock[id] ?? 0) > 0 && (best === null || stock[id] > stock[best])) best = id;
        }
        if (best === null) break;
        const portion = ids.length === 1 ? Math.min(remaining, stock[best]) : 1;
        stock[best] -= portion;
        if (stock[best] === 0) delete stock[best];
        taken[best] = (taken[best] ?? 0) + portion;
        remaining -= portion;
    }
    return taken;
}

/**
 * Pay all of a cost map or nothing.
 * @returns {Record<string, number>|null} what was paid, or null if it couldn't be afforded
 */
export function tryPay(stock, cost, resources) {
    const trial = {...stock};
    const paid = {};
    // specific resources first, so groups don't eat what is explicitly needed
    const keys = Object.keys(cost ?? {}).sort((a, b) => a.startsWith(GROUP_PREFIX) - b.startsWith(GROUP_PREFIX));
    for (const key of keys) {
        const amount = Number(cost[key]) || 0;
        if (amount <= 0) continue;
        if (available(trial, key, resources) < amount) return null;
        addAmounts(paid, take(trial, key, amount, resources));
    }
    replace(stock, trial);
    return paid;
}

/**
 * Replace the content of an object in place.
 */
function replace(target, source) {
    for (const id of Object.keys(target)) delete target[id];
    Object.assign(target, source);
}

/**
 * Exchange resources between two stockpiles, all or nothing.
 * @returns {boolean} whether the exchange happened
 */
export function exchange(stockA, giveA, stockB, giveB, resources) {
    const a = {...stockA};
    const b = {...stockB};
    if (!tryPay(a, giveA, resources) || !tryPay(b, giveB, resources)) return false;
    addAmounts(a, giveB);
    addAmounts(b, giveA);
    replace(stockA, a);
    replace(stockB, b);
    return true;
}

/**
 * Lots used by the buildings of a settlement.
 */
export function usedLots(settlement, buildings) {
    return (settlement.buildings ?? []).reduce((sum, b) => sum + (Number(buildings[b.type]?.lots) || 0), 0);
}

/**
 * Check if a building can be constructed in a settlement.
 * @returns {string|null} reason why not (an i18n key), or null if allowed
 */
export function canBuild(stockpile, settlement, buildingId, defs) {
    const building = defs.buildings[buildingId];
    const size = defs.sizes[settlement.size];
    if (!building) return "CHEX.ECONOMY.Error.UnknownBuilding";
    if (!size) return "CHEX.ECONOMY.Error.UnknownSize";
    const minSize = defs.sizes[building.minSize];
    if (minSize && (Number(size.rank) || 0) < (Number(minSize.rank) || 0)) return "CHEX.ECONOMY.Error.TooSmall";
    if (usedLots(settlement, defs.buildings) + (Number(building.lots) || 0) > (Number(size.lots) || 0)) return "CHEX.ECONOMY.Error.NoLots";
    const count = (settlement.buildings ?? []).filter(b => b.type === buildingId).length;
    if (Number(building.maxCount) > 0 && count >= Number(building.maxCount)) return "CHEX.ECONOMY.Error.MaxCount";
    if (!tryPay({...stockpile}, building.cost, defs.resources)) return "CHEX.ECONOMY.Error.CantAfford";
    return null;
}

/**
 * Simulate one turn for a realm. Does not modify the given state.
 * @param {object} state                 realm state
 * @param {object} defs                  definitions
 * @param {Record<string, number>} hexIncome production of the realm's hexes
 * @param {object} [options]
 * @param {Record<string, Record<string, number>>} [options.partners] stockpiles of trade partners, by realm id
 */
export function simulateTurn(state, defs, hexIncome = {}, {partners = {}} = {}) {
    const {resources} = defs;
    const stock = addAmounts({}, state.stockpile);
    const settlements = Object.values(state.settlements ?? {});
    const result = {
        produced: {hexes: {...hexIncome}, buildings: {}},
        consumed: {buildings: {}, settlements: {}, drains: {}},
        traded: {given: {}, received: {}},
        trades: {},
        partnerStockpiles: {},
        buildings: {},
        settlements: {},
        drains: {},
        happiness: 100,
        stockpile: stock
    };

    // 0. trade agreements of this realm. Both sides have to be able to pay, otherwise nothing happens.
    for (const agreement of Object.values(state.agreements ?? {})) {
        const partnerStock = result.partnerStockpiles[agreement.partner] ??= addAmounts({}, partners[agreement.partner]);
        const ok = exchange(stock, agreement.give, partnerStock, agreement.receive, resources);
        result.trades[agreement.id] = ok;
        if (!ok) continue;
        addAmounts(result.traded.given, agreement.give);
        addAmounts(result.traded.received, agreement.receive);
    }

    // 1. hexes
    addAmounts(stock, hexIncome);

    // 2. buildings: pay upkeep, then add production of active buildings
    const pending = {};
    for (const settlement of settlements) {
        const states = result.buildings[settlement.id] = {};
        for (const instance of settlement.buildings ?? []) {
            const building = defs.buildings[instance.type];
            const paid = building ? tryPay(stock, building.upkeep, resources) : null;
            states[instance.uid] = !!paid;
            if (!paid) continue;
            addAmounts(result.consumed.buildings, paid);
            addAmounts(pending, building.production);
        }
    }
    addAmounts(stock, pending);
    addAmounts(result.produced.buildings, pending);

    // 3. settlement needs, shortages are shared proportionally
    const demand = {};
    for (const settlement of settlements) {
        const needs = defs.sizes[settlement.size]?.needs ?? {};
        result.settlements[settlement.id] = {required: 0, received: 0, happiness: 100, needs: {}};
        for (const [key, amount] of Object.entries(needs)) {
            const required = Number(amount) || 0;
            if (required <= 0) continue;
            (demand[key] ??= []).push({settlement: settlement.id, required});
        }
    }
    const keys = Object.keys(demand).sort((a, b) => a.startsWith(GROUP_PREFIX) - b.startsWith(GROUP_PREFIX));
    for (const key of keys) {
        const requests = demand[key];
        const total = requests.reduce((sum, r) => sum + r.required, 0);
        const delivered = Math.min(total, available(stock, key, resources));
        addAmounts(result.consumed.settlements, take(stock, key, delivered, resources));
        const ratio = total > 0 ? delivered / total : 1;
        for (const {settlement, required} of requests) {
            const entry = result.settlements[settlement];
            const received = required * ratio;
            entry.needs[key] = {required, received};
            entry.required += required;
            entry.received += received;
        }
    }
    let required = 0;
    let received = 0;
    for (const entry of Object.values(result.settlements)) {
        entry.happiness = entry.required > 0 ? Math.round(100 * entry.received / entry.required) : 100;
        required += entry.required;
        received += entry.received;
    }
    result.happiness = required > 0 ? Math.round(100 * received / required) : 100;

    // 4. drains
    for (const drain of Object.values(state.drains ?? {})) {
        if (drain.active === false) continue;
        const paid = tryPay(stock, drain.upkeep, resources);
        result.drains[drain.id] = !!paid;
        if (paid) addAmounts(result.consumed.drains, paid);
    }

    return result;
}

/**
 * Net change per resource of a simulated turn.
 */
export function netChange(before, after) {
    const net = {...after};
    addAmounts(net, before, -1);
    return net;
}
