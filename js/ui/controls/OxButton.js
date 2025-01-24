import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="button" part="button">
        <div id="icon" part="icon">
            <slot name="icon" id="icon-slot"></slot>
        </div>
        <slot></slot>
        <div id="label" part="label"></div>
    </div>
    <slot id="submenu-slot" name="submenu"></slot>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: inline-flex;
    }

    :host(:hover) {
        filter: brightness(1.1);
    }

    :host(:active) {
        filter: brightness(0.9);
    }

        
    #button {
        all: inherit;
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
        this.shadowRoot.getElementById("button").tabIndex = 0;

        this.addEventListener("click", this.#submenuClick);
        this.addEventListener("keydown", this.#keydown);
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
        
        if (this.#groupName) {
            const group = OxButton.#groups.get(this.#groupName);
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

    /**
     * 
     * @param {Event} event 
     */
    #submenuClick(event) {
        if (event.defaultPrevented || this.isDisabled) {
            return
        }
        if (this.openSubmenu()) {
            event.preventDefault();
        }
    }

    openSubmenu() {
        /**
         * @type {HTMLSlotElement}
         */
        const submenuSlot = this.shadowRoot.getElementById("submenu-slot");
        const submenus = submenuSlot.assignedElements();
        if (submenus.length > 0) {
            for (const submenu of submenus) {
                if (submenu.showFor) {
                    submenu.showFor(this);
                }
            }            
            return true;
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