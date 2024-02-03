import ChexData from "./chex-data.mjs";
import { CHEX_DATA_KEY, MODULE_ID } from "./const.mjs";
import { Realm } from "./customizables/realms.mjs";
import ChexFormulaParser from "./formula-parser.mjs";

export default class RealmPalette extends FormApplication {
  static formId = "chex-realmSelector";

  static override get defaultOptions() {
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
    return  game.i18n.localize("CHEX.REALMSELECTOR.Title");
  }

  realms: Realm[] = Object.values(chex.realms);

  get activeTool(): string | null {
    return this.selectedRealm()?.label ?? null;
  }
  selectedRealm: ko.Observable<Realm | null | undefined> = window.ko.observable();

  override async _render(force: boolean, options: any) {
    chex.realmSelector = this;
    return super._render(force, options);
  }

  override async close(options: any) {
    await super.close(options);
    chex.realmSelector = null;
  }

  override activateListeners(html) {
    super.activateListeners(html);
    window.ko.applyBindings(this, html[0]);
  }

  async report() {
    let hexes: ChexData[] = Object.values(canvas.scene.getFlag(MODULE_ID, CHEX_DATA_KEY).hexes);
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
        msg += `${resource}: ${amount}\n`
      });
      ui.chat.processMessage(msg);
    }
  }
}