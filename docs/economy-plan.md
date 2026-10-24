# cHex Economy – Implementation Plan

System-agnostic resource and settlement management for cHex. cHex never reads or writes
game-system data; it complements whatever kingdom rules the table uses (e.g. PF2e Kingmaker).

## Concepts

| Concept | Description |
|---|---|
| **Resource** | `kind`: `raw` or `goods`. Raw resources have a `category` (`underground`, `surface`, `water`) and a `spawnWeight`. Optional `group` (e.g. `food`, `luxury`) lets needs be satisfied by any member. `tradeValue` is used by the trade screen. |
| **Improvement** | Hex improvement. `extracts` a category (Mine → underground, Farm → surface, Fishery → water), meaning all raw resources of it, or an explicit `allowed` list (may span categories). Produces `yield` per turn. `travel` shifts travel difficulty (Road: −1). |
| **Extraction** | When an extracting improvement is placed, a matching deposit on the hex is used; otherwise a resource of the category is rolled using the spawn weights. The result is stored on the hex improvement (`resource`) so it stays stable; the GM may change it. Output = `yield × deposit amount` (deposit amount defaults to 1). |
| **Building** | Built in a settlement. `cost` (paid once), `upkeep` and `production` per turn, `lots`, `minSize`, `maxCount`. A building whose upkeep cannot be paid is idle that turn. |
| **Settlement size** | `rank`, `lots`, `needs` per turn. Needs may reference a resource or a group (`group:food`). |
| **Realm state** | Per realm: stockpile, settlements (located on a hex), drains (armies etc., optionally linked to any actor), turn log. Storage is unlimited. |
| **Happiness** | Per settlement: % of needed units delivered last turn. Kingdom happiness: all delivered / all needed. |

## Turn order (End Turn)

1. Hex production of claimed hexes (all cHex scenes) is added.
2. Building upkeep is paid (all-or-nothing per building); production of active buildings is added afterwards.
3. Settlement needs: specific resources first, then groups. Shortages are shared proportionally → happiness.
4. Drains are paid all-or-nothing in order; unpaid drains are flagged.
5. Chat report; state saved. The same simulation without saving drives the "next turn" preview.

## Data storage & authority

- Definitions: world settings (`Resource`, `Improvement`, `Building`, `SettlementSize`). Old settings are migrated on load.
- Realm state: world setting `RealmState`. All mutations go through the GM query `pf2e-chex.realm`
  (`CONFIG.queries`), which validates permissions (GM, or players for the player kingdom) and applies the change atomically.
- Player kingdom: world setting `PlayerRealm`, chosen in the Customizer → Realms. Players manage that realm; the GM manages all.

## Phases

1. ✅ **Foundation** – data model, defaults, migration, pure economy engine (with node tests),
   realm store + GM query, hex editor extraction, Economy Config screen.
2. ✅ **Kingdom view** – stockpile with next-turn preview, settlements, work sites, drains (actor drop).
3. ✅ **Settlement screen & map** – settlement section in hex editor, HUD info, open from map, build/demolish.
4. ✅ **End Turn** – apply simulation, chat report, turn log.
5. ✅ **Trade** – trade screen between realms, GM or player acceptance, recurring agreements.
6. ✅ **Map view** – settlement markers on the overlay (outline colored by happiness); per-user Map View panel with a settlements toggle and one of improvements / resources / production per hex.

## Usage

- **Setup (GM):** cHex controls → *Economy Configuration* (coins icon), or module settings. Choose the player kingdom in the
  cHex Customizer → Realms.
- **Kingdom view:** token controls → crown icon (players: the player kingdom), or the Kingdom button of the realm palette.
- **Settlements:** found them on a claimed hex in the hex editor (GM double-click), or create them in the kingdom view
  and place them later. Players open a settlement by double-clicking its hex with the cHex overlay enabled.
- **Brush (GM):** cHex controls → paintbrush. Pick an improvement (optionally with a fixed extracted resource) or a resource deposit with amount, then click hexes to add/update, Shift+click to remove.
- **Map View:** token controls → layers icon (with the cHex overlay enabled). Settlements on/off, plus improvements, resources or production per hex. Players only see what is marked visible to them.
- **Trade:** *Trade* button in the kingdom view. Offers appear in the partner's kingdom view. Other realms
  are answered by the GM.
- **End Turn (GM):** in the kingdom view of each realm. Posts a report whispered to the GM (and the players for the player kingdom).
- **Macros:** `chex.openKingdom(realmId)`, `chex.openSettlement(realmId, settlementId)`, `chex.openTrade(realmId, partnerId)`,
  `chex.economy` (store API).

## Tests

`node --test tests/` runs the engine and migration tests. They don't need Foundry.
