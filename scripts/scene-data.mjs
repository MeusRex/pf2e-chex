import * as C from "./const.mjs";
import ChexData from "./chex-data.mjs";
import ChexOffset from "./chex-offset.mjs";

export default class ChexSceneData {
    hexes = {};
    numRows = 0;
    numCols = 0;
    size = 0;
    type = 0;
    width = 0;
    height = 0;

    sceneId;

    static async create(scene) {
        var data = new ChexSceneData();
        const dimensions = scene.dimensions;

        data.sceneId = scene.id;
        data.type = scene.grid.type;
        data.size = scene.grid.size;
        data.width = dimensions.width;
        data.height = dimensions.height;
        if (scene.grid.type === foundry.CONST.GRID_TYPES.HEXODDR) {
            // Hexagonal Rows - Odd (type 2)
            // since the pointy part points up, 
            data.numRows = Math.ceil(data.height / (0.866 * data.size)); // sqrt(3)/2 * size is the formula for a tightly packed hexgrid
            data.numCols = Math.ceil(data.width / data.size);
        } else {
            // Hexagonal Columns - Odd
            // cols are now applied the formula instead.
            data.numRows = Math.ceil(data.height / data.size);
            data.numCols = Math.ceil(data.width / (0.866 * data.size)); // sqrt(3)/2 * size is the formula for a tightly packed hexgrid
        }

        data.hexes = {};
        for (let row = 0; row < data.numRows; row++) {
            for (let col = 0; col < data.numCols; col++) {
                const hex = new ChexData();
                const offset = new ChexOffset(row, col);
                let key = ChexData.getKey(offset);
                data.hexes[key] = hex;
            }
        }

        await scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, data);
    }
}