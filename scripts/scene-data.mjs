import * as C from "./const.mjs";
import ChexData from "./hex-data.mjs";

export default class ChexSceneData {
    hexes = {};
    numRows = 0;
    numCols = 0;
    size = 0;
    type = 0;
    width = 0;
    height = 0;

    sceneId;

    static create(scene) {
        var data = new ChexSceneData();
        const dimensions = scene.dimensions;
        const rect = dimensions.rect;

        data.sceneId = scene.id;
        data.type = rect.type;
        data.size = dimensions.size;
        data.width = rect.width;
        data.height = rect.height;
        data.numRows = data.width / data.size;

        // depends on grid type

        data.numCols = data.height / (0.866 * data.size); // sqrt(3)/2 * size is the formula for a tightly packed hexgrid
        data.numCols += 1; // +1 because we need to round up, since the calculation is just an aproximation. +2 because we want to have the last partial column too.

        const config = HexagonalGrid.getConfig(data.type, data.size);

        data.hexes = {};
        for (let row = 0; row < data.numRows; row++) {
            for (let col = 0; col < data.numCols; col++) {
                const hex = new ChexData();
                let key = ChexData.getKey({row, col});
                data.hexes[key] = hex;
            }
        }

        scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, data);
    }
}