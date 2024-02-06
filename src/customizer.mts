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
          template: "modules/pf2e-chex/templates/chex-customizer.html",
          width: 800,
          height: 1200,
          popOut: true,
          closeOnSubmit: true,
          title: "CHEX.CUSTOMIZER.Title"
      });
  }

  constructor() {
    super();
    this.register = () => chex.customizer = this;
    this.unregister = () => chex.customizer = null;

    this.knockify(Object.values(chex.features), this.features);
    this.knockify(Object.values(chex.improvements), this.improvements);
    this.knockify(Object.values(chex.realms), this.realms);
    this.knockify(Object.values(chex.resources), this.resources);
    this.knockify(Object.values(chex.travels), this.travels);
    this.knockify(Object.values(chex.terrains), this.terrains);
  }

  private knockify(origin: any[], target: ko.ObservableArray) {
    origin.forEach(o => {
      target.push(window.ko.mapping.toJS(o));
    });
  }

  private deknockify(origin: any[]): object {
    const arr: any[] = [];
    origin.forEach(o => {
      arr.push(window.ko.mapping.fromJS(o));
    });

    return this.zip(arr);
  }

  features: ko.ObservableArray<any> = window.ko.observableArray();
  improvements: ko.ObservableArray<any> = window.ko.observableArray();
  resources: ko.ObservableArray<any> = window.ko.observableArray();
  realms: ko.ObservableArray<any> = window.ko.observableArray();
  travels: ko.ObservableArray<any> = window.ko.observableArray();
  terrains: ko.ObservableArray<any> = window.ko.observableArray();

  private zip(array: any[]): object {
    return array.reduce((acc: { [x: string]: any; }, item: { id: string | number; }) => {
      acc[item.id] = { ...item }; // Use spread operator to create a new object
      return acc;
    }, {});
  }

  async save() {
    await game.settings.set(C.MODULE_ID, Feature.name, this.zip(this.features()));
    await game.settings.set(C.MODULE_ID, Improvement.name, this.zip(this.improvements()));
    await game.settings.set(C.MODULE_ID, Realm.name, this.zip(this.realms()));
    await game.settings.set(C.MODULE_ID, Resource.name, this.zip(this.resources()));
    await game.settings.set(C.MODULE_ID, Terrain.name, this.zip(this.terrains()));
    await game.settings.set(C.MODULE_ID, Travel.name, this.zip(this.travels()));
  }

  activeTab: ko.Observable<string> = window.ko.observable('');
  toggleTab(tabName: string) {
    if (this.activeTab() === tabName)
      this.activeTab('');
    else
      this.activeTab(tabName);
  }

  addObject(type: string) {
    switch (type) {
      case "improvement":
        this.improvements.push(window.ko.mapping.fromJS(new Improvement(foundry.utils.randomID())));
        break;
    
      case "features":
        this.features.push(window.ko.mapping.fromJS(new Feature(foundry.utils.randomID())));
        break;
      
      case "realms":
        this.realms.push(window.ko.mapping.fromJS(new Realm(foundry.utils.randomID())));
        break;

      case "resources":
        this.resources.push(window.ko.mapping.fromJS(new Resource(foundry.utils.randomID())));
        break;

      case "terrains":
        this.terrains.push(window.ko.mapping.fromJS(new Terrain(foundry.utils.randomID())));
        break;
      
        case "travels":
        this.travels.push(window.ko.mapping.fromJS(new Travel(foundry.utils.randomID())));
        break;

      default:
        break;
    }
  }

  pickIcon(object: any) {
    const filePicker = new FilePicker();
    filePicker.callback = (path: string) => {
      object.img(path);
    };
    filePicker.render(true);
  }

  deleteObject(arr: ko.ObservableArray, data: any) {
    arr.remove(data);
  }
}