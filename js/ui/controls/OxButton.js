import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="button" part="button">
        <div id="icon" part="icon">
            <slot name="icon" id="icon-slot"></slot>
        </div>
        <slot></slot>
        <div id="label" part="label"></div>
    </div>
    <slot id="menu-slot" name="menu" part="menu" popover></slot>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: inline-flex;
        anchor-name: --button-anchor;
    }

    :host(:hover) {
        filter: brightness(1.1);
    }

    :host(:active) {
        filter: brightness(0.9);
    }

        
    #button {
        display: contents;

    }

    ::slotted(img) {
        max-width: 100%;
        max-height: 100%;
    }

    #icon img, #icon ::slotted(img) {
        object-fit: inherit;
        object-position: inherit;
        max-width: 100%;
        max-height: 100%;
    }

    #label {
        margin: auto;
        flex: 1;
    }

    :host(:state(checked)) {
        background: var(--weak-accent-color);
    }

    :host([disabled]) {
        pointer-events: none;
    }

    #menu-slot {
        display: none;
        margin: 0;
        position-anchor: --button-anchor;
        position: absolute;
        left: anchor(left);
        top: anchor(bottom);
        border: 1px solid gray;
        padding: 0;
        background-color: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        opacity: 0;
        transition: opacity 150ms ease-in-out, display 150ms allow-discrete;
    }

    #menu-slot:popover-open {
        display: flex;
        flex-direction: column;
        opacity: 1;

        @starting-style {
            opacity: 0;
        }
    }

`;

export class OxButton extends OxControl {

    static observedAttributes = ["label", "toggle", "checked", "group", "disabled", "icon"];

    #isToggle = false;
    #isChecked = false;
    #groupName = null;
    #internals = null;
    #isDisabled = false;
    static #groups = new Map();

    constructor() {
        super();
        
        this.createShadowRoot(template, style, {mode: "open", "slotAssignment": "named", delegatesFocus: false});

        this.#internals = this.attachInternals();
    }
    
    connectedCallback() {
        super.connectedCallback();
        this.tabIndex = 0;
        const button = this.shadowRoot.getElementById("button");
        const menuslot = this.shadowRoot.getElementById("menu-slot");

        this.addEventListener("click", this.#click.bind(this));
        this.addEventListener("keydown", this.#keydown);

        menuslot.addEventListener("click", (event) => { event.stopPropagation(); }, {capture: true});
        menuslot.addEventListener("pointerdown", (event) => { event.stopPropagation(); }, {capture: true});
        menuslot.addEventListener("pointerup", (event) => { event.stopPropagation(); }, {capture: true});
        menuslot.addEventListener("pointerenter", (event) => { event.stopPropagation(); }, {capture: true});
        menuslot.addEventListener("pointerleave", (event) => { event.stopPropagation(); }, {capture: true});
        menuslot.addEventListener("pointermove", (event) => { event.stopPropagation(); }, {capture: true});
        menuslot.addEventListener("pointerout", (event) => { event.stopPropagation(); }, {capture: true});
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
        } else if (name === "icon") {
            if (newValue != null) {
                const img = this.ownerDocument.createElement("img");
                img.src = newValue;
                this.append(img);

                // const iconSlot = this.shadowRoot.getElementById("icon-slot");
                // iconSlot.assign(img);
    
                const icon = this.shadowRoot.getElementById("icon");
                icon.innerHTML = "";
                icon.appendChild(img);
            }

        }
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
        
        if (value != oldValue) {
            this.#isChecked = value;

            if (value && this.#groupName) {
                const group = OxButton.#groups.get(this.#groupName);
                console.log(group)
                if (group) {
                    for (const other of group) {
                        if (other != this) {
                            other.isChecked = false;
                        }
                    }
                }
            } 

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
        if (value !== this.#isDisabled) {
            this.#isDisabled = value;

            if (value) {
                this.shadowRoot.getElementById("button").tabIndex = -1;
            } else {
                this.shadowRoot.getElementById("button").tabIndex = 0;
            }
        }
    }

    get isToggle() {
        return this.#isToggle;
    }

    set isToggle(value) {
        if (value != this.#isToggle) {
            if (value) {
                this.addEventListener("click", this.#toggleClick);
            } else {
                this.removeEventListener("click", this.#toggleClick);
            }
        }

        this.#isToggle = value;
    }

    get groupName() {
        return this.#groupName;
    }

    set groupName(value) {
        if (this.#groupName) {
            const group = OxButton.#groups.get(this.#groupName);
            if (group) {
                group.delete(this);
                if (group.size === 0) {
                    OxButton.#groups.delete(this.#groupName);
                }
            }
        }

        this.#groupName = value;

        if (this.#groupName) {
            let group = OxButton.#groups.get(this.#groupName);
            if (group === undefined) {
                group = new Set();
                OxButton.#groups.set(this.#groupName, group);
            }
            group.add(this);
        }
    }

    #toggleClick(event) {
        if (event.defaultPrevented || this.isDisabled) {
            return
        }
        const oldValue = this.#isChecked;

        this.isChecked = !this.isChecked;

        const inputEvent = new CustomEvent("input", {oldValue: oldValue, newValue: this.#isChecked});
        this.dispatchEvent(inputEvent);
    }

    /**
     * 
     * @param {Event} event 
     */
    #click(event) {
        console.log("button click");
        if (event.defaultPrevented || this.isDisabled) {
            return;
        }

        if (this.openMenu()) {
            event.preventDefault();
        }
    }

    openMenu() {
        /**
         * @type {HTMLSlotElement}
         */
        const menuSlot = this.shadowRoot.getElementById("menu-slot");

        const menuElements = menuSlot.assignedElements();
        if (menuElements.length > 0) {
            return menuSlot.togglePopover(true);
        }
        return false;
    }

        /**
     * 
     * @param {KeyboardEvent} event 
     */
    #keydown(event) {
        console.log(event.key);
        if (event.defaultPrevented || this.isDisabled) {
            return;
        }
        
        if (event.key == "Enter") {
            this.click();
        }

    }

}

window.customElements.define("ox-button", OxButton);