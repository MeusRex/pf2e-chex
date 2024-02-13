declare namespace Hooks {
    function once(event: string, callback: Function): void
    function on(event: string, callback: Function): void
}

declare const foundry: {
    utils: {
        randomID(): string;
        mergeObject(a: object, b: object): object;
        expandObject(data: object): any;
    };
}

declare class InteractionLayer {
    static layerOptions: any
}

declare class FormApplication extends Application {

}

declare interface IImage {
    img?: string;
}

declare class Application {
    static defaultOptions: any;
    object: any;
    element: any;
    _element: any;
    _state: any;
    options: any;

    render(force: boolean, options?: any);
    _render(force: boolean, options: any);
    close(options: any);
    getData(options: any);
    activateListeners(html: any);
    loadTemplates(templates: string[]);
    setPosition(config: any);
    renderTemplate(template: string, config: any);
}

declare class Collection {
    set(key: number, data: any);
    get(key: number): any;
}

declare class GridOffset {
    row: number;
    col: number;
}

declare class GridHex {
    constructor(offset: GridOffset, config: any)
    offset: GridOffset;
}

declare class FilePicker extends Application {
    callback: Function;
}

declare namespace Color {
    function from(code: string): any;
}

declare const game: {
    settings: {
        set(moduleId: string, key: string, object: object);
        get(moduleId: string, key: string): object;
        register(moduleId: string, key: string, data: object)
    };
    scenes: any;
    user: {
        isGM: boolean;
    };
    i18n: {
        localize(key: string): string;
    }
};

interface Dictionary<T> {
    get(key: string): T;
    set(key: string, val: T);
    all(): T[];
}

declare const chex: {
    terrainSelector: TerrainPalette;
    CSS_CLASS: string;
    realmSelector: RealmPalette;
    customizer: Customizer;
    manager: ChexManager;
    terrains: { [key: string]: Terrain };
    realms: { [key: string]: Realm };
    features: { [key: string]: Feature};
    improvements: { [key: string]: Improvement };
    resources: { [key: string]: Resource };
    travels: { [key: string]: Travel };
    hexConfig: ChexHexEdit;
};

declare const CONFIG: any;
declare const canvas: any;
declare const ClipperLib: any;
declare const HexagonalGrid: any;
declare const ui: any;

// fromUuidSync ??