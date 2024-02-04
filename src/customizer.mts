import * as C from "./const.mjs";
import { Feature } from "./customizables/features.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import { Realm } from "./customizables/realms.mjs";
import { Resource } from "./customizables/resources.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import ChexData, { ChexImprovement } from "./chex-data.mjs";
import KoApplication from "./KoApplication.mjs";

export default class Customizer extends KoApplication {
  static formId = "chex-customizer";

  static override get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
          id: Customizer.formId,
          classes: [chex.CSS_CLASS],
          template: "modules/pf2e-chex/templates/chex-customizer.hbs",
          width: 800,
          height: "auto",
          popOut: true,
          closeOnSubmit: true,
          title: "CHEX.CUSTOMIZER.Title"
      });
  }

constructor() {
  super();
  this.register = () => chex.customizer = this;
  this.unregister = () => chex.customizer = null;
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

  _refreshPosition() {
    this.setPosition({height: "auto"});
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