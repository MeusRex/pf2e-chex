import * as C from "./const.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import ChexData from "./chex-data.mjs";
export default class ChexHex extends GridHex {
    constructor(offset, config, sceneId) {
        super(offset, config);
        this.sceneId = sceneId;
    }
    sceneId;
    get scene() {
        return game.scenes.get(this.sceneId);
    }
    get sceneData() {
        return this.scene.getFlag(C.MODULE_ID, C.CHEX_DATA_KEY);
    }
    get hexData() {
        return this.sceneData.hexes[ChexData.getKey(this.offset)];
    }
    get name() {
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
        return `${this.offset.row}.${this.offset.col}`;
    }
}
