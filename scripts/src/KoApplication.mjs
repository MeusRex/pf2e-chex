export default class KoApplication extends FormApplication {
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
        return game.i18n.localize(key);
    }
    register = null;
    unregister = null;
}
