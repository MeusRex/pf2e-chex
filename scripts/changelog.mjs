import * as C from "./const.mjs";
import { TEMPLATES } from "./apps/economy-ui.mjs";

export const CHANGELOG_SETTING = "lastChangelog";

/**
 * The most recent changes only. Replace the entries with each release; the texts live in the language files
 * under CHEX.CHANGES.Entries.
 */
const CHANGES = {
    version: "4.0.0",
    entries: [
        {icon: C.ICONS.kingdom, key: "Economy"},
        {icon: C.ICONS.trade, key: "Trade"},
        {icon: C.ICONS.resource, key: "Resources"},
        {icon: C.ICONS.paint, key: "Paint"},
        {icon: C.ICONS.mapView, key: "MapView"},
        {icon: C.ICONS.config, key: "Config"},
        {icon: C.ICONS.overlay, key: "Hex"},
        {icon: "fa-solid fa-triangle-exclamation", key: "Foundry"}
    ]
};

/**
 * Show the changes of this version to a GM once.
 */
export async function showChangelog() {
    if (!game.user.isGM) return;
    const version = game.modules.get(C.MODULE_ID).version;
    if (CHANGES.version !== version) return;
    if (game.settings.get(C.MODULE_ID, CHANGELOG_SETTING) === version) return;

    const content = await foundry.applications.handlebars.renderTemplate(`${TEMPLATES}/changelog.hbs`, {
        entries: CHANGES.entries.map(e => ({
            icon: e.icon,
            title: `CHEX.CHANGES.Entries.${e.key}.Title`,
            text: `CHEX.CHANGES.Entries.${e.key}.Text`
        }))
    });
    await foundry.applications.api.DialogV2.prompt({
        window: {title: game.i18n.format("CHEX.CHANGES.Title", {version}), icon: C.ICONS.overlay},
        classes: ["chex-app", "chex-changelog"],
        position: {width: 520},
        content,
        ok: {label: "CHEX.CHANGES.Ok", icon: "fa-solid fa-check"},
        rejectClose: false
    });
    await game.settings.set(C.MODULE_ID, CHANGELOG_SETTING, version);
}
