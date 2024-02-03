export default class TerrainPalette extends FormApplication {
    static formId = "chex-terrainSelector";
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: TerrainPalette.formId,
            classes: [chex.CSS_CLASS],
            template: "modules/pf2e-chex/templates/chex-terrain-selector.html",
            width: 240,
            height: "auto",
            popOut: true,
            closeOnSubmit: true
        });
    }
    terrains = Object.values(chex.terrains);
    get title() {
        return game.i18n.localize("CHEX.TERRAINSELECTOR.Title");
    }
    get activeTool() {
        return this._activeTool()?.id ?? null;
    }
    _activeTool = window.ko.observable(null);
    async _render(force, options) {
        chex.terrainSelector = this;
        return super._render(force, options);
    }
    async close(options) {
        await super.close(options);
        chex.terrainSelector = null;
    }
    activateListeners(html) {
        super.activateListeners(html);
        window.ko.applyBindings(this, html[0]);
    }
    selectTerrain(terrain, event) {
        event.preventDefault();
        this._activeTool(terrain);
    }
}
