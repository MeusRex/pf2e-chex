import * as C from "./const.mjs";
import { Feature } from "./customizables/features.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import { Realm } from "./customizables/realms.mjs";
import { Resource } from "./customizables/resources.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import ChexData, { ChexImprovement } from "./chex-data.mjs";

export default class Customizer extends FormApplication {
  static improvementsFrag = "modules/pf2e-chex/templates/frags/chex-custom-improvements.hbs";
  static featuresFrag = "modules/pf2e-chex/templates/frags/chex-custom-features.hbs";
  static resourcesFrag = "modules/pf2e-chex/templates/frags/chex-custom-resources.hbs";
  static realmsFrag = "modules/pf2e-chex/templates/frags/chex-custom-realms.hbs";
  static terrainsFrag = "modules/pf2e-chex/templates/frags/chex-custom-terrains.hbs";
  static travelsFrag = "modules/pf2e-chex/templates/frags/chex-custom-travels.hbs";
  static formId = "chex-customizer";

  static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
          id: Customizer.formId,
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
        Customizer.improvementsFrag, 
        Customizer.featuresFrag, 
        Customizer.resourcesFrag, 
        Customizer.realmsFrag,
        Customizer.terrainsFrag,
        Customizer.travelsFrag]);
      chex.customizer = this;
      return super._render(force, options);
  }

  async close(options) {
      await super.close(options);
      chex.customizer = null;
  }

  async getData(options) {
      return Object.assign(await super.getData(options), {
        improvementsFrag: Customizer.improvementsFrag,
        featuresFrag: Customizer.featuresFrag,
        resourcesFrag: Customizer.resourcesFrag,
        realmsFrag: Customizer.realmsFrag,
        terrainsFrag: Customizer.terrainsFrag,
        travelsFrag: Customizer.travelsFrag,

        improvements: chex.improvements,
        features: chex.features,
        resources: chex.resources,
        realms: chex.realms,
        terrains: chex.terrains,
        travels: chex.travels
      });
  }

  _zip(array) {
    return array.reduce((acc, item) => {
      acc[item.id] = { ...item }; // Use spread operator to create a new object
      return acc;
    }, {});
  }

  async _updateObject(event, formData) {
      formData = foundry.utils.expandObject(formData);
      const improvements = formData.improvements ? Object.values(formData.improvements) : [];
      const features = formData.features ? Object.values(formData.features) : [];
      const resources = formData.resources ? Object.values(formData.resources) : [];
      const realms = formData.realms ? Object.values(formData.realms) : [];
      const terrains = formData.terrains ? Object.values(formData.terrains) : [];
      const travels = formData.travels ? Object.values(formData.travels) : [];

      // update settings
      await game.settings.set(C.MODULE_ID, Improvement.name, this._zip(improvements));
      await game.settings.set(C.MODULE_ID, Feature.name, this._zip(features));
      await game.settings.set(C.MODULE_ID, Resource.name, this._zip(resources));
      await game.settings.set(C.MODULE_ID, Realm.name, this._zip(realms));
      await game.settings.set(C.MODULE_ID, Terrain.name, this._zip(terrains));
      await game.settings.set(C.MODULE_ID, Travel.name, this._zip(travels));
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

  #hideAll() {
    const form = document.getElementById(Customizer.formId);
    const childFieldsets = form.querySelectorAll('fieldset');

    childFieldsets.forEach(function(fieldset) {
      fieldset.style.display = 'none'; 
    });
  }

  #showOne(name) {
    const form = document.getElementById(Customizer.formId);
    const chexImprovementsFieldset = form.querySelector(`[name="${name}"]`);
    if (chexImprovementsFieldset) {
      chexImprovementsFieldset.style.display = 'block'; // or 'inline', 'flex', etc.
    }

    this._refreshPosition();
  }

  async #onClickAction(event) {
    event.preventDefault();
    const control = event.currentTarget;
    const action = control.dataset.action;

    switch ( action ) {
      case "pickIcon": {
        const formGroup = control.closest('div.chex-grid-container');
        const inputField = formGroup.querySelector('.chex-icon-path');
        const imgField = formGroup.querySelector('.chex-img-preview');
        if (inputField) {
          const filePicker = new FilePicker();
          filePicker.callback = (s) => {
            inputField.value = s;
            imgField.src = s;
          };
          filePicker.render(true);
        }
        
        break;
      }
      case "addImprovement": {
        const improvement = new Improvement();
        improvement.id = foundry.utils.randomID();
        const html = await renderTemplate(Customizer.improvementsFrag, {
          improvement: improvement
        });
        this._attach(html, control);
        break;
      }
      case "addFeature": {
        const feature = new Feature();
        feature.id = foundry.utils.randomID();
        const html = await renderTemplate(Customizer.featuresFrag, {
          feature: feature
        });
        this._attach(html, control);
        break;
      }
      case "addRealm": {
        const realm = new Realm();
        realm.id = foundry.utils.randomID();
        const html = await renderTemplate(Customizer.realmsFrag, {
          realm: realm
        });
        this._attach(html, control);
        break;
      }
      case "addResource": {
        const resource = new Resource();
        resource.id = foundry.utils.randomID();
        const html = await renderTemplate(Customizer.resourcesFrag, {
          resource: resource
        });
        this._attach(html, control);
        break;
      }
      case "addTerrain": {
        const terrain = new Terrain();
        terrain.id = foundry.utils.randomID();
        const html = await renderTemplate(Customizer.terrainsFrag, {
          terrain: terrain
        });
        this._attach(html, control);
        break;
      }
      case "addTravel": {
        const travel = new Travel();
        travel.id = foundry.utils.randomID();
        const html = await renderTemplate(Customizer.travelsFrag, {
          travel: travel
        });
        this._attach(html, control);
        break;
      }
      case "delete": {
        const div = control.closest("div.chex-grid-container");
        div.remove();
        this._refreshPosition();
        break;
      }
      case "tabImprovements": {
        this.#hideAll();
        this.#showOne("chex-improvements");
        break;
      }
      case "tabFeatures": {
        this.#hideAll();
        this.#showOne("chex-features");
        break;
      }
      case "tabRealms": {
        this.#hideAll();
        this.#showOne("chex-realms");
        break;
      }
      case "tabResources": {
        this.#hideAll();
        this.#showOne("chex-resources");
        break;
      }
      case "tabTerrains": {
        this.#hideAll();
        this.#showOne("chex-terrains");
        break;
      }
      case "tabTravels": {
        this.#hideAll();
        this.#showOne("chex-travels");
        break;
      }
    }
  }

}