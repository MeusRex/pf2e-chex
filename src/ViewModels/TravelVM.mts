import { FALLBACK_LABEL, FALLBACK_MULTIPLIER } from "src/const.mjs";
import { Travel } from "src/customizables/travel.mjs";

export default class TravelVM {
    label: ko.Observable<string> = window.ko.observable("");
    multiplier: ko.Observable<number> = window.ko.observable(1);
  
    update(key: string) {
      const travel: Travel = chex.travels[key];
      this.label(travel?.label || FALLBACK_LABEL);
      this.multiplier(travel?.multiplier || FALLBACK_MULTIPLIER);
    }
  }