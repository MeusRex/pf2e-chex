import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateImprovements, migrateResources, migrateRealms } from "../scripts/economy/migration.mjs";

const legacyResources = {
    stone: {id: "stone", label: "Stone", img: "a.webp"},
    lumber: {id: "lumber", label: "Lumber", img: "b.webp"},
    ore: {id: "ore", label: "Ore", img: "c.webp"},
    luxuries: {id: "luxuries", label: "Luxuries", img: "d.webp"},
    potions: {id: "potions", label: "Healing Potions", img: "e.webp"}
};

test("legacy resources get new fields and keep their labels", () => {
    const resources = migrateResources(legacyResources);
    assert.equal(resources.stone.category, "underground");
    assert.equal(resources.stone.label, "Stone");
    assert.equal(resources.luxuries.kind, "goods");
    assert.equal(resources.luxuries.group, "luxury");
    assert.equal(resources.potions.kind, "raw");
    assert.equal(resources.potions.spawnWeight, 0, "custom resources never spawn randomly");
});

test("unchanged legacy default improvements become the new defaults", () => {
    const resources = migrateResources(legacyResources);
    const improvements = migrateImprovements({
        road: {id: "road", label: "Road", img: "r", special: "travel: -1"},
        mine: {id: "mine", label: "Mine", img: "m", special: "income: ore: +1"}
    }, resources);
    assert.equal(improvements.road.travel, -1);
    assert.equal(improvements.road.extracts, "");
    assert.equal(improvements.mine.extracts, "underground");
    assert.deepEqual(improvements.mine.allowed, []);
    assert.equal(improvements.mine.special, undefined);
});

test("custom formulas are converted", () => {
    const resources = migrateResources(legacyResources);
    const improvements = migrateImprovements({
        quarry: {id: "quarry", label: "Quarry", img: "q", special: "income: stone: +1"},
        bigmine: {id: "bigmine", label: "Big Mine", img: "b", special: "income: ore: +3"},
        bridge: {id: "bridge", label: "Bridge", img: "x", special: "travel: -2"},
        statue: {id: "statue", label: "Statue", img: "s", special: ""}
    }, resources);
    assert.deepEqual(
        {extracts: improvements.quarry.extracts, allowed: improvements.quarry.allowed, yield: improvements.quarry.yield},
        {extracts: "underground", allowed: ["stone"], yield: 1});
    assert.equal(improvements.bigmine.yield, 3);
    assert.equal(improvements.bridge.travel, -2);
    assert.equal(improvements.statue.extracts, "");
});

test("migration is idempotent", () => {
    const resources = migrateResources(legacyResources);
    const once = migrateImprovements({mine: {id: "mine", label: "Mine", img: "m", special: "income: ore: +1"}}, resources);
    assert.deepEqual(migrateImprovements(once, resources), once);
    assert.deepEqual(migrateResources(resources), resources);
});

test("realms get owners", () => {
    assert.deepEqual(migrateRealms({a: {id: "a", label: "A", color: "#fff"}}).a.owners, []);
});
