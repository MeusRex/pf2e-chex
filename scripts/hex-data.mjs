export default class ChexData {
    static getKey(offset) {
        return (1000 * offset.row) + offset.col;
    }

    /**
     * The id of the terrain of this hex
     * @type {string}
     */
    terrain = "plains";
    /**
     * The id of the travel type of this hex.
     * @type {string}
     */
    travel = "open";
    /**
     * Discovered by party? Surveyed?
     * @type {number}
     */
    exploration = 0; //
    /**
     * @type {boolean}
     */
    cleared = false; //
    /**
     * The id of the kingdom that has claimed this hex
     * @type {string}
     */
    claimed = "";
    /**
     * A feature is something that is neither an improvement nor a resource. Features will generally not change during the game.
     * Ex. River, waterfall, volcano, ...
     * @type {ChexFeature[]}
     */
    features = [];
    /**
     * Improvements are structures or enchantments applied by someone that claimed the hex. 
     * That can be things like a mine, quarry, road, healing font, ...
     * @type {ChexImprovement[]}
     */
    improvements = [];
    /**
     * List of resources available on the hex. These are hidden until surveyed
     * @type {ChexResource[]}
     */
    resources = [];
    /**
     * Resources that the party/kingdom receives once the hex is visited
     * @type {ChexResource[]}
     */
    forageables = [];
}

export class ChexFeature {
    /**
     * @type {string}
     */
    type = "";
    /**
     * @type {string}
     */
    name = "";
    /**
     * @type {boolean}
     */
    show = false;
}

export class ChexImprovement {
    /**
     * @type {string}
     */
    type = "";
    /**
     * @type {string}
     */
    name = "";
    /**
     * @type {boolean}
     */
    show = false;
}

export class ChexResource {
    /**
     * @type {string}
     */
    type = "";
    /**
     * @type {string}
     */
    name = "";
    /**
     * @type {number}
     */
    amount = 1;
    /**
     * @type {boolean}
     */
    show = false;
}