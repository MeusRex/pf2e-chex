import Customizer from "./customizer.mjs";
import DeleteCertain from "./delete-certain.mjs";
import ChexLayer from "./chex-layer.mjs";
import RealmPalette from "./realm-palette.mjs";
import TerrainPalette from "./terrain-palette.mjs";
import PaintBucketConfirm from "./paint-bucket-confirm.mjs";
import * as C from "./const.mjs";
import ChexData from "./chex-data.mjs";
import ChexHexEdit from "./chex-edit.mjs";
import ChexHexHUD from "./chex-hud.mjs";
import ChexHex from "./hex.mjs";
import ChexDrawingLayer from "./chex-drawing-layer.mjs";
import ChexSceneData from "./scene-data.mjs";
import ChexOffset from "./chex-offset.mjs";

export default class ChexManager {
    constructor() {
        this.hud = new ChexHexHUD();
    }
    /**
     * @type {ChexDrawingLayer}
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
        const grid = canvas.scene.grid;

        for (let row = 0; row < data.numRows; row++) {
            for (let col = 0; col < data.numCols; col++) {
                const offset = new ChexOffset(row, col);
                const hex = new ChexHex(offset, grid, data.sceneId)
                this.hexes.set(ChexData.getKey(offset), hex);
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

    _extendSceneControlButtons(controls) {
        const tokenControls = controls["tokens"];

        if (this.active) {

            this.#showChexDetailsTool = {
                name: "showChexDetailsTool",
                title: "CHEX.TOOLS.ToggleHexTool",
                icon: "fa-solid fa-hexagon-image",
                toggle: true,
                active: this.hud.enabled ?? false,
                onChange: () => {this.hud.toggle()}
            };

            this.#showKingdomTool = {
                name: "showKingdomTool",
                title: "CHEX.TOOLS.ShowKingdomTool",
                icon: "fa-solid fa-bank",
                toggle: false,
                active: this.mode === C.MODE_REALM,
                onChange: () => {
                    this.mode = C.MODE_REALM;
                    this.#showKingdomTool.active = true;
                    this.#showTerrainTool.active = false;
                    this.#showTravelTool.active = false;
                    this.#refreshKingdomLayer();
                }
            }

            this.#showTerrainTool = {
                name: "showTerrainTool",
                title: "CHEX.TOOLS.ShowTerrainTool",
                icon: "fa-solid fa-mountain",
                toggle: false,
                active: this.mode === C.MODE_TERRAIN,
                onChange: () => {
                    this.mode = C.MODE_TERRAIN; 
                    this.#showTerrainTool.active = true;
                    this.#showKingdomTool.active = false;
                    this.#showTravelTool.active = false;
                    this.#refreshKingdomLayer();
                }
            }

            this.#showTravelTool = {
                name: "showTravelTool",
                title: "CHEX.TOOLS.ShowTravelTool",
                icon: "fa-solid fa-road",
                toggle: false,
                active: this.mode === C.MODE_TRAVEL,
                onChange: () => {
                    this.mode = C.MODE_TRAVEL;
                    this.#showTravelTool.active = true;
                    this.#showKingdomTool.active = false;
                    this.#showTerrainTool.active = false;
                    this.#refreshKingdomLayer();
                }
            }

            tokenControls.tools["showChexDetailsTool"] = this.#showChexDetailsTool;
            tokenControls.tools["showKingdomTool"] = this.#showKingdomTool;
            tokenControls.tools["showTerrainTool"] = this.#showTerrainTool;
            tokenControls.tools["showTravelTool"] = this.#showTravelTool;
        }

        if (game.user.isGM) {
            
            const chexTools = {
                name: "chexTools",
                title: "CHEX.TOOLS.ChexTools",
                icon: "fa-solid fa-hexagon-image",
                layer: "chex",
                onChange: (event, active) => {if (active){
                    canvas.chex.activate();
                }},
                tools: {
// This button exists because Foundry VTT v13 has a mandatory "activeTool" parameter which will immediately activate the button when switching to these tools.
// Enabling/Disabling Chex, launching the settings, or launching one of the edit tools would be awkward, so instead there's just this dead button.
// Sadly, it logs an error if it's not visible in v13, but this was addressed in v14. Leaving in place with the hopes of maintaining v13+v14 compatibility.
                    chexDummy: {
                        name: "chexDummy",
                        title: "CHEX.TOOLS.Dummy",
                        icon: "fa-solid fa-thumbs-up",
                        button: true,
                        toggle: false,
                        visible: true,
                        onChange: (event,active) => {},
                    },
                    chexEnable: {
                        name: "chexEnable",
                        title: "CHEX.TOOLS.EnableChex",
                        icon: "fa-solid fa-chart-area",
                        toggle: true,
                        active: this.active,
                        onChange: async (event, active) => {if (active){this.#enableChex()}}
                    },
                    chexSettings: {
                        name: "chexSettings",
                        title: "CHEX.TOOLS.Settings",
                        icon: "fa-solid fa-cog",
                        button: true,
                        toggle: false,
                        onChange: async (event,active) => {if (active){this.#showSettings()}}
                    }
                },
                activeTool: "chexDummy"
            }

            controls.chexTools = chexTools;
            if (this.active) {
                chexTools.tools["chexTerrainSelector"] = {
                    name: "chexTerrainSelector",
                    title: "CHEX.TOOLS.TerrainSelector",
                    icon: "fa-solid fa-mountain",
                    button: true,
                    toggle: false,
                    onChange: async (event, active) => {if (active) 
                        { 
                            if (chex.realmSelector)
                                chex.realmSelector.close();
                            if (!chex.terrainSelector) 
                                new TerrainPalette().render(true);
                            if (this.#showChexDetailsTool.active != true)
                                {
                                    this.hud.toggle();
                                };
                            this.#showChexDetailsTool.active = true;
                            this.#showTerrainTool.active = true;
                            this.mode = C.MODE_TERRAIN; 
                            this.#showKingdomTool.active = false;
                            this.#showTravelTool.active = false;
                            this.#refreshKingdomLayer();
                        }
                    }
                };
                chexTools.tools["chexRealmSelector"] ={
                    name: "chexRealmSelector",
                    title: "CHEX.TOOLS.RealmSelector",
                    icon: "fa-solid fa-bank",
                    button: true,
                    toggle: false,
                    onChange: async (event, active) => {if (active)
                        {
                            if (chex.terrainSelector)
                                chex.terrainSelector.close(); 
                            if (!chex.realmSelector) 
                                new RealmPalette().render(true);
                            if (this.#showChexDetailsTool.active != true)
                                {
                                    this.hud.toggle();
                                };
                            this.#showChexDetailsTool.active = true;
                            this.#showKingdomTool.active = true;
                            this.mode = C.MODE_REALM;
                            this.#showTerrainTool.active = false;
                            this.#showTravelTool.active = false;
                            this.#refreshKingdomLayer();
 
                        }
                    }
                };
            }
        }
    }

    get isValidGrid() {
        return canvas.grid.type === foundry.CONST.GRID_TYPES.HEXODDR || canvas.grid.type === foundry.CONST.GRID_TYPES.HEXODDQ;
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
                ui.notifications.warn("Currently, Chex only works for Hexagonal Rows - Odd, or Hexagonal Columns - Odd");
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
            this.kingdomLayer = new ChexDrawingLayer();
            
            if (canvas.scene.tokenVision)
                canvas.rendered.environment.effects.addChildAt(chex.manager.kingdomLayer, 1);
            else 
                canvas.interface.grid.addChild(this.kingdomLayer);
        }
        this.kingdomLayer.draw();
        canvas.interface.grid.addHighlightLayer(C.HIGHLIGHT_LAYER);

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

        canvas.interface.grid.destroyHighlightLayer(C.HIGHLIGHT_LAYER);
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
        this.hoveredHex = hex || null;
    }

    #onMouseDown(event) {
        this.#isMouseDown = true;
        if ( !this.hoveredHex ) return;

        // Check for paint bucket mode first
        if (chex.terrainSelector && chex.terrainSelector.paintBucketMode && 
            chex.terrainSelector.activeTerrainTool && this.mode === C.MODE_TERRAIN && 
            canvas.activeLayer.name === ChexLayer.name) {
            this.#executePaintBucket(this.hoveredHex, chex.terrainSelector.activeTerrainTool);
            return;
        }

        // Normal painting mode
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
        if (hex && canvas.activeLayer.name === ChexLayer.name) {
            const key = ChexData.getKey(hex.offset);
            
            // Skip deferred painting if paint bucket mode is active
            if (chex.terrainSelector && chex.terrainSelector.paintBucketMode && this.mode === C.MODE_TERRAIN) {
                return false;
            }
            
            // correct layer, first check terrain painter
            if (chex.terrainSelector && chex.terrainSelector.activeTerrainTool && this.mode === C.MODE_TERRAIN) {
                const activeTerrainTool = chex.terrainSelector.activeTerrainTool;
                if (chex.terrains[activeTerrainTool] && hex.hexData.terrain !== activeTerrainTool) {
                    const patch = {
                        terrain: activeTerrainTool,
                        travel: chex.terrains[activeTerrainTool].travel
                    };
                    
                    this.pendingPatches.push({
                        hex: hex,
                        key: key,
                        patch: patch
                    });
                    return true;
                }
            }
            else if (chex.realmSelector && chex.realmSelector.activeRealmTool && this.mode === C.MODE_REALM) {
                const activeRealmTool = chex.realmSelector.activeRealmTool;
                if (chex.realms[activeRealmTool] && hex.hexData.claimed !== activeRealmTool) {
                    const patch = {
                        claimed: activeRealmTool
                    };

                    this.pendingPatches.push({
                        hex: hex,
                        key: key,
                        patch: patch
                    });
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Execute paint bucket fill operation
     * @param {ChexHex} startHex - The hex where the paint bucket was clicked
     * @param {string} targetTerrain - The terrain type to fill with
     */
    async #executePaintBucket(startHex, targetTerrain) {
        const originalTerrain = startHex.hexData.terrain;
        
        // Don't fill if the target terrain is the same as the original
        if (originalTerrain === targetTerrain) {
            return;
        }

        // Find all connected hexes with the same terrain
        const affectedHexes = this.#floodFill(startHex, originalTerrain);
        
        // Show confirmation dialog
        new PaintBucketConfirm(startHex, targetTerrain, affectedHexes).render(true);
    }

    /**
     * Flood fill algorithm to find all connected hexes of the same terrain
     * @param {ChexHex} startHex - Starting hex
     * @param {string} targetTerrain - Terrain type to match
     * @returns {ChexHex[]} Array of connected hexes
     */
    #floodFill(startHex, targetTerrain) {
        const visited = new Set();
        const result = [];
        const queue = [startHex];
        
        while (queue.length > 0) {
            const currentHex = queue.shift();
            const key = ChexData.getKey(currentHex.offset);
            
            if (visited.has(key)) continue;
            if (currentHex.hexData.terrain !== targetTerrain) continue;
            
            visited.add(key);
            result.push(currentHex);
            
            // Add adjacent hexes to queue
            const neighbors = this.#getAdjacentHexes(currentHex);
            for (const neighbor of neighbors) {
                const neighborKey = ChexData.getKey(neighbor.offset);
                if (!visited.has(neighborKey)) {
                    queue.push(neighbor);
                }
            }
        }
        
        return result;
    }

    /**
     * Get adjacent hexes for flood fill using proper hex grid adjacency
     * @param {ChexHex} hex - Center hex
     * @returns {ChexHex[]} Array of adjacent hexes
     */
    #getAdjacentHexes(hex) {
        const adjacent = [];
        const { i, j } = hex.offset;
        
        // Hex adjacency patterns depend on grid type and whether row/col is odd/even
        let directions = [];
        
        if (canvas.grid.type === foundry.CONST.GRID_TYPES.HEXODDR) {
            // Hexagonal Rows - Odd
            if (i % 2 === 0) {
                // Even row
                directions = [
                    [-1, -1], [-1, 0],  // NW, NE
                    [0, -1],  [0, 1],   // W, E  
                    [1, -1],  [1, 0]    // SW, SE
                ];
            } else {
                // Odd row
                directions = [
                    [-1, 0],  [-1, 1],  // NW, NE
                    [0, -1],  [0, 1],   // W, E
                    [1, 0],   [1, 1]    // SW, SE
                ];
            }
        } else if (canvas.grid.type === foundry.CONST.GRID_TYPES.HEXODDQ) {
            // Hexagonal Columns - Odd
            if (j % 2 === 0) {
                // Even column
                directions = [
                    [-1, 0],  [0, -1],  // N, NW
                    [0, 1],   [1, -1],  // NE, SW
                    [1, 0],   [1, 1]    // S, SE
                ];
            } else {
                // Odd column  
                directions = [
                    [-1, -1], [-1, 0],  // NW, N
                    [-1, 1],  [0, -1],  // NE, W
                    [0, 1],   [1, 0]    // E, S
                ];
            }
        }
        
        for (const [di, dj] of directions) {
            const newI = i + di;
            const newJ = j + dj;
            
            // Check bounds
            if (newI >= 0 && newI < this.sceneData.numRows && 
                newJ >= 0 && newJ < this.sceneData.numCols) {
                const neighborKey = ChexData.getKey({i: newI, j: newJ});
                const neighborHex = this.hexes.get(neighborKey);
                if (neighborHex) {
                    adjacent.push(neighborHex);
                }
            }
        }
        
        return adjacent;
    }

    _updateVisibility(visibility) {
    }

    getHexFromPoint(point) {
		const {i, j} = canvas.grid.getOffset(point);
		return this.hexes.get(ChexData.getKey({i, j}));
	}

}