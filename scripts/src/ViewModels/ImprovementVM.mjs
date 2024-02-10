import { FALLBACK_IMAGE, FALLBACK_LABEL } from "src/const.mjs";
import { KEY_INCOME } from "src/formula-parser.mjs";
export default class ImprovementVM {
    label = window.ko.observable("");
    img = window.ko.observable("");
    special = window.ko.observable("");
    visiFrag = window.ko.observable(false);
    constructor(data) {
        const improvement = chex.improvements[data.type];
        let special = improvement?.special || "";
        if (special.startsWith(KEY_INCOME)) {
            special = special.substring(KEY_INCOME.length + 1);
        }
        this.update(improvement.label, improvement.img, special, data.show);
    }
    update(label, img, special, visiFrag) {
        this.label(label || FALLBACK_LABEL);
        this.img(img || FALLBACK_IMAGE);
        this.special(special || "");
        this.visiFrag(visiFrag || false);
    }
}
