import * as C from "./const.mjs";
import ChexData from "./chex-data.mjs";
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
    async _render(force, options) {
        await super.loadTemplates([ChexHexEdit.improvementsFrag, ChexHexEdit.featuresFrag, ChexHexEdit.resourcesFrag, ChexHexEdit.forageablesFrag]);
        chex.hexConfig = this;
        return super._render(force, options);
    }
    async close(options) {
        await super.close(options);
        chex.hexConfig = null;
    }
    async getData(options) {
        return Object.assign(await super.getData(options), {
            hex: this.object.hexData,
            // templates
            improvementsFrag: ChexHexEdit.improvementsFrag,
            featuresFrag: ChexHexEdit.featuresFrag,
            resourcesFrag: ChexHexEdit.resourcesFrag,
            forageablesFrag: ChexHexEdit.forageablesFrag,
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
    activateListeners(html) {
        super.activateListeners(html);
        html.on("click", "[data-action]", this.#onClickAction.bind(this));
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
