import { FALLBACK_COLOR, FALLBACK_LABEL } from "src/const.mjs";

export class Realm {
    constructor(id?: string, label?: string, color?: string) {
        this.id = id;
        this.label = label;
        this.color = color;
    }

    id?: string;
    label?: string;
    color?: string;

    static getDefaults(): { [key: string]: Realm } {
        return {
            helas: new Realm("helas", "Council of Helas", "#ff0000"),
        };
    }

    static getFallback(): Realm {
        return new Realm(undefined, FALLBACK_LABEL, FALLBACK_COLOR);
    }
}