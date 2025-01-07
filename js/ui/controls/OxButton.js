import {OxControl} from "./OxControl.js";

const template = /*html*/`<slot></slot>`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        border: var(--border-width, 2px) solid var(--border-color, #666);
        border-radius: 4px;
        background-color: var(--button-background, #eee);
        cursor: pointer;
        padding: 0.25em 0.5em;
        display: inline flex;
        overflow: hidden;
        justify-items: center;
        justify-content: center;
        align-items: center;
        align-content: center;
        vertical-align: baseline;
    }

    ::slotted(*) {
        min-inline-size: 0;
        max-block-size: 100%;
    }

    :host([disabled]) {
        filter: saturate(0) brightness(1.5) contrast(0.7);
        cursor: inherit;
    }

    
    :host(:state(checked)) {
        border: var(--border-width, 2px) solid var(--strong-accent-color, green);
        background-color: var(--light-accent-color, #afa);
    }
    
    :host(:hover:not([disabled])) {
        filter: brightness(1.1);
    }
    
    :host(:active:not([disabled])) {
        filter: brightness(0.9);
    }
    
`;

export class OxButton extends OxControl {

    static observedAttributes = ["type", "group", "checked"];
    #type = "default";
    #group = null;
    #checked = null;
    #internals = null;

    static #groups = new Map();

    constructor() {
        super();
    
        this.createShadowRoot(template, style, {mode: "open"});

        this.#internals = this.attachInternals();
        this.tabIndex = 0;

        this.addEventListener("click", (event) => {
            if (this.#type == "toggle" || this.#type == "radio" || this.#type == "radio-toggle") {
                if (this.#type === "toggle") {
                    this.#checkedByUser(!this.checked);
                } else {
                    if (this.#type === "radio-toggle") {
                        this.#checkedByUser(!this.checked);
                    } else {
                        this.#checkedByUser(true);
                    }
                }
            }
        });

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "type") {

            if (this.type != newValue) {

                if (newValue === "default" || newValue === "button") {
                    this.#type = "default";
                } else if (newValue === "toggle" || newValue === "switch" || newValue === "checkbox") {
                    this.#type = "toggle";
                } else if (newValue === "radio") {
                    this.#type = "radio";
                } else if (newValue === "radio-toggle") {
                    this.#type = "radio-toggle";
                }

            }
        } else if (name === "group") {
            if (oldValue !== newValue) {
                this.changeGroup(newValue);
            }
        } else if (name === "checked") {
            this.#checked = true;
            this.#checkedChanged();
        }
    }

    set checked(value) {
        if (value != this.#checked) {
            this.#checked = value == true;
            
            if (this.#checked === true && this.#group) {
                const group = OxButton.#groups.get(this.#group);
                if (group) {
                    for (const other of group) {
                        if (other != this) {
                            other.checked = false;
                        }
                    }
                }
            } 

            const event = new Event("change");
            this.dispatchEvent(event);
            
            this.#checkedChanged();
        }
    }

    #checkedChanged() {
        if (this.#checked) this.#internals.states.add("checked");
        else this.#internals.states.delete("checked");
    }

    #checkedByUser(value) {
        if (value != this.#checked) {

            this.checked = value;
            
            const event = new Event("input");
            this.dispatchEvent(event);
        }
    }

    get checked() {
        return this.#checked;
    }

    changeGroup(groupName) {
        if (this.#group) {
            const group = OxButton.#groups.get(this.#group);
            if (group) {
                group.delete(this);
                if (group.size === 0) {
                    OxButton.#groups.delete(this.#group);
                }
            }
        }

        this.#group = groupName;

        if (this.#group) {
            let group = OxButton.#groups.get(this.#group);
            if (group === undefined) {
                group = new Set();
                OxButton.#groups.set(this.#group, group);
            }
            group.add(this);
        }
    }

}

window.customElements.define("ox-button", OxButton);