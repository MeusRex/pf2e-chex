import { FALLBACK_IMAGE, FALLBACK_LABEL } from "src/const.mjs";
export default class ResourceVM {
    label = window.ko.observable("");
    img = window.ko.observable("");
    amount = window.ko.observable(0);
    visiFrag = window.ko.observable(false);
    constructor(data) {
        const resource = chex.resources[data.type];
        this.update(resource.label, resource.img, data.amount, data.show);
    }
    update(label, img, amount, visiFrag) {
        this.label(label || FALLBACK_LABEL);
        this.img(img || FALLBACK_IMAGE);
        this.amount(amount || 0);
        this.visiFrag(visiFrag || false);
    }
}
