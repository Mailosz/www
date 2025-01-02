import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="content" part="content">
        <slot></slot>
    </div>
    <div id="label" part="label"></div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: flex;
        justify-content: stretch;
        flex-direction: column;
        align-items: center;
        flex: 1;
    }

    :part(content) {

    }

    :part(label) {
        margin: auto;
    }

    :host(:state(checked)) {
        background: var(--light-accent-color);
    }

`;

export class OxItem extends OxControl {

    static observedAttributes = ["label", "toggle", "checked", "group", "disabled"];

    #isToggle = false;
    #isChecked = false;
    #groupName = null;
    #internals = null;
    #isDisabled = false;
    static #groups = new Map();

    constructor() {
        super();
        
        this.createShadowRoot(template, style, {mode: "open"});

        this.#internals = this.attachInternals();
    }

    get label() {
        return this.getAttribute("label");
    }

    set label(value) {
        this.setAttribute("label", value);
    }

    get isChecked() {
        return this.#isChecked;
    }

    set isChecked(value) {
        const oldValue = this.#isChecked
        this.#isChecked = value;

        if (value != oldValue) {
            if (value) {
                this.#internals.states.add("checked");
            } else {
                this.#internals.states.delete("checked");
            }

            const event = new CustomEvent("change", {oldValue: oldValue, newValue: value});
            this.dispatchEvent(event);
        }
    }

    get isDisabled() {
        return this.#isDisabled;
    }

    set isDisabled(value) {
        this.#isDisabled = value;
    }

    get isToggle() {
        return this.#isToggle;
    }

    set isToggle(value) {
        if (value != this.#isToggle) {
            if (value) {
                this.addEventListener("click", this.#click);
            } else {
                this.removeEventListener("click", this.#click);
            }
        }

        this.#isToggle = value;
    }

    get groupName() {
        return this.#groupName;
    }

    set groupName(value) {
        if (this.#groupName) {
            const group = OxItem.#groups.get(this.#groupName);
            if (group) {
                group.delete(this);
                if (group.size === 0) {
                    OxItem.#groups.delete(this.#groupName);
                }
            }
        }

        this.#groupName = value;

        if (this.#groupName) {
            let group = OxItem.#groups.get(this.#groupName);
            if (group === undefined) {
                group = new Set();
                OxItem.#groups.set(this.#groupName, group);
            }
            group.add(this);
        }
    }


    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "label") {
            this.shadowRoot.getElementById("label").innerText = newValue;
        } else if (name === "toggle") {
            this.isToggle = true;
        } else if (name === "checked") {
            this.isChecked = true;
        } else if (name === "group") {
            this.groupName = newValue;
        } else if (name === "disabled") {
            this.isDisabled = true;
        }
    }

    #click(event) {
        if (this.isDisabled) return;
        const oldValue = this.#isChecked;
        
        if (this.#groupName) {
            const group = OxItem.#groups.get(this.#groupName);
            if (group) {
                for (const other of group) {
                    if (other != this) {
                        other.isChecked = false;
                    }
                }
            }
        } 

        this.isChecked = !this.isChecked;

        const inputEvent = new CustomEvent("input", {oldValue: oldValue, newValue: this.#isChecked});
        this.dispatchEvent(inputEvent);
    }

}

window.customElements.define("ox-item", OxItem);