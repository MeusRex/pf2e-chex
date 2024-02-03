import * as C from "./const.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import ChexData from "./chex-data.mjs";
import ChexSceneData from "./scene-data.mjs";

export default class ChexHex extends GridHex {
    constructor(offset: GridOffset, config: any, sceneId: string) {
        super(offset, config);
        this.sceneId = sceneId;
    }

    sceneId: string;

    get scene(): any {
        return game.scenes.get(this.sceneId);
    }

    get sceneData(): ChexSceneData {
        return this.scene.getFlag(C.MODULE_ID, C.CHEX_DATA_KEY);
    }

    get hexData(): ChexData {
        return this.sceneData.hexes[ChexData.getKey(this.offset)];
    }

    get name(): string {
        return this.toString();
    }

    get terrain(): Terrain {
        return chex.terrains[this.hexData.terrain] ?? Terrain.getDefaults()["plains"];
    }

    get travel(): Travel {
        return chex.travels[this.hexData.travel] ?? Travel.getDefaults()["open"];
    }

    get difficulty(): string {
        return chex.travels[this.hexData.travel]?.label || C.FALLBACK_LABEL;
    }

    get multiplier(): number {
        return chex.travels[this.hexData.travel]?.multiplier || C.FALLBACK_MULTIPLIER;
    }

    get explorationState() {
        return Object.values(C.EXPLORATION_STATES).find(s => s.value === this.hexData.exploration);
    }

    get color(): any {
        // maybe possible to set via settings. Then user can choose color depending on scene
        return Color.from(C.FALLBACK_COLOR);
    }

    override toString(): string {
        return `${this.offset.row}.${this.offset.col}`;
    }
}