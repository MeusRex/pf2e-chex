import KoApplication from "./KoApplication.mjs";
import { CHEX_DATA_KEY, MODULE_ID } from "./const.mjs";
import ChexFormulaParser from "./formula-parser.mjs";
export default class RealmPalette extends KoApplication {
    static formId = "chex-realmSelector";
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: RealmPalette.formId,
            classes: [chex.CSS_CLASS],
            template: "modules/pf2e-chex/templates/chex-realm-selector.html",
            width: 240,
            height: "auto",
            popOut: true,
            closeOnSubmit: true,
            title: "CHEX.REALMSELECTOR.Title"
        });
    }
    constructor() {
        super();
        this.register = () => chex.realmSelector = this;
        this.unregister = () => chex.realmSelector = null;
    }
    realms = Object.values(chex.realms);
    get activeTool() {
        return this.selectedRealm()?.label ?? null;
    }
    selectedRealm = window.ko.observable();
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
