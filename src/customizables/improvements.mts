import { FALLBACK_IMAGE, FALLBACK_LABEL } from "../const.mjs";

export class Improvement {
    constructor(id?: string, label?: string, img?: string, special?: string) {
        this.id = id || foundry.utils.randomID();
        this.label = label || this.id;
        this.img = img || "";
        this.special = special || "";
    }

    id: string;
    label: string;
    img: string;
    special: string;

    static getDefaults(): { [key: string]: Improvement } {
        return {
            road: new Improvement("road", "Road", "icons/environment/wilderness/terrain-river-road-gray.webp", "travel: -1"),
            mine: new Improvement("mine", "Mine", "icons/environment/wilderness/mine-exterior-entrance.webp", "income: ore: +1"),
            quarry: new Improvement("quarry", "Quarry", "icons/environment/settlement/quarry.webp", "income: stone: +1"),
            lumbercamp: new Improvement("lumbercamp", "Lumbercamp", "icons/environment/settlement/lumbermill.webp", "income: lumber: +1")
        };
    }

    static getFallback(): Improvement {
        return new Improvement(undefined, FALLBACK_LABEL, FALLBACK_IMAGE, "");
    }
}