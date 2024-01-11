export class Feature {
    constructor(id, label, name, img) {
        this.id = id;
        this.label = label;
        this.img = img;
    }

    id;
    label;
    name;
    img;

    static getDefaults() {
        return {
            river: new Feature("river", "River", "", "icons/environment/settlement/bridge-stone.webp")
        };
    }
}