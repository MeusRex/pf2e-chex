import { FALLBACK_IMAGE, FALLBACK_LABEL } from "src/const.mjs";
export class Resource {
    constructor(id, label, img) {
        this.id = id;
        this.label = label;
        this.img = img;
    }
    id;
    label;
    img;
    static getDefaults() {
        return {
            stone: new Resource("stone", "Stone", "icons/commodities/stone/masonry-block-cube-tan.webp"),
            lumber: new Resource("lumber", "Lumber", "icons/commodities/wood/lumber-stack.webp"),
            ore: new Resource("ore", "Ore", "icons/commodities/metal/ingot-stack-steel.webp"),
            food: new Resource("food", "Food", "icons/consumables/food/cooked-grilled-ham-hock-glazed-brown.webp"),
            luxuries: new Resource("luxuries", "Luxuries", "icons/commodities/gems/gems-faceted-pink-crate.webp")
        };
    }
    static getFallback() {
        return new Resource(undefined, FALLBACK_LABEL, FALLBACK_IMAGE);
    }
}
