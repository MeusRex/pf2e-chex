export class Travel {
    constructor(id, label, multiplier, color) {
        this.id = id;
        this.label = label;
        this.multiplier = multiplier;
        this.color = color;
    }

    id;
    label;
    multiplier;
    color;

    static getDefaults() {
        return {
            open: new Travel("open", "Open", 1, "#00ff00"),
            water: new Travel("water", "Water", 1.5, "#0000ff"),
            difficult: new Travel("difficult", "Difficult", 2, "#ffa500"),
            greater: new Travel("greater", "Greater", 3, "#ff0000"),
            impassable: new Travel("impassable", "Impassable", Infinity, "#000000")
        };
    }
}