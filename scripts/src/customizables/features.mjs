import { FALLBACK_IMAGE, FALLBACK_LABEL } from "../const.mjs";
export class Feature {
    constructor(id, label, img) {
        this.id = id ?? foundry.utils.randomID();
        this.label = label ?? this.id;
        this.img = img ?? "";
    }
    id;
    label;
    img;
    static getDefaults() {
        return {
            river: new Feature("river", "River", "icons/environment/settlement/bridge-stone.webp")
        };
    }
    static getFallback() {
        return new Feature(undefined, FALLBACK_LABEL, FALLBACK_IMAGE);
    }
}
