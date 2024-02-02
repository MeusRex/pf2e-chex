import { CHEX_DATA_KEY, MODULE_ID } from "./const";
import ChexFormulaParser from "./formula-parser";
export default class RealmPalette extends FormApplication {
    static formId = "chex-realmSelector";
    static get defaultOptions() {
        return foundry.utils.mergeObject(this.defaultOptions, {
            id: RealmPalette.formId,
            classes: [chex.CSS_CLASS],
            template: "modules/pf2e-chex/templates/chex-realm-selector.hbs",
            width: 240,
            height: "auto",
            popOut: true,
            closeOnSubmit: true
        });
    }
    get title() {
        return game.i18n.localize("CHEX.REALMSELECTOR.Title");
    }
    get activeTool() {
        const selectElement = document.getElementById('chex-realm-select');
        // @ts-ignore
        return selectElement.options[selectElement.selectedIndex].value;
    }
    async _render(force, options) {
        chex.realmSelector = this;
        return super._render(force, options);
    }
    async close(options) {
        await super.close(options);
        chex.realmSelector = null;
    }
    async getData(options) {
        return Object.assign(await super.getData(options), {
            realms: chex.realms
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.on("click", "[data-action]", this.#onClickAction.bind(this));
    }
    async #onClickAction(event) {
        event.preventDefault();
        const control = event.currentTarget;
        const action = control.dataset.action;
        if (action === "report" && this.activeTool) {
            const realm = this.activeTool;
            let hexes = Object.values(canvas.scene.getFlag(MODULE_ID, CHEX_DATA_KEY).hexes);
            let mergedResources = {};
            // Iterate over each hexData and sum up the resources
            hexes.forEach((hexData) => {
                if (hexData.claimed === this.activeTool) {
                    const resources = ChexFormulaParser.getResources(hexData);
                    if (Object.keys(resources)) {
                        Object.entries(resources).forEach(([resource, amount]) => {
                            mergedResources[resource] = (mergedResources[resource] || 0) + amount;
                        });
                    }
                }
            });
            if (Object.keys(mergedResources).length) {
                let msg = `The income for this realm from owner hexes is:\n`;
                Object.entries(mergedResources).forEach(([resource, amount]) => {
                    msg += `${resource}: ${amount}\n`;
                });
                ui.chat.processMessage(msg);
            }
        }
    }
}
