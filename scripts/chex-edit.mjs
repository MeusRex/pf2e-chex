import * as C from "./const.mjs";
import ChexData from "./chex-data.mjs";
import { assignExtraction } from "./economy/migration.mjs";
import * as Store from "./economy/realm-store.mjs";
import SettlementSheet from "./apps/settlement-sheet.mjs";

export default class ChexHexEdit extends FormApplication {
  static improvementsFrag = "modules/pf2e-chex/templates/frags/chex-improvements.hbs";
  static featuresFrag = "modules/pf2e-chex/templates/frags/chex-features.hbs";
  static resourcesFrag = "modules/pf2e-chex/templates/frags/chex-resources.hbs";
  static forageablesFrag = "modules/pf2e-chex/templates/frags/chex-forageables.hbs";

  static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
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
      await foundry.applications.handlebars.loadTemplates([ChexHexEdit.improvementsFrag, ChexHexEdit.featuresFrag, ChexHexEdit.resourcesFrag, ChexHexEdit.forageablesFrag]);
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
        resources: chex.resources,
        extractables: ChexHexEdit.extractables,
        ...this.#settlementContext()
      });
  }

  get hexKey() {
    return ChexData.getKey(this.object.offset);
  }

  #settlementContext() {
    const found = Store.findSettlementAt(canvas.scene.id, this.hexKey);
    const claimed = this.object.hexData.claimed;
    if (found) {
      return {settlement: {
        ...found.settlement,
        realmId: found.realmId,
        realmLabel: chex.realms[found.realmId]?.label,
        sizeLabel: chex.settlementSizes[found.settlement.size]?.label ?? found.settlement.size
      }};
    }
    return {
      canFound: !!chex.realms[claimed],
      unplaced: chex.realms[claimed] ? Object.values(Store.getRealmState(claimed).settlements).filter(s => s.hexKey === "" || s.hexKey == null) : []
    };
  }

  /**
   * Raw resources, which improvements can extract.
   */
  static get extractables() {
    return Object.values(chex.resources).filter(r => r.kind === "raw");
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
      formData.improvements = assignExtraction(formData) ?? formData.improvements;

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

async #foundSettlement() {
  const realmId = this.object.hexData.claimed;
  const sizes = Object.values(chex.settlementSizes).sort((a, b) => a.rank - b.rank);
  const options = sizes.map(s => `<option value="${s.id}">${foundry.utils.escapeHTML(s.label)}</option>`).join("");
  const data = await foundry.applications.api.DialogV2.input({
    window: {title: "CHEX.ECONOMY.Kingdom.CreateSettlement", icon: "fa-solid fa-city"},
    content: `
      <div class="form-group"><label>${game.i18n.localize("CHEX.CUSTOMIZER.Label")}</label><input type="text" name="name" required autofocus></div>
      <div class="form-group"><label>${game.i18n.localize("CHEX.ECONOMY.Settlement.Size")}</label><select name="size">${options}</select></div>`,
    rejectClose: false
  });
  if (!data) return;
  const id = await Store.request(realmId, "createSettlement", {name: data.name, size: data.size, sceneId: canvas.scene.id, hexKey: String(this.hexKey)});
  this.render();
  SettlementSheet.open(realmId, id);
}

_refreshPosition() {
  this.setPosition({height: "auto"});
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
      switch ( action ) {
        case "addImprovement": {
          const html = await foundry.applications.handlebars.renderTemplate(ChexHexEdit.improvementsFrag, {
            id: foundry.utils.randomID(),
            improvements: chex.improvements,
            extractables: ChexHexEdit.extractables
          });
          this._attach(html, control);
          break;
        }
        case "addFeature": {
          const html = await foundry.applications.handlebars.renderTemplate(ChexHexEdit.featuresFrag, {
            id: foundry.utils.randomID(),
            features: chex.features
          });
          this._attach(html, control);
          break;
        }
        case "addResource": {
          const html = await foundry.applications.handlebars.renderTemplate(ChexHexEdit.resourcesFrag, {
            id: foundry.utils.randomID(),
            amount: 1,
            resources: chex.resources
          });
          this._attach(html, control);
          break;
        }
        case "addForageable": {
          const html = await foundry.applications.handlebars.renderTemplate(ChexHexEdit.forageablesFrag, {
            id: foundry.utils.randomID(),
            amount: 1,
            forageables: chex.resources
          });
          this._attach(html, control);
          break;
        }
        case "openSettlement": {
          const found = Store.findSettlementAt(canvas.scene.id, this.hexKey);
          if (found) SettlementSheet.open(found.realmId, found.settlement.id);
          break;
        }
        case "unplaceSettlement": {
          const found = Store.findSettlementAt(canvas.scene.id, this.hexKey);
          if (!found) break;
          await Store.request(found.realmId, "updateSettlement", {settlementId: found.settlement.id, changes: {sceneId: "", hexKey: ""}});
          this.render();
          break;
        }
        case "placeSettlement": {
          const settlementId = this.element.find(".chex-unplaced-settlement").val();
          if (!settlementId) break;
          await Store.request(this.object.hexData.claimed, "updateSettlement", {settlementId, changes: {sceneId: canvas.scene.id, hexKey: String(this.hexKey)}});
          this.render();
          break;
        }
        case "foundSettlement": {
          await this.#foundSettlement();
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