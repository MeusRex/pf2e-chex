import { FALLBACK_COLOR, EXPLORATION_STATES, HIGHLIGHT_LAYER } from "./const.mjs";
import ChexFormulaParser from "./formula-parser.mjs";
import KoApplication from "./KoApplication.mjs";
import ImprovementVM from "./ViewModels/ImprovementVM.mjs";
import FeatureVM from "./ViewModels/FeatureVM.mjs";
import ResourceVM from "./ViewModels/ResourceVM.mjs";
import ClaimVM from "./ViewModels/ClaimVM.mjs";
import TerrainVM from "./ViewModels/TerrainVM.mjs";
import TravelVM from "./ViewModels/TravelVM.mjs";
import ExplorationVM from "./ViewModels/ExplorationVM.mjs";
/**
 * An Application instance that renders a HUD for a single hex on the Stolen Lands region map.
 */
export default class ChexHexHUD extends KoApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "chex-hud",
            classes: [chex.CSS_CLASS],
            template: "modules/pf2e-chex/templates/chex-hud.html",
            popOut: false,
            width: 760,
            height: "auto"
        });
    }
    constructor() {
        super();
        this.mlKey = "CHEX.HUD.";
    }
    hex = null;
    enabled = false;
    toggle(enabled) {
        enabled ??= !this.enabled;
        this.enabled = enabled;
        if (enabled)
            chex.manager.kingdomLayer.visible = true;
        else {
            chex.manager.kingdomLayer.visible = false;
            this.clear();
        }
    }
    claimVM = window.ko.observable(new ClaimVM());
    terrainVM = window.ko.observable(new TerrainVM());
    travelVM = window.ko.observable(new TravelVM());
    explorationVM = window.ko.observable(new ExplorationVM());
    improvementVMs = window.ko.observableArray([]);
    featureVMs = window.ko.observableArray([]);
    resourceVMs = window.ko.observableArray([]);
    forageableVMs = window.ko.observableArray([]);
    loadData() {
        if (!this.hex)
            return;
        const data = this.hex.hexData;
        const gm = game.user.isGM;
        this.claimVM().update(data.claimed);
        this.terrainVM().update(data.terrain);
        const currentTravel = ChexFormulaParser.getTravel(data);
        this.travelVM().update(currentTravel);
        this.explorationVM().update(data.exploration > 0, data.cleared, Object.values(EXPLORATION_STATES).find(v => v.value === data.exploration)?.label ?? "");
        this.improvementVMs(data.improvements
            .filter(i => gm || i.show)
            .map(i => new ImprovementVM(i)));
        this.featureVMs(data.features
            .filter(f => gm || f.show)
            .map(f => new FeatureVM(f)));
        this.resourceVMs(data.resources
            .filter(r => gm || r.show)
            .map(r => new ResourceVM(r)));
        this.forageableVMs(data.forageables
            .filter(f => gm || f.show)
            .map(f => new ResourceVM(f)));
    }
    eye(mode) {
        return mode ? "fa-eye" : "fa-eye-slash";
    }
    setPosition({ left, top } = { left: 0, top: 0 }) {
        const position = {
            height: undefined,
            left: left,
            top: top,
            width: this.options.width
        };
        this.element.css(position);
    }
    async activate(hex) {
        this.hex = hex;
        this.loadData();
        if (this.enabled) {
            let { x, y } = hex.topLeft;
            const options = { left: x + hex.config.width + 20, top: y };
            // Highlights this hex  
            canvas.grid.clearHighlightLayer(HIGHLIGHT_LAYER);
            canvas.grid.highlightPosition(HIGHLIGHT_LAYER, { x, y, color: Color.from(hex.color) });
            if (chex.manager.pendingPatches.length > 0) {
                chex.manager.pendingPatches.forEach(patch => {
                    let { x, y } = patch.hex.topLeft;
                    let color = "#ff0000";
                    if (patch.patch.terrain)
                        color = chex.terrains[patch.patch.terrain]?.color || FALLBACK_COLOR;
                    else if (patch.patch.claimed)
                        color = chex.realms[patch.patch.claimed]?.color || FALLBACK_COLOR;
                    canvas.grid.highlightPosition(HIGHLIGHT_LAYER, { x, y, color: Color.from(color) });
                });
            }
            return this._render(true, options);
        }
    }
    /* -------------------------------------------- */
    /**
     * Clear the HUD.
     */
    clear() {
        // @ts-ignore
        let states = this.constructor.RENDER_STATES;
        canvas.grid.clearHighlightLayer(HIGHLIGHT_LAYER);
        if (this._state <= states.NONE)
            return;
        this._state = states.CLOSING;
        this.element.hide();
        this._element = null;
        this._state = states.NONE;
    }
}
