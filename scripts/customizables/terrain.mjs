export class Terrain {
    constructor(id, label, img, travel, color) {
        this.id = id;
        this.label = label;
        this.img = img;
        this.travel = travel;
        this.color = color;
    }

    id;
    label;
    img;
    /**
     * Id of the default travel type of hexes with this terrain.
     * @type {string}
     */
    travel;
    color;

    static getDefaults() {
        return {
            plains: new Terrain("plains", "Plains", "icons/environment/settlement/scarecrow.webp", "open", "#66ff00"),
            forest: new Terrain("forest", "Forest", "icons/environment/wilderness/tree-spruce.webp", "greater", "#008000"),
            hills: new Terrain("hills", "Hills", "icons/environment/wilderness/cave-entrance.webp", "difficult", "#8b4513"),
            mountains: new Terrain("mountains", "Mountains", "icons/environment/wilderness/cave-entrance-mountain-blue.webp", "greater", "#696969"),
            wetlands: new Terrain("wetlands", "Wetlands", "icons/environment/settlement/bridge-stone.webp", "difficult", "#ee82ee"),
            swamp: new Terrain("swamp", "Swamp", "icons/magic/nature/tree-spirit-black.webp", "greater", "#663399"),
            water: new Terrain("water", "Water", "icons/environment/wilderness/island.webp", "water", "#0000ff"),
            desert: new Terrain("desert", "Desert", "icons/environment/wilderness/cave-entrance-rocky.webp", "open", "#ffff00")
        };
    }
}
