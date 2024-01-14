import { CHEX_DATA_KEY, MODULE_ID } from "./const.mjs";

/**
 * Dialog to check if the user is really sure about deleting the chex data linked to the scene.
 */
export default class DeleteCertain extends FormApplication {
  constructor(scene) {
    super();
    this.scene = scene;
  }
  static formId = "chex-deleteCertain";

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: DeleteCertain.formId,
      classes: [chex.CSS_CLASS],
      template: "modules/pf2e-chex/templates/chex-delete-certain.hbs",
      width: 240,
      height: "auto",
      popOut: true,
      closeOnSubmit: true
    });
  }

  get title() {
    return  game.i18n.localize("CHEX.REMOVE.Title");
  }

  scene;

  async _render(force, options) {
    return super._render(force, options);
  }

  async close(options) {
    await super.close(options);
  }

  async getData(options) {
    return Object.assign(await super.getData(options), {});
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on("click", "[data-action]", this.#onClickAction.bind(this));
  }

  async #onClickAction(event) {
    event.preventDefault();
    const control = event.currentTarget;
    const action = control.dataset.action;
    
    if (action === "delete") {
      await this.scene.unsetFlag(MODULE_ID, CHEX_DATA_KEY);
      location.reload();
    }

    this.close();
  }
}