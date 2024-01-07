export default class ChexData {
    static getKey(offset) {
        return (1000 * offset.row) + offset.col;
    }

    page = "";
    /**
     * @type {string}
     */
    discoveryTrait = "";
    /**
     * @type {boolean}
     */
    resourceTrait = false;
    /**
     * @type {boolean}
     */
    showEncounter = false;
    /**
     * @type {string}
     */
    commodity = "";
    /**
     * @type {string}
     */
    camp = "";
    /**
     * @type {boolean}
     */
    showResources = false;
    /**
     * @type {string}
     */
    terrain = "plains";
    /**
     * @type {string}
     */
    travel = "open";
    /**
     * @type {number}
     */
    exploration = 0;
    /**
     * @type {boolean}
     */
    cleared = false;
    /**
     * @type {string}
     */
    claimed = "";
    /**
     * @type {string}
     */
    color = "#FF0000";
    /**
     * @type {ChexFeature[]}
     */
    features = [];
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
    discovered = false;
}