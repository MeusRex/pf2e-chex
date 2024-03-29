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
      closeOnSubmit: true
    });
  }

  get title() {
    return  game.i18n.localize("CHEX.TERRAINSELECTOR.Title");
  }

  activeTool = null;

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
      terrains: chex.terrains
    });
  }

  activateListeners(html) {
      super.activateListeners(html);
      html.on("click", "[data-action]", this.#onClickAction.bind(this));
    }

  async #onClickAction(event) {
    event.preventDefault();
    const control = event.currentTarget;
    const action = control.dataset.action;
    this.activeTool = action;

    const form = document.getElementById(TerrainPalette.formId);
    const buttons = form.querySelectorAll('button');
    buttons.forEach(element => {
      if (element.id === action) {
        element.classList.add("active");
      }
      else {
        element.classList.remove("active");
      }
    });
  }
}