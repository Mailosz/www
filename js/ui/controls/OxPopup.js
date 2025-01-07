import {PlacementHelper} from '../../utils/PlacementHelper.js';
import { UsefulUtils } from '../../utils/UsefulUtils.js';
import { OxControl } from './OxControl.js';

const template = /*html*/`
    <dialog id="wrapper">
        <div id="container" part="container">
            <slot></slot>
        </div>
    </dialog>
`;

const style = /*css*/`

    [popover], dialog {
        border: none;
        padding: 0;
    }

    :host {
        display: contents;
        --transition-time: 400ms;
    }

    #wrapper {
        transition-property: overlay, display;
        transition-duration: var(--transition-time, 400ms);
        transition-behavior: allow-discrete;
    }

    :host([open]) #wrapper {

    }

    #wrapper::backdrop {
        background-color: transparent;
        transition-property: background-color;
        transition-duration: var(--transition-time, 400ms);
    }

    :host([open]) #wrapper:modal::backdrop {
        background-color: rgba(127,127,127, 0.1);
        @starting-style {
            background-color: transparent;
        }
    }

    #container {
        position: fixed;
        transition-property: opacity, transform;
        transition-duration: var(--transition-time, 400ms);
        padding: 1em;

        transform: translateY(10px);
        opacity: 0;
    }

    #wrapper[open] #container, #wrapper:popover-open #container {
        opacity: 1;
        transform: translateY(0);
        @starting-style {
            opacity: 0;
            transform: translateY(10px);
        }
    }
`;

export class OxPopup extends OxControl {

    static observedAttributes = ["modal", "placement", "dismissable", "anchor", "open"];
    #changedInertness = false;
    constructor(opts) {
        super();

        const defaultOpts = {
            modal: false,
            placement: null,
            dismissable: false,
            anchor: null
        };

        this.opts = {...defaultOpts, ...opts};

        this.createShadowRoot(template, style);

        this.#isDismissableChanged();
    }

    connectedCallback() {
        super.connectedCallback();

        const wrapper = this.shadowRoot.getElementById("wrapper");

        wrapper.onclick = (event) => {
            if (event.target == wrapper) {
                if (this.opts.dismissable) {
                    this.close();
                }
            }
        }

        wrapper.ontoggle = (event) => {
            if (event.newState) {

            } else {
                this.removeAttribute("open");
            }
        }

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "modal") {
            this.opts.modal = newValue;
        } else if (name == "placement") {
            this.opts.placement = newValue;
        } else if (name == "dismissable") {
            this.opts.dismissable = newValue;
            this.#isDismissableChanged();
        } else if (name == "anchor") {
            this.opts.anchor = newValue;
        } else if (name === "open") {
            if (oldValue !== newValue && newValue !== null) {
                this.open();
            }
        }
    }

    #isDismissableChanged() {
        const wrapper = this.shadowRoot.getElementById("wrapper");
        if (this.opts.dismissable) {
            wrapper.popover = "auto";
        } else {
            wrapper.popover = "manual";
        }
    }

    open(opts) {
        const wrapper = this.shadowRoot.getElementById("wrapper");
        const container = this.shadowRoot.getElementById("container");
        this.opts = {...this.opts, ...opts};

        if (!this.hasAttribute("open")) {
            this.setAttribute("open", "");
        }
        
        if (this.opts.modal == "true") {
            wrapper.showModal();
        } else {
            wrapper.showPopover();
        }

        if (this.opts.placement != false) {
            wrapper.style.position = "absolute";

            let anchor = null;
            if (this.opts.anchor != null) {
                if (typeof this.opts.anchor === 'string' || this.opts.anchor instanceof String) {
                    anchor = document.querySelector(this.opts.anchor);
                } else {
                    anchor = this.opts.anchor;
                }
            }

            PlacementHelper.placeElement(container, anchor, this.opts.placement, {keepInside: wrapper});

        }

    }

    close() {
        const wrapper = this.shadowRoot.getElementById("wrapper");

        wrapper.close();
        wrapper.hidePopover();
    }

}

customElements.define("ox-popup", OxPopup);