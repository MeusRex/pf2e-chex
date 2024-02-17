import { FALLBACK_IMAGE, FALLBACK_LABEL } from "../const.mjs";
export default class FeatureVM {
    label = window.ko.observable("");
    img = window.ko.observable("");
    name = window.ko.observable("");
    visiFrag = window.ko.observable(false);
    constructor(data) {
        const feature = chex.features[data.id];
        this.update(feature?.label, feature?.img, data.name, data.show);
    }
    update(label, img, name, visiFrag) {
        this.label(label || FALLBACK_LABEL);
        this.img(img || FALLBACK_IMAGE);
        this.name(name);
        this.visiFrag(visiFrag || false);
    }
}
