export class Improvement {
    constructor(id?: string, label?: string, img?: string, special?: string) {
        this.id = id
        this.label = label;
        this.img = img;
        this.special = special;
    }

    id?: string;
    label?: string;
    img?: string;
    special?: string;

    static getDefaults(): any {
        return {
            road: new Improvement("road", "Road", "icons/environment/wilderness/terrain-river-road-gray.webp", "travel: -1"),
            mine: new Improvement("mine", "Mine", "icons/environment/wilderness/mine-exterior-entrance.webp", "income: ore: +1"),
            quarry: new Improvement("quarry", "Quarry", "icons/environment/settlement/quarry.webp", "income: stone: +1"),
            lumbercamp: new Improvement("lumbercamp", "Lumbercamp", "icons/environment/settlement/lumbermill.webp", "income: lumber: +1")
        };
    }
}