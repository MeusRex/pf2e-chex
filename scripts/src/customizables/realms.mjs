import { FALLBACK_COLOR, FALLBACK_LABEL } from "../const.mjs";
export class Realm {
    constructor(id, label, color) {
        this.id = id || foundry.utils.randomID();
        this.label = label || this.id;
        this.color = color || "#FFFFFF";
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
