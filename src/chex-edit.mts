import ChexData, { ChexFeature, ChexImprovement, ChexResource } from "./chex-data.mjs";
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

  constructor(data: ChexData) {
    super();
    this.hexData = data;
    this.register = () => chex.hexConfig = this;
    this.unregister = () => chex.hexConfig = null;
    this.mlKey = "CHEX.HEXEDIT.";

    this.knockify(this.hexData.improvements, this.improvements);
    this.knockify(this.hexData.features, this.features);
    this.knockify(this.hexData.resources, this.resources);
    this.knockify(this.hexData.forageables, this.forageables);

    this.selectedClaim(this.hexData.claimed);
    this.selectedExplorationState(EXPLORATION_STATES[this.hexData.exploration] || EXPLORATION_STATES.NONE);
    this.cleared(this.hexData.cleared);
  }

  get title() {
      return `Edit Hex: ${this.hexData}`;
  }

  public hexData: ChexData;

  addObject(key: string) {
    const add = (arr: ko.ObservableArray, item: any) => {
      item = window.ko.mapping.fromJS(item);
      arr.push(item);
    }
    switch (key) {
      case "improvement":
        add(this.improvements, new ChexImprovement());
      break;
        
      case "feature":
        add(this.features, new ChexFeature());
      break;

      case "resource":
        add(this.resources, new ChexResource());
      break;

      case "forageable":
        add(this.forageables, new ChexResource());
      break;
    
      default:
        break;
    }
  }

  deleteObject(arr: ko.ObservableArray, data: any) {
    arr.remove(data);
  }

  selectedExplorationState = window.ko.observable();
  get explorationStates() {
    return Object.values(EXPLORATION_STATES);
  }

  selectedClaim = window.ko.observable<string>("");
  cleared = window.ko.observable<boolean>(false);
  
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