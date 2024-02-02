export class Feature {
    constructor(id?: string, label?: string, img?: string) {
        this.id = id;
        this.label = label;
        this.img = img;
    }

    id?: string;
    label?: string;
    img?: string;

    static getDefaults(): any {
        return {
            river: new Feature("river", "River", "icons/environment/settlement/bridge-stone.webp")
        };
    }
}