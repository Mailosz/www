import {PlacementHelper} from '../../utils/PlacementHelper.js';
import { UsefulUtils } from '../../utils/UsefulUtils.js';
import { OxControl } from './OxControl.js';

const template = /*html*/`
    <dialog id="popup-wrapper">
        <div id="popup-container">
            <div id="popup-bar">
                <div id="popup-title">
                    <slot name="title"></slot>
                </div>
                <button id="popup-close-button" onclick=""></button>
            </div>
            <div id="popup-content">
                <slot></slot>
            </div>
        </div>
    </dialog>
`;

const style = /*css*/`
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

    #popup-title {
        flex: 1;
    }

    #popup-bar {
        display: flex;
        content-justify: stretch;
    }

    #popup-container {
        position: fixed;
        background-color: white;

        border: 1px solid gray;
        box-shadow: 0 0 20px rgba(127,127,127,0.7);
    }

    #popup-content {
        padding: 10px;
    }

    [popover], dialog {
        border: none;
        padding: 0;
    }

    dialog:not([open]) {
        animation: close-dialog linear 400ms;
    }
    dialog:not([open])>#popup-container {
        animation: close linear 400ms;
    }

    #popup-close-button {
        border: 0;
        width: 2em;
        height: 2em;
        background: none;
    }
    #popup-close-button::before {
        content: '╳';
    }
    #popup-close-button:hover {
        background: rgba(127,127,127,0.5);
    }
    #popup-close-button:active {
        background: rgba(127,127,127,1);
    }

`;

export class OxPopup extends OxControl {

    static observedAttributes = ["modal","placement","dismissable", "anchor", "closable", "movable"];
    #changedInertness = false;
    constructor(opts) {
        super();

        const defaultOpts = {
            modal: false,
            placement: null,
            dismissable: false,
            closable: false,
            movable: false,
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
            if (event.target == this.wrapper) {
                if (this.opts.dismissable) {
                    this.close();
                }
            }
        }

        const closeButton = shadowRoot.getElementById("popup-close-button");
        closeButton.onclick = (event)=>{
            event.preventDefault();
            this.close();
        };

        this.#isClosableChanged();
        this.#isMovableChanged();
    }

    #isClosableChanged() {
        const closeButton = this.shadowRoot.getElementById("popup-close-button");
        if (this.opts.closable) {
            closeButton.style.display = "block";
        } else {
            closeButton.style.display = "none";
        }
    }

    #isMovableChanged() {
        const popupBar = this.shadowRoot.getElementById("popup-bar");
        if (this.opts.movable) {
            popupBar.style.cursor = "move";
            popupBar.onpointerdown = this.#startMove.bind(this);
            popupBar.onpointermove = this.#move.bind(this);
        } else {
            popupBar.onpointerdown = null;
            popupBar.onpointermove = null;
        }
    }

   /**
     * 
     * @param {PointerEvent} event 
     */
    #startMove(event) {
        const popupBar = this.shadowRoot.getElementById("popup-bar");
        popupBar.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    /**
     * 
     * @param {PointerEvent} event 
     */
    #move(event) {
        if (event.pressure >= 0.5) {
            const rect = this.container.getBoundingClientRect();
            let x = rect.x + event.movementX;
            let y = rect.y + event.movementY;
        
            this.container.style.left = x + "px";
            this.container.style.top = y + "px";
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
        } else if ( name == "closable") {
            this.opts.closable = newValue;
            this.#isClosableChanged();
        } else if (name == "movable") {
            this.opts.movable = newValue;
            this.#isMovableChanged();
        }
    }

}

customElements.define("ox-popup", OxPopup);