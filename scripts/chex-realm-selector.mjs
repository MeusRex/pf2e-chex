export default class chexRealmSelector extends FormApplication {
  static formId = "chex-realmSelector";

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: chexRealmSelector.formId,
      classes: [chex.CSS_CLASS],
      template: "modules/pf2e-chex/templates/chex-realm-selector.hbs",
      width: 240,
      height: "auto",
      popOut: true,
      closeOnSubmit: true
    });
  }

  get title() {
    return  game.i18n.localize("CHEX.REALMSELECTOR.Title");
  }

  get activeTool() {
    const selectElement = document.getElementById('chex-realm-select');
    return selectElement.options[selectElement.selectedIndex].value;
  }

  async _render(force, options) {
    chex.realmSelector = this;
    return super._render(force, options);
  }

  async close(options) {
    await super.close(options);
    chex.realmSelector = null;
  }

  async getData(options) {
    return Object.assign(await super.getData(options), {
      realms: chex.realms
    });
  }
}