/**
 * Layer to enable usage of top level tools, as they always activate a layer
 */
export default class ChexLayer extends InteractionLayer {
    static LAYER_NAME = "chex";
    constructor() {
        super();
    }
    static get layerOptions() {
        return foundry.utils.mergeObject(this.layerOptions, {
            name: ChexLayer.LAYER_NAME,
            zIndex: 245
        });
    }
}
