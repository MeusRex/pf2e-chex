export class Improvement {
    constructor(id, label, img, {extracts = "", allowed = [], yieldAmount = 1, travel = 0} = {}) {
        this.id = id
        this.label = label;
        this.img = img;
        this.extracts = extracts;
        this.allowed = allowed;
        this.yield = yieldAmount;
        this.travel = travel;
    }

    id;
    label;
    img;
    /**
     * Resource category this improvement extracts (underground, surface, water). Empty if it extracts nothing.
     * @type {string}
     */
    extracts;
    /**
     * Optional whitelist of resource ids. Empty means all raw resources of the category.
     * @type {string[]}
     */
    allowed;
    /**
     * Units produced per turn.
     * @type {number}
     */
    yield;
    /**
     * Steps by which the travel difficulty of the hex changes. Negative values make travel easier.
     * @type {number}
     */
    travel;

    static getDefaults() {
        return {
            road: new Improvement("road", "Road", "icons/environment/wilderness/terrain-river-road-gray.webp", {travel: -1}),
            mine: new Improvement("mine", "Mine", "icons/environment/wilderness/mine-exterior-entrance.webp", {extracts: "underground"}),
            farm: new Improvement("farm", "Farm", "icons/environment/settlement/house-farmland.webp", {extracts: "surface", allowed: ["food", "livestock", "fibers", "herbs"]}),
            lumbercamp: new Improvement("lumbercamp", "Lumbercamp", "icons/environment/settlement/lumbermill.webp", {extracts: "surface", allowed: ["lumber"]}),
            fishery: new Improvement("fishery", "Fishery", "icons/environment/settlement/abandoned-pier.webp", {extracts: "water"})
        };
    }
}
