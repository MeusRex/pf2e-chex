import ChexCustomizer from "./chex-customizer.mjs";
import ChexLayer from "./chex-layer.mjs";
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
    #showKingdomTool;
    #showTerrainTool;
    #showTravelTool;

    /**
     * Defines what mode the KingdomLayer is in. E.g. what overlay it should show.
     */
    mode = C.MODE_KINGDOM;

    _extendSceneControlButtons(buttons) {
        const tokens = buttons.find(b => b.name === "token");

        if (this.active) {

            this.#showChexDetailsTool = {
                name: "chexDetails",
                title: "CHEX.TOOLS.ToggleHexTool",
                icon: "fa-solid fa-hexagon-image",
                toggle: true,
                active: this.hud.enabled ?? false,
                onClick: () => this.hud.toggle()
            };

            this.#showKingdomTool = {
                name: "showKingdom",
                title: "CHEX.TOOLS.ShowKingdomTool",
                icon: "fa-solid fa-bank",
                toggle: true,
                active: this.mode === C.MODE_KINGDOM,
                onClick: () => {
                    this.mode = C.MODE_KINGDOM;
                    this.#showTerrainTool.active = false;
                    this.#showTravelTool.active = false;
                    this.#refreshKingdomLayer();
                }
            }

            this.#showTerrainTool = {
                name: "showTerrain",
                title: "CHEX.TOOLS.ShowTerrainTool",
                icon: "fa-solid fa-mountain",
                toggle: true,
                active: this.mode === C.MODE_TERRAIN,
                onClick: () => {
                    this.mode = C.MODE_TERRAIN; 
                    this.#showKingdomTool.active = false;
                    this.#showTravelTool.active = false;
                    this.#refreshKingdomLayer();
                }
            }

            this.#showTravelTool = {
                name: "showTravel",
                title: "CHEX.TOOLS.ShowTravelTool",
                icon: "fa-solid fa-road",
                toggle: true,
                active: this.mode === C.MODE_TRAVEL,
                onClick: () => {
                    this.mode = C.MODE_TRAVEL;
                    this.#showKingdomTool.active = false;
                    this.#showTerrainTool.active = false;
                    this.#refreshKingdomLayer();
                }
            }

            tokens.tools.push(this.#showChexDetailsTool, this.#showKingdomTool, this.#showTerrainTool, this.#showTravelTool);
        }

        if (game.user.isGM) {
            
            const toolBox = {
                name: "chexTools",
                title: "CHEX.TOOLS.ChexTools",
                icon: "fas fa-hat-wizard",
                layer: "chex",
                tools: [
                    {
                        name: "chexEnable",
                        title: "CHEX.TOOLS.EnableChex",
                        icon: "fa-solid fa-chart-area",
                        visible: true,
                        toggle: true,
                        active: this.active,
                        onClick: async () => this.#enableChex()
                    },
                    {
                        name: "chexSettings",
                        title: "CHEX.TOOLS.Settings",
                        icon: "fa-solid fa-cog",
                        visible: true,
                        toggle: false,
                        onClick: async () => this.#showSettings()
                    }
                ]
            }
            
            // add terrain tools
            if (this.active) {
                for (const terrainKey in chex.terrains) {
                    if (chex.terrains.hasOwnProperty(terrainKey)) {
                        const terrain = chex.terrains[terrainKey];
                        const tool = {
                            name: terrain.id,
                            title: terrain.label + " Tool",
                            icon: terrain.toolIcon,
                        };
                        toolBox.tools.push(tool);
                    }
                }
            }

            buttons.push(toolBox);
        }

    }

    #showSettings() {
        if (!chex.customizer) {
            const customizer = new ChexCustomizer();
            customizer.render(true);
        }
    }

    #refreshKingdomLayer() {
        if (this.kingdomLayer)
            this.kingdomLayer.draw();
    }

    #enableChex() {
        if (this.active) {
            // remove chex
            canvas.scene.unsetFlag(C.MODULE_ID, C.CHEX_DATA_KEY);
        }
        else {
            if (canvas.grid.type === 2) {
                // add chex
                const sceneData = ChexSceneData.create(canvas.scene)
            }
            else {
                // message that it wont work with other grids currently
            }
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
                this.#paintTerrainDeferred(hex);
            }
            this.hud.activate(hex);
        }
        this.hoveredHex = hex || null;
    }

    #onMouseDown(event) {
        this.#isMouseDown = true;
        if ( !this.hoveredHex ) return;

        if (this.#paintTerrainDeferred(this.hoveredHex)) return;

        const t0 = this.#clickTime;
        const t1 = this.#clickTime = Date.now();
        if ( (t1 - t0) > 250 ) return;
        const hex = this.hoveredHex;
        const app = new ChexHexEdit(hex);
        app.render(true, {left: event.x + 100, top: event.y - 50});
    }

    #onMouseUp(event) {
        this.#isMouseDown = false;
        this.#paintTerrainDeferredEnd();
    }

    pendingPatches = [];
    #paintTerrainDeferredEnd() {
        if (this.pendingPatches.length > 0) {
            const patches = this.pendingPatches.reduce((result, item) => {
                result.hexes[item.key] = item.patch;
                return result;
            }, { hexes: {} });

            canvas.scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, patches);
        }

        this.pendingPatches = [];
    }

    #paintTerrainDeferred(hex) {
        if (hex) {
            if (canvas.activeLayer.name === ChexLayer.name) {
                const activeTool = ui.controls.tool;
                if (chex.terrains[activeTool] && hex.hexData.terrain !== activeTool) {
                    const patch = {
                        terrain: activeTool,
                        travel: chex.terrains[activeTool].travel
                    };
                    
                    const key = ChexData.getKey(hex.offset);

                    this.pendingPatches.push({
                        hex: hex,
                        key: key,
                        patch: patch
                    });
                }
            }
        }
    }

    getHexFromPoint(point) {
		const [row, col] = canvas.grid.grid.getGridPositionFromPixels(point.x, point.y);
		return this.hexes.get(ChexData.getKey({row, col}));
	}

}