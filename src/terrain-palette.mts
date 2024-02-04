import KoApplication from "./KoApplication.mjs";
import { Terrain } from "./customizables/terrain.mjs";

export default class TerrainPalette extends KoApplication {
  static formId = "chex-terrainSelector";

  static override get defaultOptions() {
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

  terrains: Terrain[] = Object.values(chex.terrains);

  get activeTool(): string | null {
    return this._activeTool()?.id ?? null;
  }
  _activeTool: ko.Observable<Terrain|null> = window.ko.observable(null);

  selectTerrain(terrain: Terrain, event: Event) {
    event.preventDefault();
    this._activeTool(terrain);
  }
}