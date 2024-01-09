

export default class ChexLayer extends InteractionLayer {
    static LAYER_NAME = "chex";
    constructor() {
        super();
    }

    static get layerOptions() {
        return foundry.utils.mergeObject(super.layerOptions, {
            name: ChexLayer.LAYER_NAME,
            zIndex: 245
        });
    }


}