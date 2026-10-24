export class Building {
    constructor(id, label, img, {cost = {}, upkeep = {}, production = {}, lots = 1, minSize = "", maxCount = 0} = {}) {
        this.id = id;
        this.label = label;
        this.img = img;
        this.cost = cost;
        this.upkeep = upkeep;
        this.production = production;
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
     * Resources consumed every turn. If they can't be paid, the building is idle for the turn.
     * @type {Record<string, number>}
     */
    upkeep;
    /**
     * Resources produced every turn while the building is active.
     * @type {Record<string, number>}
     */
    production;
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
        return {
            gardens: new Building("gardens", "Gardens", "icons/environment/settlement/farm-silo-windmill.webp",
                {cost: {lumber: 1}, production: {food: 1}}),
            charcoalkiln: new Building("charcoalkiln", "Charcoal Kiln", "icons/environment/settlement/pottery-shop-shed-red.webp",
                {cost: {stone: 2}, upkeep: {lumber: 2}, production: {coal: 1}}),
            smithy: new Building("smithy", "Smithy", "icons/environment/settlement/blacksmith.webp",
                {cost: {stone: 2, lumber: 2}, upkeep: {ore: 1, coal: 1}, production: {tools: 2}}),
            weaver: new Building("weaver", "Weaver", "icons/environment/settlement/market-stall.webp",
                {cost: {lumber: 2}, upkeep: {fibers: 2}, production: {cloth: 1}}),
            brewery: new Building("brewery", "Brewery", "icons/environment/settlement/tavern.webp",
                {cost: {lumber: 2, stone: 1}, upkeep: {food: 2}, production: {ale: 1}}),
            apothecary: new Building("apothecary", "Apothecary", "icons/environment/settlement/winemaker-still-vintner.webp",
                {cost: {lumber: 1, stone: 1, tools: 1}, upkeep: {herbs: 2}, production: {medicine: 1}, minSize: "town"}),
            jeweler: new Building("jeweler", "Jeweler", "icons/environment/settlement/wood-stall.webp",
                {cost: {stone: 2, tools: 1}, upkeep: {gems: 1}, production: {jewelry: 2}, minSize: "town"})
        };
    }
}
