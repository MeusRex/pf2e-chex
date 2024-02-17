import { FALLBACK_COLOR, FALLBACK_LABEL, FALLBACK_MULTIPLIER } from "../const.mjs";

export class Travel {
    constructor(id?: string, label?: string, multiplier?: number, color?: string, special?: boolean) {
        this.id = id || foundry.utils.randomID();
        this.label = label || this.id;
        this.multiplier = multiplier || 1;
        this.color = color || "#FFFFFF";
        this.special = special || false;
    }

    id: string;
    label: string;
    multiplier: number;
    color: string;
    /**
     * if true, skip this when determining the next travel speed.
     * an example of this would be water. Difficult terrain would not suddenly turn into water type travel
     */
    special: boolean;

    static getDefaults(): { [key: string]: Travel } {
        return {
            open: new Travel("open", "Open", 1, "#00ff00", false),
            water: new Travel("water", "Water", 1.5, "#0000ff", true),
            difficult: new Travel("difficult", "Difficult", 2, "#ffa500", false),
            greater: new Travel("greater", "Greater", 3, "#ff0000", false),
            impassable: new Travel("impassable", "Impassable", 999, "#000000", false)
        };
    }

    static getFallback(): Travel {
        return new Travel(undefined, FALLBACK_LABEL, FALLBACK_MULTIPLIER, FALLBACK_COLOR, false);
    }
}