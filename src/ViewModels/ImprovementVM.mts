import { ChexImprovement } from "src/chex-data.mjs";
import { FALLBACK_IMAGE, FALLBACK_LABEL } from "src/const.mjs";
import { Improvement } from "src/customizables/improvements.mjs";
import { KEY_INCOME } from "src/formula-parser.mjs";

export default class ImprovementVM {
    label = window.ko.observable("");
    img = window.ko.observable("");
    special = window.ko.observable("");
    visiFrag = window.ko.observable(false);

    constructor(data: ChexImprovement) {
        const improvement: Improvement = chex.improvements[data.id];
        let special = improvement?.special || "";
          if (special.startsWith(KEY_INCOME)) {
            special = special.substring(KEY_INCOME.length + 1);
          }
        this.update(improvement.label, improvement.img, special, data.show)
    }

    update(label: string | undefined, img: string | undefined, special: string, visiFrag: boolean) {
        this.label(label || FALLBACK_LABEL);
        this.img(img || FALLBACK_IMAGE);
        this.special(special || "");
        this.visiFrag(visiFrag || false);
    }
}