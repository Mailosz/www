import {PlacementHelper} from '../../utils/PlacementHelper.js';
import { UsefulUtils } from '../../utils/UsefulUtils.js';
import { OxControl } from './OxControl.js';

const template = /*HTML*/`
    <dialog id="popup-wrapper">
        <div id="popup-container">
            <slot></slot>
        </div>
    </dialog>
`;

const style = /* CSS */`
    @keyframes open {
        0% {opacity: 0.2; transform: translateY(20px); filter: blur(10px);}
        100% {opacity: 1; transform: translateY(0);}
    }

    @keyframes close {
        0% {opacity: 1; transform: translateY(0); display:block;}
        100% {opacity: 0; transform: translateY(20px); filter: blur(20px); display:none;}
    }

    #popup-wrapper:popover-open {
        animation: open 200ms;
    }

    #popup-container {
        background-color: white;
        padding: 10px;
        border: 1px solid gray;
        box-shadow: 0 0 10px rgba(127,127,127,0.5);
    }

    .closing {
        animation: close 500ms;
    }

    [popover] {
        background: transparent;
        border: none;
        padding: 0;
    }

    .opened[popover]:not(:popover-open):not(dialog[open]) {
        animation: close linear 400ms;
    }
`;

export class OxPopup extends OxControl {

    static observedAttributes = ["modal","placement"];
    #changedInertness = false;
    constructor(opts) {
        super();

        const defaultOpts = {
            modal: false,
            placement: null
        };

        this.opts = {...defaultOpts, ...opts};

        const shadowRoot = this.attachShadow({ mode: "open"});
        shadowRoot.innerHTML = template;


        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(style);

        shadowRoot.adoptedStyleSheets.push(styleSheet);

        this.wrapper = shadowRoot.getElementById("popup-wrapper");
        this.container = shadowRoot.getElementById("popup-container");

        this.wrapper.ontoggle = (event) => {
            if (event.newState == "open") {
                if (this.opts.placement) {
                    this.wrapper.style.position = "fixed";
                    PlacementHelper.placeElement(this.wrapper, null, this.opts.placement);
                }
                // if (this.opts.modal && !document.body.inert) {
                //     document.body.inert = true;
                //     this.#changedInertness = true;
                // } else {
                //     this.#changedInertness = false;
                // }
            } else if (event.newState == "closed") {
                // if (this.#changedInertness) {
                //     document.body.inert = false;
                //     this.#changedInertness = false;
                // }
            }
        }

        this.wrapper.onclick = (event) => {
            if (event.target == this.wrapper) {
                this.close();
            }
        }
    }

    open(opts) {
        this.opts = {...this.opts, ...opts};
        this.wrapper.classList.add("opened");
        // this.wrapper.togglePopover(true);
        this.wrapper.showModal();
    }

    close() {
        // this.wrapper.togglePopover(false);       
        this.wrapper.close();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "modal") {
            this.opts.modal = newValue;
        } else if (name == "placement") {
            this.opts.placement = newValue;
        }
    }

}

customElements.define("ox-popup", OxPopup);