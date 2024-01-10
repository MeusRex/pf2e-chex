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
}