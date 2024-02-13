import { FALLBACK_COLOR, FALLBACK_LABEL, FALLBACK_MULTIPLIER } from "src/const.mjs";
export class Travel {
    constructor(id, label, multiplier, color, special) {
        this.id = id;
        this.label = label;
        this.multiplier = multiplier;
        this.color = color;
        this.special = special;
    }
    id;
    label;
    multiplier;
    color;
    /**
     * if true, skip this when determining the next travel speed.
     * an example of this would be water. Difficult terrain would not suddenly turn into water type travel
     */
    special;
    static getDefaults() {
        return {
            open: new Travel("open", "Open", 1, "#00ff00", false),
            water: new Travel("water", "Water", 1.5, "#0000ff", true),
            difficult: new Travel("difficult", "Difficult", 2, "#ffa500", false),
            greater: new Travel("greater", "Greater", 3, "#ff0000", false),
            impassable: new Travel("impassable", "Impassable", 999, "#000000", false)
        };
    }
    static getFallback() {
        return new Travel(undefined, FALLBACK_LABEL, FALLBACK_MULTIPLIER, FALLBACK_COLOR, false);
    }
}
