export class Feature {
    constructor(id, label, img) {
        this.id = id;
        this.label = label;
        this.img = img;
    }

    id;
    label;
    img;

    static getDefaults() {
        return {
            river: new Feature("river", "River", "icons/environment/settlement/bridge-stone.webp")
        };
    }
}