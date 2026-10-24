import * as E from "./engine.mjs";
import { getRealmState } from "./realm-store.mjs";
import * as UI from "../apps/economy-ui.mjs";

/**
 * Post the result of an ended turn to the chat, whispered to the GMs and the realm's owners.
 * @param {string} realmId
 * @param {object} result   result of simulateTurn
 * @param {object} before   stockpile before the turn
 */
export async function postTurnReport(realmId, result, before) {
    const realm = chex.realms[realmId];
    const state = getRealmState(realmId);

    const settlements = Object.entries(result.settlements).map(([id, s]) => ({
        name: state.settlements[id]?.name ?? id,
        happiness: s.happiness,
        unmet: Object.entries(s.needs)
            .filter(([, need]) => need.received < need.required)
            .map(([key, need]) => ({label: UI.keyLabel(key), missing: UI.round(need.required - need.received)}))
    }));

    const idle = Object.entries(result.buildings).flatMap(([settlementId, buildings]) => {
        const settlement = state.settlements[settlementId];
        return Object.entries(buildings).filter(([, active]) => !active).map(([uid]) => {
            const type = settlement?.buildings.find(b => b.uid === uid)?.type;
            return {settlement: settlement?.name ?? settlementId, building: chex.buildings[type]?.label ?? type};
        });
    });

    const unpaid = Object.entries(result.drains).filter(([, paid]) => !paid).map(([id]) => state.drains[id]?.name ?? id);

    const content = await foundry.applications.handlebars.renderTemplate(`${UI.TEMPLATES}/turn-report.hbs`, {
        realm,
        turn: state.turn,
        happiness: result.happiness,
        settlements,
        idle,
        unpaid,
        produced: UI.amountList(E.addAmounts({...result.produced.hexes}, result.produced.buildings)),
        net: UI.amountList(E.netChange(before, result.stockpile))
    });

    const whisper = game.users.filter(u => u.isGM || realm.owners?.includes(u.id)).map(u => u.id);
    return ChatMessage.implementation.create({
        content,
        whisper,
        speaker: {alias: realm.label}
    });
}
