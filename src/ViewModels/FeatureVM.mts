import { ChexFeature } from "src/chex-data.mjs";
import { FALLBACK_IMAGE, FALLBACK_LABEL } from "src/const.mjs";
import { Feature } from "src/customizables/features.mjs";

export default class FeatureVM {
    label = window.ko.observable("");
    img = window.ko.observable("");
    name = window.ko.observable("");
    visiFrag = window.ko.observable(false);

    constructor(data: ChexFeature) {
        const feature: Feature = chex.features[data.type];
        this.update(feature.label, feature.img, data.name, data.show)
    }

    update(label: string | undefined, img: string | undefined, name: string, visiFrag: boolean) {
        this.label(label || FALLBACK_LABEL);
        this.img(img || FALLBACK_IMAGE);
        this.name(name);
        this.visiFrag(visiFrag || false);
    }
}