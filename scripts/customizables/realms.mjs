export const DEFAULT_REALM_IMAGE = "icons/sundries/flags/banner-flag-white.webp";

export class Realm {
    constructor(id, label, color, img = DEFAULT_REALM_IMAGE) {
        this.id = id;
        this.label = label;
        this.color = color;
        this.img = img;
    }

    id;
    label;
    /**
     * Color of the realm's borders on the map.
     * @type {string}
     */
    color;
    /**
     * Flag or heraldry, shown together with the color.
     * @type {string}
     */
    img;

    static getDefaults() {
        return {
            helas: new Realm("helas", "Council of Helas", "#ff0000", "icons/sundries/flags/banner-symbol-sun-gold-red.webp"),
        };
    }
}
