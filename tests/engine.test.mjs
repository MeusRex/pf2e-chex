// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../scripts/economy/engine.mjs";
import { Resource } from "../scripts/customizables/resources.mjs";
import { Improvement } from "../scripts/customizables/improvements.mjs";
import { Building } from "../scripts/customizables/buildings.mjs";
import { SettlementSize } from "../scripts/customizables/settlement-sizes.mjs";

const plain = obj => JSON.parse(JSON.stringify(obj));
const defs = plain({
    resources: Resource.getDefaults(),
    improvements: Improvement.getDefaults(),
    buildings: Building.getDefaults(),
    sizes: SettlementSize.getDefaults()
});

test("mine prefers a deposit on the hex", () => {
    const hex = {resources: [{id: "gems", amount: 2}]};
    assert.equal(E.pickExtractedResource(defs.improvements.mine, hex, defs.resources), "gems");
});

test("deposit of the wrong category is ignored", () => {
    const hex = {resources: [{id: "fish", amount: 1}]};
    const picked = E.pickExtractedResource(defs.improvements.mine, hex, defs.resources, () => 0);
    assert.equal(defs.resources[picked].category, "underground");
});

test("random mine mostly yields stone", () => {
    let seed = 1;
    const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const counts = {};
    for (let i = 0; i < 2000; i++) {
        const id = E.pickExtractedResource(defs.improvements.mine, {}, defs.resources, rng);
        counts[id] = (counts[id] ?? 0) + 1;
    }
    assert.ok(counts.stone > counts.ore && counts.ore > counts.gems, JSON.stringify(counts));
});

test("allowed list restricts candidates", () => {
    assert.equal(E.pickExtractedResource(defs.improvements.lumbercamp, {}, defs.resources), "lumber");
    for (let i = 0; i < 50; i++) {
        assert.notEqual(E.pickExtractedResource(defs.improvements.farm, {}, defs.resources), "lumber");
    }
});

test("hex production only counts the realm's claimed hexes and multiplies deposits", () => {
    const hexes = [
        {sceneId: "s", key: "1", data: {claimed: "a", improvements: [{id: "mine", resource: "ore"}], resources: [{id: "ore", amount: 3}]}},
        {sceneId: "s", key: "2", data: {claimed: "a", improvements: [{id: "farm", resource: "food"}, {id: "road"}]}},
        {sceneId: "s", key: "3", data: {claimed: "b", improvements: [{id: "farm", resource: "food"}]}}
    ];
    const {total, sites} = E.hexProduction(hexes, "a", defs);
    assert.deepEqual(total, {ore: 3, food: 1});
    assert.equal(sites.length, 2);
});

test("tryPay is all or nothing", () => {
    const stock = {stone: 1, lumber: 5};
    assert.equal(E.tryPay(stock, {stone: 2, lumber: 2}, defs.resources), null);
    assert.deepEqual(stock, {stone: 1, lumber: 5});
    assert.deepEqual(E.tryPay(stock, {stone: 1, lumber: 2}, defs.resources), {stone: 1, lumber: 2});
    assert.deepEqual(stock, {lumber: 3});
});

test("group needs take from the largest stock", () => {
    const stock = {food: 1, fish: 3};
    assert.deepEqual(E.take(stock, "group:food", 2, defs.resources), {fish: 2});
});

test("canBuild checks size, lots and cost", () => {
    const village = {size: "village", buildings: []};
    assert.equal(E.canBuild({stone: 9, tools: 9}, village, "jeweler", defs), "CHEX.ECONOMY.Error.TooSmall");
    assert.equal(E.canBuild({}, village, "smithy", defs), "CHEX.ECONOMY.Error.CantAfford");
    assert.equal(E.canBuild({stone: 2, lumber: 2}, village, "smithy", defs), null);
    const full = {size: "village", buildings: [{uid: "1", type: "gardens"}, {uid: "2", type: "gardens"}]};
    assert.equal(E.canBuild({lumber: 9}, full, "gardens", defs), "CHEX.ECONOMY.Error.NoLots");
});

test("turn: upkeep, production, needs, happiness and drains", () => {
    const state = {
        stockpile: {ore: 1, coal: 0, fibers: 2, food: 1},
        settlements: {
            t: {id: "t", size: "town", buildings: [{uid: "w", type: "weaver"}, {uid: "s", type: "smithy"}]},
            v: {id: "v", size: "village", buildings: []}
        },
        drains: {army: {id: "army", upkeep: {"group:food": 1}, active: true}}
    };
    const result = E.simulateTurn(state, defs, {fish: 1});
    // smithy lacks coal -> idle; weaver runs and produces cloth
    assert.equal(result.buildings.t.s, false);
    assert.equal(result.buildings.t.w, true);
    // food demand 3 (town 2 + village 1), food available 2 (1 food + 1 fish)
    assert.equal(result.settlements.t.needs["group:food"].received, 2 * 2 / 3);
    // town: 1 cloth of 1 + 4/3 food of 2 -> 7/9
    assert.equal(result.settlements.t.happiness, Math.round(100 * (1 + 4 / 3) / 3));
    assert.equal(result.settlements.v.happiness, 67);
    assert.equal(result.happiness, Math.round(100 * (1 + 2) / 4));
    // nothing left for the army
    assert.equal(result.drains.army, false);
    assert.deepEqual(result.stockpile, {ore: 1});
    assert.deepEqual(state.stockpile, {ore: 1, coal: 0, fibers: 2, food: 1}, "input state must not change");
});

test("trade agreements execute only if both sides can pay", () => {
    const state = {
        stockpile: {stone: 5},
        agreements: {
            a: {id: "a", partner: "p", give: {stone: 2}, receive: {fish: 1}},
            b: {id: "b", partner: "p", give: {stone: 2}, receive: {gems: 1}}
        }
    };
    const result = E.simulateTurn(state, defs, {}, {partners: {p: {fish: 3}}});
    assert.equal(result.trades.a, true);
    assert.equal(result.trades.b, false, "partner has no gems");
    assert.deepEqual(result.partnerStockpiles.p, {fish: 2, stone: 2});
    assert.equal(result.stockpile.stone, 3);
    assert.deepEqual(result.traded.received, {fish: 1});
});

test("exchange is all or nothing", () => {
    const a = {stone: 1};
    const b = {fish: 1};
    assert.equal(E.exchange(a, {stone: 2}, b, {fish: 1}, defs.resources), false);
    assert.deepEqual([a, b], [{stone: 1}, {fish: 1}]);
    assert.equal(E.exchange(a, {stone: 1}, b, {fish: 1}, defs.resources), true);
    assert.deepEqual([a, b], [{fish: 1}, {stone: 1}]);
});

test("settlements without needs are fully happy", () => {
    const sizes = {...defs.sizes, camp: {id: "camp", rank: 0, lots: 1, needs: {}}};
    const result = E.simulateTurn({settlements: {c: {id: "c", size: "camp"}}}, {...defs, sizes});
    assert.equal(result.settlements.c.happiness, 100);
    assert.equal(result.happiness, 100);
});
