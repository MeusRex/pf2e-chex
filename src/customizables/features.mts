import { FALLBACK_IMAGE, FALLBACK_LABEL } from "src/const.mjs";

export class Feature {
    constructor(id?: string, label?: string, img?: string) {
        this.id = id;
        this.label = label;
        this.img = img;
    }

    id?: string;
    label?: string;
    img?: string;

    static getDefaults(): { [key: string]: Feature } {
        return {
            river: new Feature("river", "River", "icons/environment/settlement/bridge-stone.webp")
        };
    }

    static getFallback(): Feature {
        return new Feature(undefined, FALLBACK_LABEL, FALLBACK_IMAGE);
    }
}