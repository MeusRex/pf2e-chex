import * as C from "./const.mjs";
import ChexData from "./hex-data.mjs";

export default class ChexHexEdit extends FormApplication {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "kingmaker-hex-edit",
            classes: [chex.CSS_CLASS],
            template: "modules/pf2e-realms/templates/hex-edit.hbs",
            width: 420,
            height: "auto",
            popOut: true,
            closeOnSubmit: true
        });
    }

    static featurePartial = "modules/pf2e-realms/templates/hex-edit-feature.hbs";

    get title() {
        return `Edit Hex: ${this.object.toString()}`;
    }

    async _render(force, options) {
        await loadTemplates([this.constructor.featurePartial]);
        chex.hexConfig = this;
        return super._render(force, options);
    }

    async close(options) {
        await super.close(options);
        chex.hexConfig = null;
    }

    async getData(options) {
        return Object.assign(await super.getData(options), {
          camps: C.CAMPS,
          commodities: C.COMMODITIES,
          explorationStates: C.EXPLORATION_STATES,
          hex: this.object.hexData,
          features: C.FEATURES,
          featurePartial: this.constructor.featurePartial
        });
    }

    async _updateObject(event, formData) {
        formData = foundry.utils.expandObject(formData);
        formData.features = formData.features ? Object.values(formData.features) : [];

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

    async #onClickAction(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const action = button.dataset.action;
        switch ( action ) {
          case "addFeature": {
            const html = await renderTemplate(this.constructor.featurePartial, {
              id: foundry.utils.randomID(),
              type: "landmark",
              features: C.FEATURES
            });
            const fieldset = button.closest("fieldset");
            fieldset.insertAdjacentHTML("beforeend", html);
            this.setPosition({height: "auto"});
            break;
          }
          case "removeFeature": {
            const div = button.closest("div.form-group");
            div.remove();
            this.setPosition({height: "auto"});
            break;
          }
        }
      }

}