import * as Store from "../economy/realm-store.mjs";
import * as UI from "./economy-ui.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Compose a trade offer from one realm to another.
 * The partner's managers (the players for the player kingdom, otherwise the GM) accept or decline it in its kingdom view.
 */
export default class TradeWindow extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.realmId = options.realmId;
        this.partner = options.partner ?? Object.keys(chex.realms).find(id => id !== this.realmId) ?? "";
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        classes: ["chex-economy", "chex-trade"],
        window: {
            icon: "fa-solid fa-scale-balanced",
            resizable: true
        },
        position: {width: 640, height: 680},
        form: {
            handler: TradeWindow.#onSubmit,
            closeOnSubmit: true
        }
    };

    static PARTS = {
        main: {template: `${UI.TEMPLATES}/trade-window.hbs`, scrollable: [".chex-scroll"]},
        footer: {template: "templates/generic/form-footer.hbs"}
    };

    static open(realmId, partner) {
        const id = `chex-trade-${realmId}`;
        const app = foundry.applications.instances.get(id) ?? new TradeWindow({id, realmId, partner});
        return app.render({force: true});
    }

    /** @override */
    get title() {
        return `${game.i18n.localize("CHEX.ECONOMY.Trade.Title")}: ${chex.realms[this.realmId]?.label ?? ""}`;
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const ours = Store.getRealmState(this.realmId).stockpile;
        // only GMs may peek into the partner's stockpile
        const theirs = game.user.isGM ? Store.getRealmState(this.partner).stockpile : null;
        const values = this.#values ?? {give: {}, receive: {}, recurring: false};

        return Object.assign(context, {
            partner: this.partner,
            partners: Object.values(chex.realms).filter(r => r.id !== this.realmId),
            recurring: values.recurring,
            showTheirs: !!theirs,
            rows: Object.values(chex.resources)
                .sort((a, b) => b.kind.localeCompare(a.kind) || a.label.localeCompare(b.label))
                .map(r => ({
                    id: r.id, label: r.label, img: r.img, value: r.tradeValue,
                    ours: ours[r.id] ?? 0, theirs: theirs?.[r.id] ?? 0,
                    give: values.give[r.id] ?? 0, receive: values.receive[r.id] ?? 0
                })),
            buttons: [{type: "submit", icon: "fa-solid fa-paper-plane", label: "CHEX.ECONOMY.Trade.Propose"}]
        });
    }

    /**
     * Form values kept across re-renders, e.g. when the partner changes.
     */
    #values;

    #readForm() {
        const data = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.form).object);
        return {partner: data.partner, give: data.give ?? {}, receive: data.receive ?? {}, recurring: !!data.recurring};
    }

    /** @override */
    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this.form.addEventListener("input", () => this.#updateTotals());
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);
        this.#updateTotals();
        this.form.querySelector("select[name=partner]")?.addEventListener("change", event => {
            this.#values = this.#readForm();
            this.partner = event.target.value;
            this.render();
        });
    }

    #updateTotals() {
        const {give, receive} = this.#readForm();
        const total = amounts => Object.entries(amounts).reduce((sum, [id, n]) => sum + (Number(n) || 0) * (Number(chex.resources[id]?.tradeValue) || 0), 0);
        const giveValue = total(give);
        const receiveValue = total(receive);
        const set = (selector, value) => {
            const el = this.element.querySelector(selector);
            if (el) el.textContent = UI.round(value);
        };
        set(".chex-total-give", giveValue);
        set(".chex-total-receive", receiveValue);
        set(".chex-total-balance", receiveValue - giveValue);
        const balance = this.element.querySelector(".chex-total-balance");
        balance?.classList.toggle("chex-good", receiveValue > giveValue);
        balance?.classList.toggle("chex-bad", receiveValue < giveValue);
    }

    /**
     * @this {TradeWindow}
     */
    static async #onSubmit() {
        const {partner, give, receive, recurring} = this.#readForm();
        await Store.request(this.realmId, "proposeTrade", {partner, give, receive, recurring});
        await TradeWindow.#notify(this.realmId, partner);
    }

    /**
     * Tell the managers of the partner realm that an offer is waiting.
     */
    static async #notify(from, to) {
        const realm = chex.realms[to];
        const whisper = Store.managers(to).map(u => u.id);
        const content = `<p><i class="fa-solid fa-scale-balanced"></i> ${game.i18n.format("CHEX.ECONOMY.Trade.Notification", {
            from: foundry.utils.escapeHTML(chex.realms[from].label),
            to: foundry.utils.escapeHTML(realm.label)
        })}</p>`;
        await ChatMessage.implementation.create({content, whisper, speaker: {alias: chex.realms[from].label}});
    }
}
