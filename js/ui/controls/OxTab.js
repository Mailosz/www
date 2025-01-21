import {OxControl} from "./OxControl.js";


export class OxTab extends OxControl {

    static observedAttributes = ["shown"];

    constructor() {
        super();

        this.attachShadow({mode: "open", slotAssignment: "named"});
    }

    connectedCallback() {
        super.connectedCallback();

        const slot = this.ownerDocument.createElement("slot");
        slot.part = "slot";
        slot.style.display = "contents";
        this.shadowRoot.appendChild(slot);
        if (this.hasAttribute("shown")) {
            slot.name = this.getAttribute("shown");
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "shown") {
            this.show(newValue);
        }
    }

    show(name) {
        /**
         * @type {HTMLSlotElement}
         */
        const slot = this.shadowRoot.firstElementChild;
        if (slot) {slot.name = name;}
    }

}

window.customElements.define("ox-tab", OxTab);