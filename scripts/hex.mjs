import * as C from "./const.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import ChexData from "./chex-data.mjs";
import ChexSceneData from "./scene-data.mjs";

export default class ChexHex extends foundry.grid.GridHex {

    constructor(coordinates, grid, sceneId) {
        super(coordinates, grid);
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
        return chex.terrains[this.hexData.terrain] ?? Terrain.getDefaults()["plains"];
    }

    get travel() {
        return chex.travels[this.hexData.travel] ?? Travel.getDefaults()["open"];
    }

    get difficulty() {
        return chex.travels[this.hexData.travel]?.label || C.FALLBACK_LABEL;
    }

    get multiplier() {
        return chex.travels[this.hexData.travel]?.multiplier || C.FALLBACK_MULTIPLIER;
    }

    get explorationState() {
        return Object.values(C.EXPLORATION_STATES).find(s => s.value === this.hexData.exploration);
    }

    get color() {
        // maybe possible to set via settings. Then user can choose color depending on scene
        return Color.from(C.FALLBACK_COLOR);
    }

    toString() {
        return `${this.offset.i}.${this.offset.j}`;
    }
}