import { FALLBACK_LABEL, FALLBACK_MULTIPLIER } from "../const.mjs";
export default class TravelVM {
    label = window.ko.observable("");
    multiplier = window.ko.observable(1);
    update(key) {
        const travel = chex.travels[key];
        this.label(travel?.label || FALLBACK_LABEL);
        this.multiplier(travel?.multiplier || FALLBACK_MULTIPLIER);
    }
}
