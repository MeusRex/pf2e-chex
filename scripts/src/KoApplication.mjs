export default class KoApplication extends Application {
    activateListeners(html) {
        super.activateListeners(html);
        window.ko.applyBindings(this, this._element[0]);
        this.register && this.register();
    }
    close(options) {
        window.ko.cleanNode(this._element[0]);
        super.close(options);
        this.unregister && this.unregister();
    }
    localize(key) {
        if (this.mlKey)
            key = this.mlKey + key;
        return game.i18n.localize(key);
    }
    refreshPosition() {
        this.setPosition({ height: "auto" });
    }
    register = null;
    unregister = null;
    mlKey = null;
}
