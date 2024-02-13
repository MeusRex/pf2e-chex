import { FALLBACK_IMAGE, FALLBACK_LABEL } from "src/const.mjs";

export class Resource implements IImage {
    constructor(id?: string, label?: string, img?: string) {
        this.id = id;
        this.label = label;
        this.img = img;
    }

    id?: string;
    label?: string;
    img?: string;

    static getDefaults(): { [key: string]: Resource } {
        return {
            stone: new Resource("stone", "Stone", "icons/commodities/stone/masonry-block-cube-tan.webp"),
            lumber: new Resource("lumber", "Lumber", "icons/commodities/wood/lumber-stack.webp"),
            ore: new Resource("ore", "Ore", "icons/commodities/metal/ingot-stack-steel.webp"),
            food: new Resource("food", "Food", "icons/consumables/food/cooked-grilled-ham-hock-glazed-brown.webp"),
            luxuries: new Resource("luxuries", "Luxuries", "icons/commodities/gems/gems-faceted-pink-crate.webp")
        };
    }

    static getFallback(): Resource {
        return new Resource(undefined, FALLBACK_LABEL, FALLBACK_IMAGE);
    }
}