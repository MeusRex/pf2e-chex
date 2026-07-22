export default class TerrainPalette extends FormApplication {
  static formId = "chex-terrainSelector";

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: TerrainPalette.formId,
      classes: [chex.CSS_CLASS],
      template: "modules/pf2e-chex/templates/chex-terrain-selector.hbs",
      width: 240,
      height: "auto",
      popOut: true,
      closeOnSubmit: false
    });
  }

  get title() {
    return  game.i18n.localize("CHEX.TERRAINSELECTOR.Title");
  }

  activeTerrainTool = null;
  paintBucketMode = false;

  async _render(force, options) {
    chex.terrainSelector = this;
    return super._render(force, options);
  }

  async close(options) {
    await super.close(options);
    chex.terrainSelector = null;
  }

  async getData(options) {
    return Object.assign(await super.getData(options), {
      terrains: chex.terrains,
      paintBucketMode: this.paintBucketMode
    });
  }

  activateListeners(html) {
      super.activateListeners(html);
      html.on("click", "[data-action]", this.#onClickAction.bind(this));
      html.on("change", "#paint-bucket-checkbox", this.#onPaintBucketToggle.bind(this));
    }

  #onPaintBucketToggle(event) {
    this.paintBucketMode = event.target.checked;
  }

  async #onClickAction(event) {
    event.preventDefault();
    const control = event.currentTarget;
    const action = control.dataset.action;
    this.activeTerrainTool = action;

    const form = document.getElementById(TerrainPalette.formId);
    const buttons = form.querySelectorAll('button[data-action]');
    buttons.forEach(element => {
      if (element.dataset.action === action) {
        element.classList.add("active");
      }
      else {
        element.classList.remove("active");
      }
    });
  }
}