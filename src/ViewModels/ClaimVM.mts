import { FALLBACK_COLOR, FALLBACK_LABEL } from "src/const.mjs";
import { Realm } from "src/customizables/realms.mjs";

export default class ClaimVM {
    claimed = window.ko.observable(false);
    label = window.ko.observable("");
    color = window.ko.observable("");
  
    update(key: string) {
      if (key) {
        const realm: Realm = chex.realms[key];
        this.label(realm?.label || FALLBACK_LABEL);
        this.color(realm?.color || FALLBACK_COLOR)
        this.claimed(true);
      }
      else {
        this.claimed(false);
        this.label("");
        this.color("");
      }
    }
  }