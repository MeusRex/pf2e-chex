import KoApplication from "./KoApplication.mjs";
import { CHEX_DATA_KEY, MODULE_ID } from "./const.mjs";
/**
 * Dialog to check if the user is really sure about deleting the chex data linked to the scene.
 */
export default class DeleteCertain extends KoApplication {
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
            closeOnSubmit: true,
            title: "CHEX.REMOVE.Title"
        });
    }
    scene;
    async delete() {
        await this.scene.unsetFlag(MODULE_ID, CHEX_DATA_KEY);
        location.reload();
        super.close(null);
    }
    cancel() {
        super.close(null);
    }
}
