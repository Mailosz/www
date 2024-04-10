import {PlacementHelper} from '../../utils/PlacementHelper.js';
import { UsefulUtils } from '../../utils/UsefulUtils.js';
import { OxControl } from './OxControl.js';

const template = /*HTML*/`
<div>
    <dialog id="popup-wrapper">
        <div id="popup-container">
            <slot></slot>
        </div>
    </dialog>
`;

const style = /* CSS */`
    @keyframes open {
        0% {opacity: 0.2; transform: translateY(10px); filter: blur(10px);}
        100% {opacity: 1; transform: translateY(0);}
    }

    @keyframes close {
        0% {opacity: 1; transform: translateY(0); display:block;}
        100% {opacity: 0; transform: translateY(20px); filter: blur(40px); display:none;}
    }

    @keyframes close-dialog {
        0% {display:block;}
        100% {display:none;}
    }

    dialog[open]>#popup-container {
        animation: open 200ms;
    }

    #popup-container {
        position: fixed;
        background-color: white;
        padding: 10px;
        border: 1px solid gray;
        box-shadow: 0 0 10px rgba(127,127,127,0.5);
    }

    [popover], dialog {
        background: rgba(0,255,0,0.4);
        border: none;
        padding: 0;
    }

    dialog:not([open]) {
        animation: close-dialog linear 400ms;
    }
    dialog:not([open])>#popup-container {
        animation: close linear 400ms;
    }

`;

export class OxPopup extends OxControl {

    static observedAttributes = ["modal","placement","dismissable", "anchor"];
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

        const shadowRoot = this.attachShadow({ mode: "open"});
        shadowRoot.innerHTML = template;


        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(style);

        shadowRoot.adoptedStyleSheets.push(styleSheet);

        this.wrapper = shadowRoot.getElementById("popup-wrapper");
        this.container = shadowRoot.getElementById("popup-container");

        this.wrapper.onclick = (event) => {
            //TODO: niemodalny też powinien móc być dismissable
            if (event.target == this.wrapper) {
                if (this.opts.dismissable) {
                    this.close();
                }
            }
        }
    }

    open(opts) {
        this.opts = {...this.opts, ...opts};
        this.wrapper.classList.add("opened");
        
        if (this.opts.modal == "true") {
            this.wrapper.showModal();
        } else {
            this.wrapper.show();
        }

        if (this.opts.placement != false) {
            this.wrapper.style.position = "fixed";

            let anchor = null;
            if (this.opts.anchor != null) {
                if (anchor instanceof HTMLElement) {
                    anchor = this.opts.anchor;
                } else {
                    anchor = document.getElementById(this.opts.anchor);
                }
            }

            PlacementHelper.placeElement(this.container, anchor, this.opts.placement, {keepInside: this.wrapper});

        }

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
        } else if (name == "dismissable") {
            this.opts.dismissable = newValue;
        } else if (name == "anchor") {
            this.opts.anchor = newValue;
        }
    }

}

customElements.define("ox-popup", OxPopup);