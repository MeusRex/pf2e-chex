import { FALLBACK_COLOR, FALLBACK_LABEL } from "../const.mjs";

export class Realm {
    constructor(id?: string, label?: string, color?: string) {
        this.id = id || foundry.utils.randomID();
        this.label = label || this.id;
        this.color = color || "#FFFFFF";
    }

    id: string;
    label: string;
    color: string;

    static getDefaults(): { [key: string]: Realm } {
        return {
            helas: new Realm("helas", "Council of Helas", "#ff0000"),
        };
    }

    static getFallback(): Realm {
        return new Realm(undefined, FALLBACK_LABEL, FALLBACK_COLOR);
    }
}