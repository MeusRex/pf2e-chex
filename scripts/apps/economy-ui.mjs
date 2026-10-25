import * as C from "../const.mjs";
import { GROUP_PREFIX } from "../economy/engine.mjs";
import { canManage } from "../economy/realm-store.mjs";
import { DEFAULT_REALM_IMAGE } from "../customizables/realms.mjs";

export const TEMPLATES = "modules/pf2e-chex/templates";
const GROUP_IMAGE = "icons/svg/item-bag.svg";

/**
 * Label of a resource id or group key.
 */
export function keyLabel(key) {
    if (key.startsWith(GROUP_PREFIX)) {
        return game.i18n.format("CHEX.ECONOMY.AnyOfGroup", {group: key.slice(GROUP_PREFIX.length)});
    }
    return chex.resources[key]?.label || key;
}

export function keyImg(key) {
    if (key.startsWith(GROUP_PREFIX)) return GROUP_IMAGE;
    return chex.resources[key]?.img || C.FALLBACK_IMAGE;
}

/**
 * Amount map as a list for templates.
 * @param {Record<string, number>} amounts
 */
export function amountList(amounts) {
    return Object.entries(amounts ?? {})
        .filter(([, amount]) => amount)
        .map(([key, amount]) => ({key, label: keyLabel(key), img: keyImg(key), amount: round(amount)}));
}

export function round(value) {
    return Math.round(value * 100) / 100;
}

/**
 * Keys selectable in amount editors: groups (optional) and resources.
 */
export function amountOptions({groups = true} = {}) {
    const resources = Object.values(chex.resources).map(r => ({key: r.id, label: r.label || r.id, img: r.img}));
    if (!groups) return resources;
    const groupKeys = [...new Set(Object.values(chex.resources).map(r => r.group).filter(g => g))].sort()
        .map(g => `${GROUP_PREFIX}${g}`);
    return [...groupKeys.map(key => ({key, label: keyLabel(key), img: GROUP_IMAGE})), ...resources];
}

/**
 * "i.j" of a hex key.
 */
export function hexLabel(hexKey) {
    const key = Number(hexKey);
    return `${Math.floor(key / 1000)}.${key % 1000}`;
}

/**
 * Realms the current user may open.
 */
export function manageableRealms() {
    return Object.values(chex.realms).filter(r => canManage(game.user, r.id));
}

/**
 * Ask the user to pick one of the realms they manage. Picks automatically if there is only one.
 * @returns {Promise<string|null>}
 */
export async function pickRealm() {
    const realms = manageableRealms();
    if (!realms.length) {
        ui.notifications.warn(game.i18n.localize("CHEX.ECONOMY.NoRealms"));
        return null;
    }
    if (realms.length === 1) return realms[0].id;

    // a click on a realm picks it right away
    const content = await foundry.applications.handlebars.renderTemplate(`${TEMPLATES}/realm-picker.hbs`, {
        realms: realms.map(r => ({id: r.id, label: r.label, color: r.color, img: realmImg(r)}))
    });
    let picked = null;
    await foundry.applications.api.DialogV2.wait({
        window: {title: "CHEX.ECONOMY.Kingdom.Pick", icon: C.ICONS.kingdom},
        classes: ["chex-app", "chex-realm-picker"],
        position: {width: 420},
        content,
        buttons: [{action: "cancel", label: "Cancel", icon: "fa-solid fa-xmark"}],
        render: (event, dialog) => {
            for (const tile of dialog.element.querySelectorAll("[data-realm]")) {
                tile.addEventListener("click", () => {
                    picked = tile.dataset.realm;
                    dialog.close();
                });
            }
        },
        rejectClose: false
    });
    return picked;
}

/**
 * The flag or heraldry of a realm.
 */
export function realmImg(realm) {
    return realm?.img || DEFAULT_REALM_IMAGE;
}

/**
 * Dialog to edit an amount map, optionally with additional fields.
 * @param {object} config
 * @param {string} config.title
 * @param {Record<string, number>} config.values   current amounts
 * @param {boolean} [config.groups]                allow groups
 * @param {string} [config.header]                 HTML shown above the amounts, e.g. extra inputs
 * @returns {Promise<{amounts: Record<string, number>, [key: string]: any}|null>}
 */
export async function editAmounts({title, values = {}, groups = true, header = ""}) {
    const content = await foundry.applications.handlebars.renderTemplate(`${TEMPLATES}/amount-dialog.hbs`, {
        header,
        options: amountOptions({groups}).map(o => ({...o, value: values[o.key] ?? 0}))
    });
    const data = await foundry.applications.api.DialogV2.input({
        window: {title, icon: "fa-solid fa-scale-balanced"},
        position: {width: 520},
        classes: ["chex-app", "chex-amount-dialog"],
        content,
        rejectClose: false
    });
    if (!data) return null;
    const result = foundry.utils.expandObject(Object.fromEntries(Object.entries(data).filter(([k]) => !k.startsWith("amounts."))));
    result.amounts = {};
    for (const [name, value] of Object.entries(data)) {
        if (!name.startsWith("amounts.")) continue;
        const amount = Number(value) || 0;
        if (amount) result.amounts[name.slice("amounts.".length)] = amount;
    }
    return result;
}

/**
 * Ask for confirmation.
 */
export function confirm(title, content) {
    return foundry.applications.api.DialogV2.confirm({
        window: {title},
        content: `<p>${content}</p>`,
        rejectClose: false
    });
}

/**
 * Re-render all open economy windows. Debounced, as several settings may change at once.
 */
export const refreshEconomyApps = foundry.utils.debounce(() => {
    for (const app of foundry.applications.instances.values()) {
        if (app.options.classes?.includes("chex-live") && app.rendered) app.render();
    }
}, 100);
