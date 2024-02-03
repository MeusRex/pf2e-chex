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

  static override get defaultOptions() {
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

  override async _render(force: boolean, options: { left: any; top: any; }) {
      await super.loadTemplates([
        Customizer.improvementsFrag, 
        Customizer.featuresFrag, 
        Customizer.resourcesFrag, 
        Customizer.realmsFrag,
        Customizer.terrainsFrag,
        Customizer.travelsFrag]);
      chex.customizer = this;
      return super._render(force, options);
  }

  override async close(options: any) {
      await super.close(options);
      chex.customizer = null;
  }

  override async getData(options: any) {
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

  _zip(array: any[]) {
    return array.reduce((acc: { [x: string]: any; }, item: { id: string | number; }) => {
      acc[item.id] = { ...item }; // Use spread operator to create a new object
      return acc;
    }, {});
  }

  async _updateObject(event: any, formData: { improvements: { [s: string]: unknown; } | ArrayLike<unknown>; features: { [s: string]: unknown; } | ArrayLike<unknown>; resources: { [s: string]: unknown; } | ArrayLike<unknown>; realms: { [s: string]: unknown; } | ArrayLike<unknown>; terrains: { [s: string]: unknown; } | ArrayLike<unknown>; travels: { [s: string]: unknown; } | ArrayLike<unknown>; }) {
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

  override activateListeners(html: { on: any; }) {
      super.activateListeners(html);
      html.on("click", "[data-action]", this.#onClickAction.bind(this));
    }

  _refreshPosition() {
    this.setPosition({height: "auto"});
  }

  _attach(html: any, control: { closest: (arg0: string) => any; }) {
    const fieldset = control.closest("fieldset");
    fieldset.insertAdjacentHTML("beforeend", html);
    this._refreshPosition();
  }

  #hideAll() {
    const form = document.getElementById(Customizer.formId);
    if (!form)
      return;
    const childFieldsets = form.querySelectorAll('fieldset');

    childFieldsets.forEach(function(fieldset) {
      fieldset.style.display = 'none'; 
    });
  }

  #showOne(name: any) {
    const form = document.getElementById(Customizer.formId);
    if (!form)
      return;
    const chexImprovementsFieldset = form.querySelector(`[name="${name}"]`);
    if (chexImprovementsFieldset) {
      //@ts-ignore
      chexImprovementsFieldset.style.display = 'block'; // or 'inline', 'flex', etc.
    }

    this._refreshPosition();
  }

  async #onClickAction(event: { preventDefault: () => void; currentTarget: any; }) {
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
          filePicker.callback = (s: any) => {
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
        const html = await super.renderTemplate(Customizer.improvementsFrag, {
          improvement: improvement
        });
        this._attach(html, control);
        break;
      }
      case "addFeature": {
        const feature = new Feature();
        feature.id = foundry.utils.randomID();
        const html = await super.renderTemplate(Customizer.featuresFrag, {
          feature: feature
        });
        this._attach(html, control);
        break;
      }
      case "addRealm": {
        const realm = new Realm();
        realm.id = foundry.utils.randomID();
        const html = await super.renderTemplate(Customizer.realmsFrag, {
          realm: realm
        });
        this._attach(html, control);
        break;
      }
      case "addResource": {
        const resource = new Resource();
        resource.id = foundry.utils.randomID();
        const html = await super.renderTemplate(Customizer.resourcesFrag, {
          resource: resource
        });
        this._attach(html, control);
        break;
      }
      case "addTerrain": {
        const terrain = new Terrain();
        terrain.id = foundry.utils.randomID();
        const html = await super.renderTemplate(Customizer.terrainsFrag, {
          terrain: terrain
        });
        this._attach(html, control);
        break;
      }
      case "addTravel": {
        const travel = new Travel();
        travel.id = foundry.utils.randomID();
        const html = await super.renderTemplate(Customizer.travelsFrag, {
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