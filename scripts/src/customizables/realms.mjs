import { FALLBACK_COLOR, FALLBACK_LABEL } from "src/const.mjs";
export class Realm {
    constructor(id, label, color) {
        this.id = id;
        this.label = label;
        this.color = color;
    }
    id;
    label;
    color;
    static getDefaults() {
        return {
            helas: new Realm("helas", "Council of Helas", "#ff0000"),
        };
    }
    static getFallback() {
        return new Realm(undefined, FALLBACK_LABEL, FALLBACK_COLOR);
    }
}
