import Customizer from "./customizer.mjs";
import DeleteCertain from "./delete-certain.mjs";
import ChexLayer from "./chex-layer.mjs";
import RealmPalette from "./realm-palette.mjs";
import TerrainPalette from "./terrain-palette.mjs";
import * as C from "./const.mjs";
import ChexData from "./chex-data.mjs";
import ChexHexEdit from "./chex-edit.mjs";
import ChexHexHUD from "./chex-hud.mjs";
import ChexHex from "./hex.mjs";
import ChexDrawingLayer from "./chex-drawing-layer.mjs";
import ChexSceneData from "./scene-data.mjs";

export default class ChexManager {
    constructor() {
        this.hud = new ChexHexHUD();
    }
    
    kingdomLayer?: ChexDrawingLayer;

    hoveredHex?: ChexHex;

    hud: ChexHexHUD;

    hexes = new Collection();

    get sceneData(): ChexSceneData {
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

    mode = C.MODE_REALM;

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
                active: this.mode === C.MODE_REALM,
                onClick: () => {
                    this.mode = C.MODE_REALM;
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
                icon: "fa-solid fa-hexagon-image",
                layer: "chex",
                tools: [
                    {
                        name: "chexEnable",
                        title: "CHEX.TOOLS.EnableChex",
                        icon: "fa-solid fa-chart-area",
                        toggle: true,
                        active: this.active,
                        onClick: async () => this.#enableChex()
                    },
                    {
                        name: "chexSettings",
                        title: "CHEX.TOOLS.Settings",
                        icon: "fa-solid fa-cog",
                        toggle: false,
                        onClick: async () => this.#showSettings()
                    }
                ]
            }

            if (this.active) {
                toolBox.tools.push({
                    name: "chexTerrainSelector",
                    title: "CHEX.TOOLS.TerrainSelector",
                    icon: "fa-solid fa-mountain",
                    toggle: false,
                    onClick: async () => 
                    { 
                        if (chex.realmSelector)
                            chex.realmSelector.close();
                        if (!chex.terrainSelector) 
                            new TerrainPalette().render(true); 
                    }
                },
                {
                    name: "chexRealmSelector",
                    title: "CHEX.TOOLS.RealmSelector",
                    icon: "fa-solid fa-bank",
                    toggle: false,
                    onClick: async () => 
                    {
                        if (chex.terrainSelector)
                            chex.terrainSelector.close(); 
                        if (!chex.realmSelector) 
                            new RealmPalette().render(true); 
                        }
                    }
                );
            }
            buttons.push(toolBox);
        }
    }

    get isValidGrid() {
        return canvas.grid.type === 2;
    }

    #showSettings() {
        if (!chex.customizer) {
            const customizer = new Customizer();
            customizer.render(true);
        }
    }

    #refreshKingdomLayer() {
        if (this.kingdomLayer)
            this.kingdomLayer.draw();
    }

    async #enableChex() {
        if (this.active) {
            // remove chex
            new DeleteCertain(canvas.scene).render(true);
        }
        else {
            if (this.isValidGrid) {
                // add chex
                const sceneData = await ChexSceneData.create(canvas.scene)
                location.reload();
            }
            else {
                // message that it wont work with other grids currently
                ui.notifications.warn("Currently, Chex only works for Hexagonal Rows - Odd");
            }
        }

        this._onReady();
    }

    _updateScene(document, change) {
        if (!this.active || !this.kingdomLayer) return;

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
            this.kingdomLayer = new ChexDrawingLayer();
            
            if (canvas.scene.tokenVision)
                canvas.stage.rendered.environment.effects.addChildAt(chex.manager.kingdomLayer, 1);
            else 
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

        this.hoveredHex = undefined;
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

            // canvas.app.renderer.extract.pixels(canvas.effects.visibility.explored.children[0].texture, new PIXI.Rectangle(4001, 0, 1, 1))
        }
        this.hoveredHex = hex || undefined;
    }

    #onMouseDown(event) {
        this.#isMouseDown = true;
        if ( !this.hoveredHex ) return;

        if (this.#paintTerrainDeferred(this.hoveredHex)) return;

        const t0 = this.#clickTime;
        const t1 = this.#clickTime = Date.now();
        if ( (t1 - t0) > 250 ) return;
        const hex: ChexHex = this.hoveredHex;
        // @ts-ignore
        const app = new ChexHexEdit(hex);
        app.render(true, {left: event.x + 100, top: event.y - 50});
    }

    #onMouseUp(event) {
        this.#isMouseDown = false;
        this.#paintTerrainDeferredEnd();
    }

    pendingPatches: any = [];
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

    #paintTerrainDeferred(hex): any {
        if (hex && canvas.activeLayer.name === ChexLayer.name) {
            const key = ChexData.getKey(hex.offset);
            // correct layer, first check terrain painter
            if (chex.terrainSelector && chex.terrainSelector.activeTool) {
                const activeTool = chex.terrainSelector.activeTool;
                if (chex.terrains[activeTool] && hex.hexData.terrain !== activeTool) {
                    const patch = {
                        terrain: activeTool,
                        travel: chex.terrains[activeTool].travel
                    };
                    
                    this.pendingPatches.push({
                        hex: hex,
                        key: key,
                        patch: patch
                    });
                }
            }
            else if (chex.realmSelector && chex.realmSelector.activeTool) {
                const activeTool = chex.realmSelector.activeTool;
                if (chex.realms[activeTool] && hex.hexData.claimed !== activeTool) {
                    const patch = {
                        claimed: activeTool
                    };

                    this.pendingPatches.push({
                        hex: hex,
                        key: key,
                        patch: patch
                    });
                }
            }
        }
    }

    _updateVisibility(visibility) {
    }

    getHexFromPoint(point) {
        const grid = canvas.grid.grid;
		const [row, col] = grid.getGridPositionFromPixels(point.x, point.y);
		return this.hexes.get(ChexData.getKey({row, col}));
	}

      /**
   * Compute the offset coordinate of a hexagon from a pixel coordinate contained within that hex.
   * @param {Point} point                     The pixel coordinate
   * @param {HexGridConfiguration} config     The hex grid configuration
   * @param {string} [method=floor]           Which Math rounding method to use
   * @returns {HexOffsetCoordinate}           The offset coordinate
   */
  pixelsToOffset({x, y}, config, method="floor") {
    const {columns, even, width, height} = config;
    const fn = Math[method];
    let row;
    let col;

    // Columnar orientation
    if ( columns ) {
      col = fn(x / (width * 0.866));
      const isEven = (col + 1) % 2 === 0;
      row = fn((y / height) + (even === isEven ? 0.5 : 0));
    }

    // Row orientation
    else {
      row = fn(y / (height * 0.866));
      const isEven = (row + 1) % 2 === 0;
      col = fn((x / width) + (even === isEven ? 0.5 : 0));
    }
    return {row, col};
  }

}