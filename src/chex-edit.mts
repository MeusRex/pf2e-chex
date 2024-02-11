import ChexData from "./chex-data.mjs";
import { Feature } from "./customizables/features.mjs";
import { Resource } from "./customizables/resources.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import { Realm } from "./customizables/realms.mjs";
import KoApplication from "./KoApplication.mjs";
import { EXPLORATION_STATES } from "./const.mjs";

export default class ChexHexEdit extends KoApplication {
  static override get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
          id: "chex-edit",
          classes: [chex.CSS_CLASS],
          template: "modules/pf2e-chex/templates/chex-edit.html",
          width: 420,
          height: "auto",
          popOut: true,
          closeOnSubmit: true
      });
  }

  constructor() {
    super();
    this.register = () => chex.hexConfig = this;
    this.unregister = () => chex.hexConfig = null;
    this.mlKey = "CHEX.HEXEDIT.";
  }

  get title() {
      return `Edit Hex: ${this.object.toString()}`;
  }

  get hexData() : ChexData {
    return this.object.hexData as ChexData;
  }

  private findExplorationState(val: number) {
    for (const key in EXPLORATION_STATES) {
        if (EXPLORATION_STATES.hasOwnProperty(key)) {
            if (EXPLORATION_STATES[key].value === val) {
                return EXPLORATION_STATES[key];
            }
        }
    }
    return EXPLORATION_STATES.NONE; // fallback
  }

  selectedExplorationState = window.ko.observable(this.findExplorationState(this.hexData.exploration));
  get explorationStates() {
    return EXPLORATION_STATES;
  }

  get realms() {
    return chex.realms;
  }

  cleared = window.ko.observable(false);

  override async getData(options: any) {
      return Object.assign(await super.getData(options), {
        hex: this.object.hexData as ChexData,

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