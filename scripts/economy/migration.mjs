import * as C from "../const.mjs";
import { Resource } from "../customizables/resources.mjs";
import { Improvement } from "../customizables/improvements.mjs";
import { extractionCandidates, isExtracting, pickExtractedResource } from "./engine.mjs";

// formulas of the improvement defaults before v4. Unchanged ones are replaced by the new defaults.
const LEGACY_IMPROVEMENT_FORMULAS = {
    road: "travel: -1",
    mine: "income: ore: +1",
    lumbercamp: "income: lumber: +1"
};

const incomeRegex = /income: (\w+): ([+-]?\d+)/g;
const travelRegex = /travel: ([+-]?\d+)/;

/**
 * Fill in fields added to resources.
 * @returns {Record<string, Resource>}
 */
export function migrateResources(saved) {
    const defaults = Resource.getDefaults();
    const legacy = Resource.getLegacyDefaults();
    const fallback = {kind: "raw", category: "", group: "", spawnWeight: 0, tradeValue: 1};
    const result = {};
    for (const [id, resource] of Object.entries(saved ?? {})) {
        const base = defaults[id] ?? legacy[id] ?? fallback;
        result[id] = {
            id,
            label: resource.label,
            img: resource.img,
            kind: resource.kind ?? base.kind,
            category: resource.category ?? base.category,
            group: resource.group ?? base.group,
            spawnWeight: Number(resource.spawnWeight ?? base.spawnWeight) || 0,
            tradeValue: Number(resource.tradeValue ?? base.tradeValue) || 0
        };
    }
    return result;
}

/**
 * Convert the old formula strings of improvements into structured fields.
 * @param {object} saved        saved improvements
 * @param {object} resources    already migrated resources
 */
export function migrateImprovements(saved, resources) {
    const defaults = Improvement.getDefaults();
    const result = {};
    for (const [id, improvement] of Object.entries(saved ?? {})) {
        if (typeof improvement.special !== "string") {
            result[id] = {
                id,
                label: improvement.label,
                img: improvement.img,
                extracts: improvement.extracts ?? "",
                allowed: Array.isArray(improvement.allowed) ? improvement.allowed : [],
                yield: Number(improvement.yield ?? 1) || 0,
                travel: Number(improvement.travel ?? 0) || 0
            };
            continue;
        }

        const special = improvement.special.trim();
        if (defaults[id] && LEGACY_IMPROVEMENT_FORMULAS[id] === special) {
            result[id] = {...defaults[id], label: improvement.label, img: improvement.img};
            continue;
        }

        const converted = {id, label: improvement.label, img: improvement.img, extracts: "", allowed: [], yield: 1, travel: 0};
        const travel = special.match(travelRegex);
        if (travel) converted.travel = parseInt(travel[1]);
        const incomes = [...special.matchAll(incomeRegex)];
        if (incomes.length) {
            // an improvement extracts one category. Use the first income to determine it.
            const [, resourceId, amount] = incomes[0];
            converted.extracts = resources[resourceId]?.category || "surface";
            converted.allowed = incomes.map(m => m[1]);
            converted.yield = Math.max(1, parseInt(amount));
        }
        result[id] = converted;
    }
    return result;
}

/**
 * Migrate definitions in memory. Called during setup.
 * @returns {boolean} whether something changed and should be saved
 */
export function migrateDefinitions() {
    const before = JSON.stringify([chex.resources, chex.improvements]);
    chex.resources = migrateResources(chex.resources);
    chex.improvements = migrateImprovements(chex.improvements, chex.resources);
    return before !== JSON.stringify([chex.resources, chex.improvements]);
}

/**
 * Persist migrated definitions and assign extracted resources to improvements on hexes that lack one.
 * GM only, called once the game is ready.
 */
export async function persistMigration(definitionsChanged) {
    if (!game.user.isGM || game.user !== game.users.activeGM) return;

    if (definitionsChanged) {
        await game.settings.set(C.MODULE_ID, "Resource", chex.resources);
        await game.settings.set(C.MODULE_ID, "Improvement", chex.improvements);
        console.log("cHex | Migrated resource and improvement definitions");
    }

    for (const scene of game.scenes) {
        const sceneData = scene.getFlag(C.MODULE_ID, C.CHEX_DATA_KEY);
        if (!sceneData?.hexes) continue;
        const patches = {};
        for (const [key, hexData] of Object.entries(sceneData.hexes)) {
            const improvements = assignExtraction(hexData);
            if (improvements) patches[key] = {improvements};
        }
        if (Object.keys(patches).length) {
            await scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, {hexes: patches});
            console.log(`cHex | Assigned extracted resources to ${Object.keys(patches).length} hexes in ${scene.name}`);
        }
    }
}

/**
 * Make sure every extracting improvement on a hex has a resource. Keeps existing choices if still valid.
 * @returns {object[]|null} the new improvements array, or null if nothing changed
 */
export function assignExtraction(hexData) {
    let changed = false;
    const improvements = (hexData.improvements ?? []).map(instance => {
        const improvement = chex.improvements[instance.id];
        if (!isExtracting(improvement)) {
            if (instance.resource) {
                changed = true;
                return {...instance, resource: ""};
            }
            return instance;
        }
        // keep manual choices of the GM, as long as they fit the improvement's category or selection
        const current = chex.resources[instance.resource];
        const fits = current?.kind === "raw" && (current.category === improvement.extracts
            || extractionCandidates(improvement, chex.resources).some(c => c.id === current.id));
        if (fits) return instance;
        changed = true;
        return {...instance, resource: pickExtractedResource(improvement, hexData, chex.resources)};
    });
    return changed ? improvements : null;
}
