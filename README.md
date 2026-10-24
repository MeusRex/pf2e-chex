cHex is a Foundry VTT (v14+) module that adds a persistent hex map to scenes: terrain, travel difficulty, realms,
improvements, resources and settlements, plus a system-agnostic kingdom economy. It complements kingdom rules like
PF2e Kingmaker without reading or writing system data.

## Map
- **cHex Overlay** (token controls): colors hexes by realm, terrain or travel and shows details of the hovered hex.
- **Map View** (token controls): choose the coloring, show settlements, and show improvements, resources or production per hex.
- **Paint** (GM): paint terrain and realms by click, drag or area fill, and place improvements and resource deposits with single clicks.
- **Hex editor** (GM, double-click a hex): terrain, travel, claim, exploration, settlement, improvements, deposits, forageables and features.

## Economy
- Raw resources come from improvements on claimed hexes (mines, farms, fisheries…). Without a deposit, a resource of the right
  category is rolled by spawn weight.
- Settlements have a size, needs and buildings that cost, consume and produce resources. Happiness is the share of needs met.
- The **kingdom view** shows the stockpile with a preview of the next turn, settlements, work sites, drains like armies, and trades.
- **Trade** between realms, once or every turn. One realm can be the player kingdom, which players manage themselves.
- **End Turn** applies production, upkeep, needs, drains and trade agreements and posts a report.

## Configuration
Everything is configurable in one window (cHex controls → gear, or the module settings): realms, terrains, travel, features,
resources, improvements, buildings and settlement sizes, with import/export.

Details: [docs/economy-plan.md](docs/economy-plan.md)
