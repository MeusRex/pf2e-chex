import * as C from "./const.mjs";
import ChexData from "./hex-data.mjs";
import ChexHexEdit from "./hex-edit.mjs";
import ChexHexHUD from "./hex-hud.mjs";
import ChexHex from "./hex.mjs";
import ChexKingdomLayer from "./kingdom-layer.mjs";
import ChexSceneData from "./scene-data.mjs";
import CHexData from "./scene-data.mjs";

export default class ChexManager {
    constructor() {
        this.hud = new ChexHexHUD();
    }
    /**
     * @type {ChexKingdomLayer}
     */
    kingdomLayer;

    hoveredHex;

    hud;

    hexes = new Collection();

    /**
     * @type {ChexSceneData}
     */
    get sceneData() {
        return canvas.scene.getFlag(C.MODULE_ID, C.CHEX_DATA_KEY);
    }

    get active() {
        return (canvas.scene && this.sceneData);
    }

    #initHexes() {
        if (!this.active) return;
        this.hexes = new Collection();
        const data = this.sceneData;
        const config = HexagonalGrid.getConfig(data.type, data.size);

        for (let row = 0; row < data.numRows; row++) {
            for (let col = 0; col < data.numCols; col++) {
                const hex = new ChexHex({row, col}, config, data.sceneId)
                this.hexes.set(ChexData.getKey({row, col}), hex);
            }
        }
    }

    #chexToolkit;
    #enableChexTool;
    #showChexDetailsTool;

    _extendSceneControlButtons(buttons) {
        const tokens = buttons.find(b => b.name === "token");
        this.#chexToolkit = buttons.find(b => b.name === "notes");

        if (this.active) {

            this.#showChexDetailsTool = {
                name: "chexDetails",
                title: "CHEX.TOOLS.ToggleHexTool",
                icon: "fa-solid fa-hexagon-image",
                visible: true,
                toggle: true,
                active: this.hud.enabled ?? false,
                onClick: () => this.hud.toggle()
            };

            tokens.tools.push(this.#showChexDetailsTool);
        }

        this.#enableChexTool = {
            name: "chexEnable",
            title: "CHEX.TOOLS.EnableChex",
            icon: "fa-solid fa-chart-area",
            visible: true,
            toggle: true,
            active: this.active,
            onClick: async () => this.#enableChex()
        }

        this.#chexToolkit.tools.push(this.#enableChexTool);

        // add terrain tools
        if (this.active) {
            for (const terrainKey in C.TERRAIN) {
                if (C.TERRAIN.hasOwnProperty(terrainKey)) {
                    const terrain = C.TERRAIN[terrainKey];
                    const tool = {
                        name: terrain.id,
                        title: terrain.toolLabel,
                        icon: terrain.toolIcon,
                    };
                    this.#chexToolkit.tools.push(tool);
                }
            }
        }

    }

    #enableChex() {
        if (this.active) {
            // remove chex
            canvas.scene.unsetFlag(C.MODULE_ID, C.CHEX_DATA_KEY);
        }
        else {
            // add chex
            const sceneData = ChexSceneData.create(canvas.scene)
        }

        this._onReady();
    }

    _updateScene(document, change) {
        if (!this.active) return;

        this.kingdomLayer.draw();
    }

    _onInit() {
        if (!this.active) return;
        if (canvas.visibilityOptions) canvas.visibilityOptions.persistentVision = true;
    }

    _onReady() {
        if (!this.active) return;

        this.#initHexes();

        if (!this.kingdomLayer) {
            this.kingdomLayer = new ChexKingdomLayer();
            canvas.grid.addChildAt(this.kingdomLayer, canvas.grid.children.indexOf(canvas.grid.borders));
        }
        this.kingdomLayer.draw();
        canvas.grid.addHighlightLayer(C.HIGHLIGHT_LAYER);

        this.#mousemove = this.#onMouseMove.bind(this);
        canvas.stage.on("mousemove", this.#mousemove);
        if ( game.user.isGM ) {
          this.#mousedown = this.#onMouseDown.bind(this);
          canvas.stage.on("mousedown", this.#mousedown);
          this.#mouseup = this.#onMouseUp.bind(this);
          canvas.stage.on("mouseup", this.#mouseup);
        }
    }

    _onTearDown() {
        if (!this.active) return;

        this.hoveredHex = null;
        this.hud.clear();

        canvas.stage.off(this.#mousemove);
        this.#mousemove = undefined;
        canvas.stage.off(this.#mousedown);
        this.#mousedown = undefined;

        canvas.grid.destroyHighlightLayer(C.HIGHLIGHT_LAYER);
        this.kingdomLayer = undefined;
        this.hud.enabled = false;
    }

    #mousemove;
    #mousedown;
    #mouseup;
    #clickTime = 0;
    #isMouseDown = false;

    #onMouseMove(event) {
        let hex = null;
        if ( ( this.hud.enabled ) && ( event.srcElement?.id === "board" ) ) {
          hex = this.getHexFromPoint(event.data.getLocalPosition(canvas.stage));
        }
        if ( !hex ) {
            this.hud.clear();
        }
        else if ( hex !== this.hoveredHex ) {
            if (this.#isMouseDown) {
                this.#paintTerrain(hex);
            }
            this.hud.activate(hex);
        }
        this.hoveredHex = hex || null;
    }

    #onMouseDown(event) {
        this.#isMouseDown = true;
        if ( !this.hoveredHex ) return;

        if (this.#paintTerrain(this.hoveredHex)) return;

        const t0 = this.#clickTime;
        const t1 = this.#clickTime = Date.now();
        if ( (t1 - t0) > 250 ) return;
        const hex = this.hoveredHex;
        const app = new ChexHexEdit(hex);
        app.render(true, {left: event.x + 100, top: event.y - 50});
    }

    #onMouseUp(event) {
        this.#isMouseDown = false;
    }

    #paintTerrain(hex) {
        if (hex) {   
            if (canvas.activeLayer.name === "NotesLayer") {
                const activeTool = ui.controls.tool;
                if (C.TERRAIN[activeTool]) {
                    const patch = {
                        terrain: activeTool,
                        travel: C.TERRAIN[activeTool].travel
                    };
                    
                    let key = ChexData.getKey(hex.offset);
                    canvas.scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, {
                        hexes: {
                          [key]: patch
                        }
                      });

                    return true;
                }
            }
        }
        return false;
    }

    getHexFromPoint(point) {
		const [row, col] = canvas.grid.grid.getGridPositionFromPixels(point.x, point.y);
		return this.hexes.get(ChexData.getKey({row, col}));
	}

}