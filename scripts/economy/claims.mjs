import * as C from "../const.mjs";
import { findSettlementAt, managers, request } from "./realm-store.mjs";

/**
 * Settlements follow the claim of their hex: when another realm claims it, the settlement changes hands.
 * Unclaiming a hex leaves the settlement with its realm. Runs on the active GM only, for every way a claim
 * can change (hex editor, realm palette, flag updates).
 * @param {Scene} scene
 * @param {object} change   the update of the scene
 */
export async function followClaims(scene, change) {
    if (game.user !== game.users.activeGM) return;
    const hexes = foundry.utils.getProperty(change, `flags.${C.MODULE_ID}.${C.CHEX_DATA_KEY}.hexes`);
    if (!hexes) return;

    for (const [key, patch] of Object.entries(hexes)) {
        const claimed = patch?.claimed;
        if (!claimed || !chex.realms[claimed]) continue;
        const found = findSettlementAt(scene.id, key);
        if (!found || found.realmId === claimed) continue;

        await request(found.realmId, "transferSettlement", {settlementId: found.settlement.id, to: claimed});
        await notify(found.settlement.name, found.realmId, claimed);
    }
}

async function notify(name, from, to) {
    const recipients = new Set([...managers(from), ...managers(to)].map(u => u.id));
    const content = `<p><i class="fa-solid fa-flag"></i> ${game.i18n.format("CHEX.ECONOMY.Settlement.Transferred", {
        name: foundry.utils.escapeHTML(name),
        from: foundry.utils.escapeHTML(chex.realms[from]?.label ?? from),
        to: foundry.utils.escapeHTML(chex.realms[to].label)
    })}</p>`;
    await ChatMessage.implementation.create({content, whisper: [...recipients], speaker: {alias: chex.realms[to].label}});
}
