export class Realm {
    constructor(id?: string, label?: string, color?: string) {
        this.id = id;
        this.label = label;
        this.color = color;
    }

    id?: string;
    label?: string;
    color?: string;

    static getDefaults(): any {
        return {
            helas: new Realm("helas", "Council of Helas", "#ff0000"),
        };
    }
}