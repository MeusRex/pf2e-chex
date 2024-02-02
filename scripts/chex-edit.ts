import * as C from "./const";
import ChexData from "./chex-data";
import { Feature } from "./customizables/features";
import { Resource } from "./customizables/resources";
import { Improvement } from "./customizables/improvements";
import { Realm } from "./customizables/realms";

export default class ChexHexEdit extends FormApplication {
  static improvementsFrag = "modules/pf2e-chex/templates/frags/chex-improvements.hbs";
  static featuresFrag = "modules/pf2e-chex/templates/frags/chex-features.hbs";
  static resourcesFrag = "modules/pf2e-chex/templates/frags/chex-resources.hbs";
  static forageablesFrag = "modules/pf2e-chex/templates/frags/chex-forageables.hbs";

  static get defaultOptions() {
      return foundry.utils.mergeObject(this.defaultOptions, {
          id: "chex-edit",
          classes: [chex.CSS_CLASS],
          template: "modules/pf2e-chex/templates/chex-edit.hbs",
          width: 420,
          height: "auto",
          popOut: true,
          closeOnSubmit: true
      });
  }

  get title() {
      return `Edit Hex: ${this.object.toString()}`;
  }

  async _render(force: boolean, options: any) {
      await super.loadTemplates([ChexHexEdit.improvementsFrag, ChexHexEdit.featuresFrag, ChexHexEdit.resourcesFrag, ChexHexEdit.forageablesFrag]);
      chex.hexConfig = this;
      return super._render(force, options);
  }

  async close(options: any) {
      await super.close(options);
      chex.hexConfig = null;
  }

  async getData(options: any) {
      return Object.assign(await super.getData(options), {
        hex: this.object.hexData as ChexData,

        // templates
        improvementsFrag: ChexHexEdit.improvementsFrag,
        featuresFrag: ChexHexEdit.featuresFrag,
        resourcesFrag: ChexHexEdit.resourcesFrag,
        forageablesFrag: ChexHexEdit.forageablesFrag,

        // selection options
        explorationStates: C.EXPLORATION_STATES,
        claimees: chex.realms as Realm[],
        improvements: chex.improvements as Improvement[],
        features: chex.features as Feature[],
        resources: chex.resources as Resource[]
      });
  }

  async _updateObject(event: any, formData: { exploration: number; improvements: { [s: string]: unknown; } | ArrayLike<unknown>; features: { [s: string]: unknown; } | ArrayLike<unknown>; resources: { [s: string]: unknown; } | ArrayLike<unknown>; forageables: { [s: string]: unknown; } | ArrayLike<unknown>; }) {
      formData = foundry.utils.expandObject(formData);
      if (formData.exploration) {
        formData.exploration = +formData.exploration;
      }
      formData.improvements = formData.improvements ? Object.values(formData.improvements) : [];
      formData.features = formData.features ? Object.values(formData.features) : [];
      formData.resources = formData.resources ? Object.values(formData.resources) : [];
      formData.forageables = formData.forageables ? Object.values(formData.forageables) : [];

      let key = ChexData.getKey(this.object.offset);
      canvas.scene.setFlag(C.MODULE_ID, C.CHEX_DATA_KEY, {
        hexes: {
          [key]: formData
        }
      });
    }

  activateListeners(html: { on: (arg0: string, arg1: string, arg2: (event: any) => Promise<void>) => void; }) {
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

  async #onClickAction(event: { preventDefault: () => void; currentTarget: any; }) {
      event.preventDefault();
      const control = event.currentTarget;
      const action = control.dataset.action;
      switch ( action ) {
        case "addImprovement": {
          const html = await super.renderTemplate(ChexHexEdit.improvementsFrag, {
            id: foundry.utils.randomID(),
            improvements: chex.improvements
          });
          this._attach(html, control);
          break;
        }
        case "addFeature": {
          const html = await super.renderTemplate(ChexHexEdit.featuresFrag, {
            id: foundry.utils.randomID(),
            features: chex.features
          });
          this._attach(html, control);
          break;
        }
        case "addResource": {
          const html = await super.renderTemplate(ChexHexEdit.resourcesFrag, {
            id: foundry.utils.randomID(),
            amount: 1,
            resources: chex.resources
          });
          this._attach(html, control);
          break;
        }
        case "addForageable": {
          const html = await super.renderTemplate(ChexHexEdit.forageablesFrag, {
            id: foundry.utils.randomID(),
            amount: 1,
            forageables: chex.resources
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