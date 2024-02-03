import { CHEX_DATA_KEY, MODULE_ID } from "./const.mjs";
import ChexFormulaParser from "./formula-parser.mjs";
export default class RealmPalette extends FormApplication {
    static formId = "chex-realmSelector";
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: RealmPalette.formId,
            classes: [chex.CSS_CLASS],
            template: "modules/pf2e-chex/templates/chex-realm-selector.html",
            width: 240,
            height: "auto",
            popOut: true,
            closeOnSubmit: true
        });
    }
    get title() {
        return game.i18n.localize("CHEX.REALMSELECTOR.Title");
    }
    realms = Object.values(chex.realms);
    get activeTool() {
        return this.selectedRealm()?.label ?? null;
    }
    selectedRealm = window.ko.observable();
    async _render(force, options) {
        chex.realmSelector = this;
        return super._render(force, options);
    }
    async close(options) {
        await super.close(options);
        chex.realmSelector = null;
    }
    activateListeners(html) {
        super.activateListeners(html);
        window.ko.applyBindings(this, html[0]);
    }
    async report() {
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
