export class Recipe {
    constructor(id, label, inputs = {}, outputs = {}) {
        this.id = id;
        this.label = label;
        this.inputs = inputs;
        this.outputs = outputs;
    }

    id;
    label;
    /**
     * Resources consumed when the recipe runs. Keys are resource ids or `group:<group>`.
     * @type {Record<string, number>}
     */
    inputs;
    /**
     * Resources produced when the recipe runs.
     * @type {Record<string, number>}
     */
    outputs;
}

export class Building {
    constructor(id, label, img, {cost = {}, upkeep = {}, recipes = [], lots = 1, minSize = "", maxCount = 0} = {}) {
        this.id = id;
        this.label = label;
        this.img = img;
        this.cost = cost;
        this.upkeep = upkeep;
        this.recipes = recipes;
        this.lots = lots;
        this.minSize = minSize;
        this.maxCount = maxCount;
    }

    id;
    label;
    img;
    /**
     * Resources paid once on construction. {resourceId: amount}
     * @type {Record<string, number>}
     */
    cost;
    /**
     * Resources consumed every turn in addition to the inputs of the recipe, e.g. food for the workers.
     * If they can't be paid, the building is idle for the turn.
     * @type {Record<string, number>}
     */
    upkeep;
    /**
     * What the building can make, in order of priority. One recipe runs per turn: the chosen one,
     * or with "auto" the first one whose inputs are available.
     * @type {Recipe[]}
     */
    recipes;
    /**
     * Lots the building occupies in a settlement.
     * @type {number}
     */
    lots;
    /**
     * Id of the smallest settlement size this can be built in. Empty for any.
     * @type {string}
     */
    minSize;
    /**
     * Maximum number per settlement. 0 for unlimited.
     * @type {number}
     */
    maxCount;

    static getDefaults() {
        const recipe = (id, label, inputs, outputs) => new Recipe(id, label, inputs, outputs);
        return {
            gardens: new Building("gardens", "Gardens", "icons/environment/settlement/farm-silo-windmill.webp", {
                cost: {lumber: 1},
                recipes: [recipe("grow", "Vegetables", {}, {food: 1})]
            }),
            charcoalkiln: new Building("charcoalkiln", "Charcoal Kiln", "icons/environment/settlement/pottery-shop-shed-red.webp", {
                cost: {stone: 2},
                recipes: [recipe("charcoal", "Charcoal", {lumber: 2}, {coal: 1})]
            }),
            smithy: new Building("smithy", "Smithy", "icons/environment/settlement/blacksmith.webp", {
                cost: {stone: 2, lumber: 2},
                recipes: [recipe("tools", "Tools", {ore: 1, coal: 1}, {tools: 2})]
            }),
            weaver: new Building("weaver", "Weaver", "icons/environment/settlement/market-stall.webp", {
                cost: {lumber: 2},
                recipes: [
                    recipe("fibers", "Linen", {fibers: 2}, {cloth: 1}),
                    recipe("wool", "Wool", {livestock: 1}, {cloth: 1})
                ]
            }),
            brewery: new Building("brewery", "Brewery", "icons/environment/settlement/tavern.webp", {
                cost: {lumber: 2, stone: 1},
                recipes: [
                    recipe("beer", "Beer", {food: 2}, {ale: 1}),
                    recipe("mead", "Mead", {herbs: 1, "group:food": 1}, {ale: 1})
                ]
            }),
            apothecary: new Building("apothecary", "Apothecary", "icons/environment/settlement/winemaker-still-vintner.webp", {
                cost: {lumber: 1, stone: 1, tools: 1}, minSize: "town",
                recipes: [
                    recipe("remedies", "Remedies", {herbs: 2}, {medicine: 1}),
                    recipe("salves", "Salves", {herbs: 1, whaleoil: 1}, {medicine: 1})
                ]
            }),
            jeweler: new Building("jeweler", "Jeweler", "icons/environment/settlement/wood-stall.webp", {
                cost: {stone: 2, tools: 1}, minSize: "town",
                recipes: [
                    recipe("gems", "Gemstones", {gems: 1}, {jewelry: 2}),
                    recipe("pearls", "Pearls", {pearls: 1}, {jewelry: 2})
                ]
            })
        };
    }
}
