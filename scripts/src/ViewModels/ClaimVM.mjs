import { FALLBACK_COLOR, FALLBACK_LABEL } from "../const.mjs";
export default class ClaimVM {
    claimed = window.ko.observable(false);
    label = window.ko.observable("");
    color = window.ko.observable("");
    update(key) {
        if (key) {
            const realm = chex.realms[key];
            this.label(realm?.label || FALLBACK_LABEL);
            this.color(realm?.color || FALLBACK_COLOR);
            this.claimed(true);
        }
        else {
            this.claimed(false);
            this.label("");
            this.color("");
        }
    }
}
