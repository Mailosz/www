import { OxCustomElementBase } from "./OxCustomElementBase.js";
import { computed } from "../util.js";


export class OxChoose extends OxCustomElementBase {
    static observedAttributes = ["query", "multiple"];
    static { this.registerCustomElement("ox-choose"); }

    

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();

        this.attachShadow({ mode: "open", slotAssignment: "manual" });

        const slot = this.ownerDocument.createElement("slot");
        slot.part = "slot";
        this.shadowRoot.appendChild(slot);

        if (this.customAttributes.query()) {
            this.show(this.customAttributes.query());
        }

        this.customAttributes.multiple.listen(() => {
            this.show(this.customAttributes.query());
        });

        this.customAttributes.query.listen((query) => {
            this.show(query);
        });

    }

    show(queryOrIndex) {
        /**
         * @type {HTMLSlotElement}
         */
        const slot = this.shadowRoot.firstElementChild;

        const index = parseInt(queryOrIndex);
        if (!isNaN(index)) {
            slot.assign(this.children[index]);
        } else if (this.customAttributes.multiple() === undefined) {
            const element = this.querySelector(queryOrIndex);
            if (element) {
                slot.assign(element);
            } else {
                slot.assign();
            }
        } else {
            slot.assign(...this.querySelectorAll(queryOrIndex));
        }

        
    }

}