import {OxControl} from "./OxControl.js";

const template = /*html*/`<slot></slot>`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        border: var(--border-width) solid var(--border-color);
        border-radius: 4px;
        background-color: var(--button-background);
        cursor: pointer;
        padding: 0.25em 0.5em;
        display: inline flex;
        overflow: hidden;
        justify-items: center;
        justify-content: center;
        align-items: center;
        align-content: center;
        vertical-align: text-bottom;
    }

    ::slotted(*) {
        min-inline-size: 0;
        max-block-size: 100%;
    }

    :host([disabled]) {
        filter: saturate(0) brightness(1.5) contrast(0.7);
        cursor: inherit;
    }

    
    :host([checked]) {
        border: var(--border-width) solid var(--strong-accent-color);
        background-color: var(--light-accent-color);
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
    checked = null;

    static #groups = new Map();

    constructor() {
        super();
    
        this.createShadowRoot(template, style, {mode: "open"});

        this.tabIndex = 0;

        this.addEventListener("click", (event) => {
            if (this.#type == "toggle" || this.#type == "radio") {
                if (this.#type == "radio" && this.#group) {
                    const group = OxButton.#groups.get(this.#group);
                    if (group) {
                        for (const other of group) {
                            other.removeAttribute("checked");
                        }
                    }
                }
                this.toggleAttribute("checked");
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
                }

            }
        } else if (name === "group") {
            if (oldValue !== newValue) {
                this.changeGroup(newValue);
            }
        } else if (name === "checked") {
            const event = new Event("change");
            this.dispatchEvent(event);
            this.onchange(event);
        }
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