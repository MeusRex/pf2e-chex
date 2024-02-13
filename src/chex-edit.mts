import ChexData from "./chex-data.mjs";
import { Feature } from "./customizables/features.mjs";
import { Resource } from "./customizables/resources.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import { Realm } from "./customizables/realms.mjs";
import KoApplication from "./KoApplication.mjs";
import { CHEX_DATA_KEY, EXPLORATION_STATES, MODULE_ID } from "./const.mjs";

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

    this.knockify(this.hexData.improvements, this.improvements);
    this.knockify(this.hexData.features, this.features);
    this.knockify(this.hexData.resources, this.resources);
    this.knockify(this.hexData.forageables, this.forageables);
  }

  get title() {
      return `Edit Hex: ${this.object.toString()}`;
  }

  get hexData() : ChexData {
    return this.object.hexData as ChexData;
  }

  addObject(key: string) {
    switch (key) {
      case "improvement":
        
      break;

      case "feature":
      
      break;

      case "resource":
      
      break;

      case "forageable":
      
      break;
    
      default:
        break;
    }
  }

  deleteObject(arr: ko.ObservableArray, data: any) {
    arr.remove(data);
  }

  selectedExplorationState = window.ko.observable(EXPLORATION_STATES[this.hexData.exploration] || EXPLORATION_STATES.NONE);
  get explorationStates() {
    return EXPLORATION_STATES;
  }

  selectedClaim = window.ko.observable<string>(this.hexData.claimed);
  cleared = window.ko.observable<boolean>(this.hexData.cleared);
  
  realms: string[] = Object.values(chex.realms)
    .filter((r: Realm) => !r.id)
    .map((r: Realm) => r.id!);

  improvementTypes: string[] = Object.values(chex.improvements)
    .filter((i: Improvement) => !i.id)
    .map((i: Improvement) => i.id!);

  featureTypes: string[] = Object.values(chex.features)
    .filter((f: Feature) => !f.id)
    .map((f: Feature) => f.id!);

  resourceTypes: string[] = Object.values(chex.resources)
    .filter((r: Resource) => !r.id)
    .map((r: Resource) => r.id!);

  improvements: ko.ObservableArray<any> = window.ko.observableArray();
  features: ko.ObservableArray<any> = window.ko.observableArray();
  resources: ko.ObservableArray<any> = window.ko.observableArray();
  forageables: ko.ObservableArray<any> = window.ko.observableArray();

  async save() {
    const data = this.hexData;

    data.exploration = this.selectedExplorationState().value;
    data.cleared = this.cleared();
    data.claimed = this.selectedClaim();

    data.improvements = this.deknockify(this.improvements()) || [];
    data.features = this.deknockify(this.features()) || [];
    data.resources = this.deknockify(this.resources()) || [];
    data.forageables = this.deknockify(this.forageables()) || [];

    let key = ChexData.getKey(this.object.offset);
    canvas.scene.setFlag(MODULE_ID, CHEX_DATA_KEY, {
      hexes: {
        [key]: data
      }
    });

    this.close(null);
  }

}