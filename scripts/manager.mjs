import ChexLayer from "./chex-layer.mjs";
import * as C from "./const.mjs";
import ChexData from "./chex-data.mjs";
import ChexHex from "./hex.mjs";
import ChexDrawingLayer from "./chex-drawing-layer.mjs";
import ChexSceneData from "./scene-data.mjs";
import ChexOffset from "./chex-offset.mjs";
import ChexConfig from "./apps/config.mjs";
import HexEditor from "./apps/hex-editor.mjs";
import HexHUD from "./apps/hex-hud.mjs";
import MapViewPanel from "./apps/map-view.mjs";
import PaintPalette from "./apps/paint-palette.mjs";
import KingdomView from "./apps/kingdom-view.mjs";
import SettlementSheet from "./apps/settlement-sheet.mjs";
import { confirm, manageableRealms, pickRealm } from "./apps/economy-ui.mjs";
import { canManage, findSettlementAt } from "./economy/realm-store.mjs";

export default class ChexManager {
    constructor() {
        this.hud = new HexHUD();
    }
    /**
     * @type {ChexDrawingLayer}
     */
    kingdomLayer;

    hoveredHex;

    /**
     * @type {HexHUD}
     */
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

    /**
     * What the overlay colors hexes by, see the map view.
     */
    get mode() {
        return MapViewPanel.view.colorBy;
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

    _extendSceneControlButtons(controls) {
        const tokenControls = controls["tokens"];

        if (this.active) {
            tokenControls.tools["chexOverlay"] = {
                name: "chexOverlay",
                title: "CHEX.TOOLS.Overlay",
                icon: C.ICONS.overlay,
                toggle: true,
                active: this.hud.enabled,
                onChange: (event, active) => this.hud.toggle(active)
            };
            tokenControls.tools["chexMapView"] = {
                name: "chexMapView",
                title: "CHEX.TOOLS.MapView",
                icon: C.ICONS.mapView,
                button: true,
                onChange: (event, active) => {if (active) MapViewPanel.toggle()}
            };
        }

        if (manageableRealms().length) {
            tokenControls.tools["chexKingdom"] = {
                name: "chexKingdom",
                title: "CHEX.TOOLS.Kingdom",
                icon: C.ICONS.kingdom,
                button: true,
                onChange: async (event, active) => {
                    if (!active) return;
                    const realmId = await pickRealm();
                    if (realmId) KingdomView.open(realmId);
                }
            };
        }

        if (!game.user.isGM) return;
        const tools = {};
        if (this.active) {
            tools.chexPaint = {
                name: "chexPaint",
                title: "CHEX.TOOLS.Paint",
                icon: C.ICONS.paint,
                button: true,
                onChange: (event, active) => {if (active) this.#openPaint()}
            };
        }
        tools.chexConfig = {
            name: "chexConfig",
            title: "CHEX.TOOLS.Config",
            icon: C.ICONS.config,
            button: true,
            onChange: (event, active) => {if (active) ChexConfig.open()}
        };
        tools.chexEnable = {
            name: "chexEnable",
            title: this.active ? "CHEX.TOOLS.RemoveChex" : "CHEX.TOOLS.AddChex",
            icon: C.ICONS.power,
            button: true,
            onChange: (event, active) => {if (active) this.#enableChex()}
        };
        controls.chexTools = {
            name: "chexTools",
            title: "CHEX.TOOLS.ChexTools",
            icon: C.ICONS.overlay,
            layer: "chex",
            onChange: (event, active) => {if (active) canvas.chex.activate()},
            tools
        };
    }

    get isValidGrid() {
        return canvas.grid.type === foundry.CONST.GRID_TYPES.HEXODDR || canvas.grid.type === foundry.CONST.GRID_TYPES.HEXODDQ;
    }

    /**
     * Open the paint palette. Painting needs hovered hexes, which only exist while the overlay is on.
     */
    #openPaint() {
        if (!this.hud.enabled) {
            this.hud.toggle(true);
            ui.controls.render();
        }
        PaintPalette.open();
    }

    async #enableChex() {
        if (this.active) {
            const ok = await confirm(game.i18n.localize("CHEX.REMOVE.Title"), game.i18n.localize("CHEX.REMOVE.Info"));
            if (!ok) return;
            await canvas.scene.unsetFlag(C.MODULE_ID, C.CHEX_DATA_KEY);
            location.reload();
        }
        else if (this.isValidGrid) {
            await ChexSceneData.create(canvas.scene);
            location.reload();
        }
        else {
            ui.notifications.warn("CHEX.Error.InvalidGrid", {localize: true});
        }
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
        this.kingdomLayer.visible = this.hud.enabled;
        this.kingdomLayer.draw();
        canvas.interface.grid.addHighlightLayer(C.HIGHLIGHT_LAYER);

        this.#mousemove = this.#onMouseMove.bind(this);
        canvas.stage.on("mousemove", this.#mousemove);
        // players need clicks to open settlements, GMs also paint with them
        this.#mousedown = this.#onMouseDown.bind(this);
        canvas.stage.on("mousedown", this.#mousedown);
        this.#mouseup = this.#onMouseUp.bind(this);
        canvas.stage.on("mouseup", this.#mouseup);
    }

    _onTearDown() {
        if (!this.active) return;

        this.hoveredHex = null;
        this.hud.clear();

        canvas.stage.off("mousemove", this.#mousemove);
        this.#mousemove = undefined;
        canvas.stage.off("mousedown", this.#mousedown);
        this.#mousedown = undefined;
        canvas.stage.off("mouseup", this.#mouseup);
        this.#mouseup = undefined;

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
            if (this.#isMouseDown) this.#paintStroke(hex);
            this.hud.activate(hex);
        }
        this.hoveredHex = hex || null;
    }

    #onMouseDown(event) {
        if ( !this.hoveredHex ) return;
        if ( !game.user.isGM ) {
            if ( this.#isDoubleClick() ) this.#openSettlementAt(this.hoveredHex);
            return;
        }
        this.#isMouseDown = true;

        // painting with the palette
        if (chex.paint && canvas.activeLayer.name === ChexLayer.name) {
            if (!chex.paint.click(this.hoveredHex, !!event.shiftKey)) this.#paintStroke(this.hoveredHex);
            return;
        }

        if ( !this.#isDoubleClick() ) return;
        HexEditor.open(this.hoveredHex, {left: event.x + 100, top: event.y - 50});
    }

    #isDoubleClick() {
        const t0 = this.#clickTime;
        const t1 = this.#clickTime = Date.now();
        return (t1 - t0) <= 250;
    }

    /**
     * Open the settlement on a hex, if there is one the user may see.
     * @returns {boolean} whether a settlement was opened
     */
    #openSettlementAt(hex) {
        const found = findSettlementAt(canvas.scene.id, ChexData.getKey(hex.offset));
        if ( !found || !canManage(game.user, found.realmId) ) return false;
        SettlementSheet.open(found.realmId, found.settlement.id);
        return true;
    }

    #onMouseUp(event) {
        this.#isMouseDown = false;
        this.#commitStroke();
    }

    /**
     * Hexes of the terrain or realm stroke being painted. Saved at once when the mouse is released.
     * @type {{hex: ChexHex, key: number, patch: object}[]}
     */
    pendingPatches = [];

    #paintStroke(hex) {
        if (!chex.paint || canvas.activeLayer.name !== ChexLayer.name) return;
        const patch = chex.paint.strokePatch(hex);
        if (patch) this.pendingPatches.push({hex, key: ChexData.getKey(hex.offset), patch});
    }

    #commitStroke() {
        if (this.pendingPatches.length) {
            const hexes = Object.fromEntries(this.pendingPatches.map(({key, patch}) => [key, patch]));
            canvas.scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, {hexes});
        }
        this.pendingPatches = [];
    }

    /**
     * All hexes connected to a start hex that fulfil a condition, including the start hex.
     * @param {ChexHex} start
     * @param {(hex: ChexHex) => boolean} matches
     * @returns {ChexHex[]}
     */
    floodFill(start, matches) {
        const visited = new Set();
        const result = [];
        const queue = [start];
        while (queue.length > 0) {
            const hex = queue.shift();
            const key = ChexData.getKey(hex.offset);
            if (visited.has(key)) continue;
            visited.add(key);
            if (!matches(hex)) continue;
            result.push(hex);
            for (const neighbor of this.#getAdjacentHexes(hex)) {
                if (!visited.has(ChexData.getKey(neighbor.offset))) queue.push(neighbor);
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

    getHexFromPoint(point) {
		const {i, j} = canvas.grid.getOffset(point);
		return this.hexes.get(ChexData.getKey({i, j}));
	}

}
