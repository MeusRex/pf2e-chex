import { Terrain } from "./customizables/terrain.mjs";

export default class TerrainPalette extends FormApplication {
  static formId = "chex-terrainSelector";

  static override get defaultOptions() {
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

  terrains: Terrain[] = Object.values(chex.terrains);

  get title() {
    return  game.i18n.localize("CHEX.TERRAINSELECTOR.Title");
  }

  get activeTool(): string | null {
    return this._activeTool()?.id ?? null;
  }
  _activeTool: ko.Observable<Terrain|null> = window.ko.observable(null);

  override async _render(force: boolean, options: any) {
    chex.terrainSelector = this;
    return super._render(force, options);
  }

  override async close(options: any) {
    await super.close(options);
    chex.terrainSelector = null;
  }

  override activateListeners(html: any) {
      super.activateListeners(html);
      window.ko.applyBindings(this, html[0]);
    }

  selectTerrain(terrain: Terrain, event: Event) {
    event.preventDefault();
    this._activeTool(terrain);
  }
}