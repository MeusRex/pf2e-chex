import * as C from "./const.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import ChexData, { ChexImprovement } from "./hex-data.mjs";

export default class ChexCustomizer extends FormApplication {
  static improvementsFrag = "modules/pf2e-chex/templates/frags/chex-custom-improvements.hbs";
  static featuresFrag = "modules/pf2e-chex/templates/frags/chex-custom-features.hbs";
  static resourcesFrag = "modules/pf2e-chex/templates/frags/chex-custom-resources.hbs";
  static realmsFrag = "modules/pf2e-chex/templates/frags/chex-custom-realms.hbs";
  static terrainFrag = "modules/pf2e-chex/templates/frags/chex-custom-terrains.hbs";
  static travelFrag = "modules/pf2e-chex/templates/frags/chex-custom-travels.hbs";

  static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
          id: "chex-customizer",
          classes: [chex.CSS_CLASS],
          template: "modules/pf2e-chex/templates/chex-customizer.hbs",
          width: 800,
          height: "auto",
          popOut: true,
          closeOnSubmit: true
      });
  }

  get title() {
      return  game.i18n.localize("CHEX.CUSTOMIZER.Title");
  }

  async _render(force, options) {
      await loadTemplates([
        ChexCustomizer.improvementsFrag, 
        ChexCustomizer.featuresFrag, 
        ChexCustomizer.resourcesFrag, 
        ChexCustomizer.realmsFrag,
        ChexCustomizer.terrainFrag,
        ChexCustomizer.travelFrag]);
      chex.customizer = this;
      return super._render(force, options);
  }

  async close(options) {
      await super.close(options);
      chex.customizer = null;
  }

  async getData(options) {
      return Object.assign(await super.getData(options), {
        improvementsFrag: ChexCustomizer.improvementsFrag,
        featuresFrag: ChexCustomizer.featuresFrag,
        resourcesFrag: ChexCustomizer.resourcesFrag,
        realmsFrag: ChexCustomizer.realmsFrag,
        terrainFrag: ChexCustomizer.terrainFrag,
        travelFrag: ChexCustomizer.travelFrag,

        improvements: chex.improvements,
        features: chex.features,
        resources: chex.resources,
        realms: chex.realms,
        terrains: chex.terrains,
        travels: chex.travels
      });
  }

  async _updateObject(event, formData) {
      formData = foundry.utils.expandObject(formData);
      formData.improvements = formData.improvements ? Object.values(formData.improvements) : [];
      formData.features = formData.features ? Object.values(formData.features) : [];
      formData.resources = formData.resources ? Object.values(formData.resources) : [];
      formData.realms = formData.realms ? Object.values(formData.realms) : [];
      formData.terrains = formData.terrains ? Object.values(formData.terrains) : [];
      formData.travels = formData.travels ? Object.values(formData.travels) : [];

      // update settings
    }

  activateListeners(html) {
      super.activateListeners(html);
      html.on("click", "[data-action]", this.#onClickAction.bind(this));
    }

  _refreshPosition() {
    this.setPosition({height: "auto"});
  }

  _attach(html, control) {
    const fieldset = control.closest("fieldset");
    fieldset.insertAdjacentHTML("beforeend", html);
    this._refreshPosition();
  }

  async #onClickAction(event) {
    event.preventDefault();
    const control = event.currentTarget;
    const action = control.dataset.action;

    switch ( action ) {
      case "pickIcon": {
        const formGroup = control.closest('div.form-group');
        const inputField = formGroup.querySelector('.chex-icon-path');
        if (inputField) {
          const filePicker = new FilePicker();
          filePicker.callback = (s) => {
            inputField.value = s;
          };
          filePicker.render(true);
        }
        
        break;
      }
      case "addImprovement": {
        const improvement = new Improvement();
        improvement.id = foundry.utils.randomID();
        const html = await renderTemplate(ChexCustomizer.improvementsFrag, {
          improvement: improvement
        });
        this._attach(html, control);
        break;
      }
      case "delete": {
        const div = control.closest("div.form-group");
        div.remove();
        this._refreshPosition();
        break;
      }
    }
  }

}