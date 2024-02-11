import { FALLBACK_IMAGE, FALLBACK_LABEL } from "src/const.mjs";
import { Terrain } from "src/customizables/terrain.mjs";

export default class TerrainVM {
    label: ko.Observable<string> = window.ko.observable("");
    img: ko.Observable<string> = window.ko.observable("");
  
    update(key: string) {
      const terrain: Terrain = chex.terrains[key];
      this.label(terrain?.label || FALLBACK_LABEL);
      this.img(terrain?.img || FALLBACK_IMAGE);
    }
  }