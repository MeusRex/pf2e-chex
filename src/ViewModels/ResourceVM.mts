import { ChexResource } from "../chex-data.mjs";
import { FALLBACK_IMAGE, FALLBACK_LABEL } from "../const.mjs";
import { Resource } from "../customizables/resources.mjs";

export default class ResourceVM {
    label = window.ko.observable("");
    img = window.ko.observable("");
    amount = window.ko.observable(0);
    visiFrag = window.ko.observable(false);

    constructor(data: ChexResource) {
        const resource: Resource = chex.resources[data.id];
        this.update(resource.label, resource.img, data.amount, data.show)
    }

    update(label: string | undefined, img: string | undefined, amount: number, visiFrag: boolean) {
        this.label(label || FALLBACK_LABEL);
        this.img(img || FALLBACK_IMAGE);
        this.amount(amount || 0);
        this.visiFrag(visiFrag || false);
    }
}