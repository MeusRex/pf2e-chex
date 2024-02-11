import ChexData from "./chex-data.mjs";
import KoApplication from "./KoApplication.mjs";
import { EXPLORATION_STATES } from "./const.mjs";
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
    constructor() {
        super();
        this.register = () => chex.hexConfig = this;
        this.unregister = () => chex.hexConfig = null;
        this.mlKey = "CHEX.HEXEDIT.";
    }
    get title() {
        return `Edit Hex: ${this.object.toString()}`;
    }
    get hexData() {
        return this.object.hexData;
    }
    findExplorationState(val) {
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
    async getData(options) {
        return Object.assign(await super.getData(options), {
            hex: this.object.hexData,
            // selection options
            explorationStates: C.EXPLORATION_STATES,
            claimees: chex.realms,
            improvements: chex.improvements,
            features: chex.features,
            resources: chex.resources
        });
    }
    async _updateObject(event, formData) {
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
        this.setPosition({ height: "auto" });
    }
    _attach(html, control) {
        const fieldset = control.closest("fieldset");
        fieldset.insertAdjacentHTML("beforeend", html);
        this._refreshPosition();
    }
    async #onClickAction(event) {
        event.preventDefault();
        const control = event.currentTarget;
        const action = control.dataset.action;
        switch (action) {
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
