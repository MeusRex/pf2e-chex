import { CHEX_DATA_KEY, MODULE_ID } from "./const.mjs";

/**
 * Dialog to check if the user is really sure about deleting the chex data linked to the scene.
 */
export default class DeleteCertain extends FormApplication {
  constructor(scene: any) {
    super();
    this.scene = scene;
  }
  static formId = "chex-deleteCertain";

  static get defaultOptions() {
    return foundry.utils.mergeObject(this.defaultOptions, {
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

  scene: { unsetFlag: (arg0: string, arg1: string) => any; };

  override async _render(force: boolean, options: { left: any; top: any; }) {
    return super._render(force, options);
  }

  override async close(options?: any) {
    await super.close(options);
  }

  override async getData(options: any) {
    return Object.assign(await super.getData(options), {});
  }

  override activateListeners(html: { on: any; }) {
    super.activateListeners(html);
    html.on("click", "[data-action]", this.#onClickAction.bind(this));
  }

  async #onClickAction(event: { preventDefault: () => void; currentTarget: any; }) {
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