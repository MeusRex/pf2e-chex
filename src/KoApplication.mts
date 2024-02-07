export default class KoApplication extends Application {
    override activateListeners(html: any) {
        super.activateListeners(html);
        window.ko.applyBindings(this, this._element[0]);
        this.register && this.register();
    }

    override close(options: any) {
        window.ko.cleanNode(this._element[0]);
        super.close(options);
        this.unregister && this.unregister();
    }

    localize(key: string): string {
        if (this.mlKey)
            key = this.mlKey + key;
        return game.i18n.localize(key);
    }

    refreshPosition() {
        this.setPosition({height: "auto"});
    }

    register: Function | null = null;
    unregister: Function | null = null; 
    mlKey: string | null = null;
}