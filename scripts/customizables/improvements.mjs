export class Improvement {
    constructor(id, label, img, special) {
        this.id = id
        this.label = label;
        this.img = img;
        this.special = special;
    }

    id;
    label;
    img;
    special;

    static getDefaults() {
        return {
            road: new Improvement("road", "Road", "", "travel: -1"),
            mine: new Improvement("mine", "Mine", "ore: +1", ""),
            quarry: new Improvement("quarry", "Quarry", "stone: +1", ""),
            lumbercamp: new Improvement("lumbercamp", "Lumbercamp", "lumber: +1")
        };
    }
}