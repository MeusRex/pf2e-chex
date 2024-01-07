export const MODULE_ID = "pf2e-chex";
export const CHEX_DATA_KEY = "chex-data";
export const HIGHLIGHT_LAYER = "KingmakerRegion";
export const MODE_KINGDOM = "kingdom";
export const MODE_LAND = "land";

export const REALMS = Object.freeze({
    helas: {
        id: "helas",
        label: "Council of Helas",
        color: "#ff0000",
    },
    eldoria: {
        id: "eldoria",
        label: "Eldoria",
        color: "#8bcc28"
    },
    aurum: {
        id: "aurum",
        label: "Dern Aurum",
        color: "#ccb728"
    },
    horselords: {
        id: "horselords",
        label: "The Horselords",
        color: "#5a28cc"
    },
    byzantium: {
        id: "byzantium",
        label: "Dern Byzantium",
        color: "#cc28bd"
    },
    aelorian: {
        id: "aelorian",
        label: "The Aelorian Accords",
        color: "#000000"
    },
    southmark: {
        id: "southmark",
        label: "Southmark",
        color: "#28accc"
    },
    northridge: {
        id: "northridge",
        label: "Northridge",
        color: "#285acc"
    },
    emirya: {
        id: "emirya",
        label: "Emirya",
        color: "#19a207"
    },
    ventoria: {
        id: "ventoria",
        label: "Ventoria",
        color: "#9f9d9d"
    },
    argentum: {
        id: "argentum",
        label: "Dern Argentum",
        color: "#d1cbc1"
    },
    arcadia: {
        id: "arcadia",
        label: "Arcadian Empire",
        color: "#cc4134"
    }
});

export const EXPLORATION_STATES = Object.freeze({
    NONE: {value: 0, label: "REALMS.EXPLORATION_STATES.NONE"},
    RECON: {value: 1, label: "REALMS.EXPLORATION_STATES.RECON"},
    MAP: {value: 2, label: "REALMS.EXPLORATION_STATES.MAP"}
  });

export const TERRAIN = Object.freeze({
    plains: {
        id: "plains",
        label: "REALMS.TERRAIN.PLAINS",
        img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/terrain/plains.webp",
        toolLabel: "CHEX.TOOLS.PLAINS",
        toolIcon: "fa-solid fa-road",
        travel: "open",
        color: "#66ff00"
    },
    forest: {
        id: "forest",
        label: "REALMS.TERRAIN.FOREST",
        img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/terrain/forest.webp",
        toolLabel: "CHEX.TOOLS.FOREST",
        toolIcon: "fa-solid fa-tree",
        travel: "greater",
        color: "#008000"
    },
    hills: {
        id: "hills",
        label: "REALMS.TERRAIN.HILLS",
        img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/terrain/hills.webp",
        toolLabel: "CHEX.TOOLS.HILLS",
        toolIcon: "fa-solid fa-cloud",
        travel: "difficult",
        color: "#8b4513"
    },
    mountains: {
        id: "mountains",
        label: "REALMS.TERRAIN.MOUNTAINS",
        img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/terrain/mountains.webp",
        toolLabel: "CHEX.TOOLS.MOUNTAINS",
        toolIcon: "fa-solid fa-mountain",
        travel: "greater",
        color: "#696969"
    },
    wetlands: {
        id: "wetlands",
        label: "REALMS.TERRAIN.WETLANDS",
        img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/terrain/wetlands.webp",
        toolLabel: "CHEX.TOOLS.WETLANDS",
        toolIcon: "fa-solid fa-bath",
        travel: "difficult",
        color: "#ee82ee"
    },
    swamp: {
        id: "swamp",
        label: "REALMS.TERRAIN.SWAMP",
        img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/terrain/swamp.webp",
        toolLabel: "CHEX.TOOLS.SWAMP",
        toolIcon: "fa-solid fa-bug",
        travel: "greater",
        color: "#663399"
    },
    lake: {
        id: "lake",
        label: "REALMS.TERRAIN.LAKE",
        img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/terrain/lake.webp",
        toolLabel: "CHEX.TOOLS.LAKE",
        toolIcon: "fa-solid fa-tint",
        travel: "water",
        color: "#0000ff"
    },
    desert: {
        id: "desert",
        label: "REALMS.TERRAIN.DESERT",
        img: "",
        toolLabel: "CHEX.TOOLS.DESERT",
        toolIcon: "fa-solid fa-sun",
        travel: "open",
        color: "##ffff00"
    }
});

export const TRAVEL = Object.freeze({
    open: {
      id: "open",
      label: "REALMS.TRAVEL.OPEN",
      multiplier: 1
    },
    difficult: {
      id: "difficult",
      label: "REALMS.TRAVEL.DIFFICULT",
      multiplier: 2
    },
    greater: {
      id: "greater",
      label: "REALMS.TRAVEL.GREATER",
      multiplier: 3
    },
    water: {
      id: "water",
      label: "REALMS.TRAVEL.WATER",
      multiplier: 1
    },
    impassable: {
      id: "impassable",
      label: "REALMS.TRAVEL.IMPASSABLE",
      multiplier: Infinity
    }
});

export const DISCOVERY_TRAITS = Object.freeze({
    landmark: {
      id: "landmark",
      label: "REALMS.DISCOVERY_TRAITS.LANDMARK"
    },
    standard: {
      id: "standard",
      label: "REALMS.DISCOVERY_TRAITS.STANDARD"
    },
    secret: {
      id: "secret",
      label: "REALMS.DISCOVERY_TRAITS.SECRET"
    }
  });

  export const FEATURES = Object.freeze({
    landmark: {
      id: "landmark",
      label: "REALMS.FEATURES.LANDMARK",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/landmark.webp"
    },
    refuge: {
      id: "refuge",
      label: "REALMS.FEATURES.REFUGE",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/refuge.webp"
    },
    ruin: {
      id: "ruin",
      label: "REALMS.FEATURES.RUIN",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/ruins.webp"
    },
    structure: {
      id: "structure",
      label: "REALMS.FEATURES.STRUCTURE",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/structure.webp"
    },
    farmland: {
      id: "farmland",
      label: "REALMS.FEATURES.FARMLAND",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/farmland.webp"
    },
    road: {
      id: "road",
      label: "REALMS.FEATURES.ROAD",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/road.webp"
    },
    bridge: {
      id: "bridge",
      label: "REALMS.FEATURES.BRIDGE",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/bridge.webp"
    },
    ford: {
      id: "ford",
      label: "REALMS.FEATURES.FORD",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/ford.webp"
    },
    waterfall: {
      id: "waterfall",
      label: "REALMS.FEATURES.WATERFALL",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/waterfall.webp"
    },
    hazard: {
      id: "hazard",
      label: "REALMS.FEATURES.HAZARD",
      img: "modules/pf2e-kingmaker/assets/actor-portraits/hazards/default.webp"
    },
    bloom: {
      id: "bloom",
      label: "REALMS.FEATURES.BLOOM",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/bloom.webp"
    },
    freehold: {
      id: "freehold",
      label: "REALMS.FEATURES.FREEHOLD",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/freehold.webp"
    },
    village: {
      id: "village",
      label: "REALMS.FEATURES.VILLAGE",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/village.webp"
    },
    town: {
      id: "town",
      label: "REALMS.FEATURES.TOWN",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/town.webp"
    },
    city: {
      id: "city",
      label: "REALMS.FEATURES.CITY",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/city.webp"
    },
    metropolis: {
      id: "metropolis",
      label: "REALMS.FEATURES.METROPOLIS",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/metropolis.webp"
    }
  });

  export const COMMODITIES = Object.freeze({
    food: {
      id: "food",
      label: "REALMS.COMMODITIES.FOOD",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/food.webp"
    },
    ore: {
      id: "ore",
      label: "REALMS.COMMODITIES.ORE",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/ore.webp"
    },
    lumber: {
      id: "lumber",
      label: "REALMS.COMMODITIES.LUMBER",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/wood.webp"
    },
    luxuries: {
      id: "luxuries",
      label: "REALMS.COMMODITIES.LUXURIES",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/luxury.webp"
    },
    stone: {
      id: "stone",
      label: "REALMS.COMMODITIES.STONE",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/stone.webp"
    }
  });

  export const CAMPS = Object.freeze({
    quarry: {
      id: "quarry",
      label: "REALMS.CAMPS.QUARRY",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/quarry.webp"
    },
    mine: {
      id: "mine",
      label: "REALMS.CAMPS.MINE",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/mine.webp"
    },
    lumber: {
      id: "lumber",
      label: "REALMS.CAMPS.LUMBER",
      img: "modules/pf2e-kingmaker/assets/maps-regions/stolen-lands/features/lumber.webp"
    }
  });