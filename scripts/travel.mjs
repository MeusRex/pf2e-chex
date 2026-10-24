/**
 * The travel type of a hex after its improvements shifted it, e.g. a road makes difficult terrain open.
 * Improvements shift along the non-special travel types sorted by multiplier. Special ones (like water) stay.
 * @param {object} data  hex data
 * @returns {string} travel id
 */
export function currentTravel(data) {
    const shift = (data.improvements ?? []).reduce((sum, i) => sum + (Number(chex.improvements[i.id]?.travel) || 0), 0);
    if (shift === 0) return data.travel;

    const sorted = Object.values(chex.travels)
        .filter(travel => !travel.special)
        .sort((a, b) => a.multiplier - b.multiplier);
    const index = sorted.findIndex(t => t.id === data.travel);
    if (index < 0) return data.travel;
    return sorted[Math.clamp(index + shift, 0, sorted.length - 1)].id;
}
