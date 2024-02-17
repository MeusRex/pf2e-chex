import * as C from "./const.mjs";
import { Feature } from "./customizables/features.mjs";
import { Improvement } from "./customizables/improvements.mjs";
import { Realm } from "./customizables/realms.mjs";
import { Resource } from "./customizables/resources.mjs";
import { Terrain } from "./customizables/terrain.mjs";
import { Travel } from "./customizables/travel.mjs";
import KoApplication from "./KoApplication.mjs";
export default class Customizer extends KoApplication {
    static formId = "chex-customizer";
    static get defaultOptions() {
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
        this.mlKey = "CHEX.CUSTOMIZER.";
        this.knockify(Object.values(chex.features), this.features);
        this.knockify(Object.values(chex.improvements), this.improvements);
        this.knockify(Object.values(chex.realms), this.realms);
        this.knockify(Object.values(chex.resources), this.resources);
        this.knockify(Object.values(chex.travels), this.travels);
        this.knockify(Object.values(chex.terrains), this.terrains);
    }
    features = window.ko.observableArray();
    improvements = window.ko.observableArray();
    resources = window.ko.observableArray();
    realms = window.ko.observableArray();
    travels = window.ko.observableArray();
    terrains = window.ko.observableArray();
    async save() {
        await game.settings.set(C.MODULE_ID, Feature.name, this.deknockifyAndZip(this.features()));
        await game.settings.set(C.MODULE_ID, Improvement.name, this.deknockifyAndZip(this.improvements()));
        await game.settings.set(C.MODULE_ID, Realm.name, this.deknockifyAndZip(this.realms()));
        await game.settings.set(C.MODULE_ID, Resource.name, this.deknockifyAndZip(this.resources()));
        await game.settings.set(C.MODULE_ID, Terrain.name, this.deknockifyAndZip(this.terrains()));
        await game.settings.set(C.MODULE_ID, Travel.name, this.deknockifyAndZip(this.travels()));
    }
    activeTab = window.ko.observable('');
    toggleTab(tabName) {
        if (this.activeTab() === tabName)
            this.activeTab('');
        else
            this.activeTab(tabName);
    }
    addObject(type) {
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
    pickIcon(object) {
        const filePicker = new FilePicker();
        filePicker.callback = (path) => {
            object.img(path);
        };
        filePicker.render(true);
    }
    deleteObject(arr, data) {
        arr.remove(data);
    }
}
