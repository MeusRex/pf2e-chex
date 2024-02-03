declare namespace Hooks {
    function once(event: string, callback: Function): void
    function on(event: string, callback: Function): void
}

declare namespace foundry {
    var utils: any;
}

declare class InteractionLayer {
    static layerOptions: any
}

declare class FormApplication extends Application {

}

declare class Application {
    static defaultOptions: any;
    object: any;
    element: any;
    _element: any;
    _state: any;
    options: any;

    render(force: boolean, options?: any);
    _render(force: boolean, options: any)
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

declare const game: any;
declare const chex: any;
declare const CONFIG: any;
declare const canvas: any;
declare const ClipperLib: any;
declare const HexagonalGrid: any;
declare const ui: any;

// fromUuidSync ??