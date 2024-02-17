import { FALLBACK_IMAGE, FALLBACK_LABEL } from "../const.mjs";
export default class TerrainVM {
    label = window.ko.observable("");
    img = window.ko.observable("");
    update(key) {
        const terrain = chex.terrains[key];
        this.label(terrain?.label || FALLBACK_LABEL);
        this.img(terrain?.img || FALLBACK_IMAGE);
    }
}
