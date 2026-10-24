export const RESOURCE_KINDS = Object.freeze({
    raw: "CHEX.ECONOMY.Kind.raw",
    goods: "CHEX.ECONOMY.Kind.goods"
});

export const RESOURCE_CATEGORIES = Object.freeze({
    underground: "CHEX.ECONOMY.Category.underground",
    surface: "CHEX.ECONOMY.Category.surface",
    water: "CHEX.ECONOMY.Category.water"
});

export class Resource {
    constructor(id, label, img, {kind = "raw", category = "", group = "", spawnWeight = 0, tradeValue = 1} = {}) {
        this.id = id;
        this.label = label;
        this.img = img;
        this.kind = kind;
        this.category = category;
        this.group = group;
        this.spawnWeight = spawnWeight;
        this.tradeValue = tradeValue;
    }

    id;
    label;
    img;
    /**
     * raw or goods
     * @type {string}
     */
    kind;
    /**
     * underground, surface or water. Only relevant for raw resources.
     * @type {string}
     */
    category;
    /**
     * Optional group, e.g. food. Needs can ask for any resource of a group.
     * @type {string}
     */
    group;
    /**
     * Relative likelihood of being rolled when an improvement is placed on a hex without a matching deposit.
     * @type {number}
     */
    spawnWeight;
    /**
     * Value used to compare trade offers.
     * @type {number}
     */
    tradeValue;

    static getDefaults() {
        const raw = (category, group, spawnWeight, tradeValue) => ({kind: "raw", category, group, spawnWeight, tradeValue});
        const goods = (group, tradeValue) => ({kind: "goods", group, tradeValue});
        return {
            // underground
            stone: new Resource("stone", "Stone", "icons/commodities/stone/masonry-block-cube-tan.webp", raw("underground", "", 60, 1)),
            ore: new Resource("ore", "Ore", "icons/commodities/metal/ingot-stack-steel.webp", raw("underground", "", 25, 2)),
            coal: new Resource("coal", "Coal", "icons/commodities/stone/ore-chunk-black.webp", raw("underground", "", 10, 1)),
            gems: new Resource("gems", "Gems", "icons/commodities/gems/gem-rough-cushion-teal.webp", raw("underground", "", 5, 8)),
            // surface
            food: new Resource("food", "Grain", "icons/commodities/flowers/wheat-bundle.webp", raw("surface", "food", 50, 1)),
            livestock: new Resource("livestock", "Livestock", "icons/commodities/leather/fur-white.webp", raw("surface", "food", 25, 2)),
            fibers: new Resource("fibers", "Fibers", "icons/commodities/cloth/yarn-skein-white-grey.webp", raw("surface", "", 15, 1)),
            herbs: new Resource("herbs", "Herbs", "icons/commodities/flowers/clover.webp", raw("surface", "", 10, 2)),
            lumber: new Resource("lumber", "Lumber", "icons/commodities/wood/lumber-stack.webp", raw("surface", "", 30, 1)),
            // water
            fish: new Resource("fish", "Fish", "icons/consumables/meat/fish-whole-blue.webp", raw("water", "food", 65, 1)),
            salt: new Resource("salt", "Salt", "icons/consumables/food/salt-seasoning-spice-pink.webp", raw("water", "", 20, 2)),
            pearls: new Resource("pearls", "Pearls", "icons/commodities/gems/pearls-white.webp", raw("water", "luxury", 10, 8)),
            whaleoil: new Resource("whaleoil", "Whale Oil", "icons/consumables/potions/bottle-round-corked-yellow.webp", raw("water", "", 5, 4)),
            // goods
            tools: new Resource("tools", "Tools", "icons/tools/smithing/hammer-sledge-steel-grey.webp", goods("", 4)),
            cloth: new Resource("cloth", "Cloth", "icons/commodities/cloth/cloth-bolt-tan.webp", goods("", 3)),
            ale: new Resource("ale", "Ale", "icons/consumables/drinks/alcohol-beer-stein-wooden-brown.webp", goods("luxury", 3)),
            medicine: new Resource("medicine", "Medicine", "icons/consumables/potions/bottle-bulb-corked-glowing-red.webp", goods("", 5)),
            jewelry: new Resource("jewelry", "Jewelry", "icons/equipment/neck/amulet-round-engraved-gold.webp", goods("luxury", 15))
        };
    }

    /**
     * Defaults of earlier versions that are no longer shipped, but may still exist in worlds.
     */
    static getLegacyDefaults() {
        return {
            luxuries: {kind: "goods", category: "", group: "luxury", spawnWeight: 0, tradeValue: 5}
        };
    }
}
