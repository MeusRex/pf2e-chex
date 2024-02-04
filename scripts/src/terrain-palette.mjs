import KoApplication from "./KoApplication.mjs";
export default class TerrainPalette extends KoApplication {
    static formId = "chex-terrainSelector";
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: TerrainPalette.formId,
            classes: [chex.CSS_CLASS],
            template: "modules/pf2e-chex/templates/chex-terrain-selector.html",
            width: 240,
            height: "auto",
            popOut: true,
            closeOnSubmit: true,
            title: "CHEX.TERRAINSELECTOR.Title"
        });
    }
    constructor() {
        super();
        this.register = () => chex.terrainSelector = this;
        this.unregister = () => chex.terrainSelector = null;
    }
    terrains = Object.values(chex.terrains);
    get activeTool() {
        return this._activeTool()?.id ?? null;
    }
    _activeTool = window.ko.observable(null);
    selectTerrain(terrain, event) {
        event.preventDefault();
        this._activeTool(terrain);
    }
}
