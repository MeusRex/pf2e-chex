import ChexData, { ChexFeature, ChexImprovement, ChexResource } from "./chex-data.mjs";
import KoApplication from "./KoApplication.mjs";
import { CHEX_DATA_KEY, EXPLORATION_STATES, MODULE_ID } from "./const.mjs";
export default class ChexHexEdit extends KoApplication {
    static get defaultOptions() {
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
    constructor(data) {
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
    hexData;
    addObject(key) {
        const add = (arr, item) => {
            item = window.ko.mapping.fromJS(item);
            arr.push(item);
        };
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
    deleteObject(arr, data) {
        arr.remove(data);
    }
    selectedExplorationState = window.ko.observable();
    get explorationStates() {
        return Object.values(EXPLORATION_STATES);
    }
    selectedClaim = window.ko.observable("");
    cleared = window.ko.observable(false);
    realms = Object.values(chex.realms)
        .filter((r) => !r.id)
        .map((r) => r.id);
    improvementTypes = Object.values(chex.improvements)
        .filter((i) => !i.id)
        .map((i) => i.id);
    featureTypes = Object.values(chex.features)
        .filter((f) => !f.id)
        .map((f) => f.id);
    resourceTypes = Object.values(chex.resources)
        .filter((r) => !r.id)
        .map((r) => r.id);
    improvements = window.ko.observableArray();
    features = window.ko.observableArray();
    resources = window.ko.observableArray();
    forageables = window.ko.observableArray();
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
