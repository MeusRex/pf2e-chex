import * as C from "./const.mjs";
import ChexData from "./hex-data.mjs";
import ChexSceneData from "./scene-data.mjs";

export default class ChexHex extends GridHex {
    constructor(offset, config, sceneId) {
        super(offset, config);
        this.sceneId = sceneId;
    }

    sceneId;

    get scene() {
        return game.scenes.get(this.sceneId);
    }

    /**
     * @type {ChexSceneData}
     */
    get sceneData() {
        return this.scene.getFlag(C.MODULE_ID, C.CHEX_DATA_KEY);
    }

    /**
     * @type {ChexData}
     */
    get hexData() {
        return this.sceneData.hexes[ChexData.getKey(this.offset)];
    }

    get name() {
        if ( this.hexData.page ) {
            const page = fromUuidSync(this.hexData.page);
            if ( page ) return page.name;
        }
        if ( this.hexData.discoveryTrait ) return this.discoveryTrait.label;
        return this.toString();
    }

    get terrain() {
        return C.TERRAIN[this.hexData.terrain];
    }

    get travel() {
        return C.TRAVEL[this.hexData.travel];
    }

    get difficulty() {
        return C.TRAVEL[this.hexData.difficulty];
    }

    get discoveryTrait() {
        return C.DISCOVERY_TRAITS[this.hexData.discoveryTrait];
    }

    get explorationState() {
        return Object.values(C.EXPLORATION_STATES).find(s => s.value === this.hexData.exploration);
    }

    get color() {
        return Color.from(this.hexData.color);
    }

    toString() {
        return `${this.offset.row}.${this.offset.col}`;
    }
}