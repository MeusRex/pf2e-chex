export class Terrain {
    constructor(id, label, img, toolIcon, travel, color) {
        this.id = id;
        this.label = label;
        this.img = img;
        this.toolIcon = toolIcon;
        this.travel = travel;
        this.color = color;
    }

    id;
    label;
    img;
    toolIcon;
    travel;
    color;

    static getDefaults() {
        return {
            plains: new Terrain("plains", "Plains", "icons/environment/settlement/scarecrow.webp", "fa-solid fa-road", "open", "#66ff00"),
            forest: new Terrain("forest", "Forest", "icons/environment/wilderness/tree-spruce.webp", "fa-solid fa-tree", "greater", "#008000"),
            hills: new Terrain("hills", "Hills", "icons/environment/wilderness/cave-entrance.webp", "fa-solid fa-cloud", "difficult", "#8b4513"),
            mountains: new Terrain("mountains", "Mountains", "icons/environment/wilderness/cave-entrance-mountain-blue.webp", "fa-solid fa-mountain", "greater", "#696969"),
            wetlands: new Terrain("wetlands", "Wetlands", "icons/environment/settlement/bridge-stone.webp", "fa-solid fa-bath", "difficult", "#ee82ee"),
            swamp: new Terrain("swamp", "Swamp", "icons/magic/nature/tree-spirit-black.webp", "fa-solid fa-bug", "greater", "#663399"),
            water: new Terrain("water", "Water", "icons/environment/wilderness/island.webp", "fa-solid fa-tint", "water", "0000ff"),
            desert: new Terrain("desert", "Desert", "icons/environment/wilderness/cave-entrance-rocky.webp", "fa-solid fa-sun", "open", "#ffff00")
        };
    }
}