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
            road: new Improvement("road", "Road", "icons/environment/wilderness/terrain-river-road-gray.webp", "travel: -1"),
            mine: new Improvement("mine", "Mine", "icons/environment/wilderness/mine-exterior-entrance.webp", "ore: +1"),
            quarry: new Improvement("quarry", "Quarry", "icons/environment/settlement/quarry.webp", "stone: +1"),
            lumbercamp: new Improvement("lumbercamp", "Lumbercamp", "icons/environment/settlement/lumbermill.webp", "lumber: +1")
        };
    }
}