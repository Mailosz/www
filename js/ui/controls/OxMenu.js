import {OxControl} from "./OxControl.js";
import {OxPopup} from "./OxPopup.js";


const template = /*html*/`
    <div class="popup">
        <slot></slot>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    .popup {
        border: 1px solid #666;
        box-shadow: 0 0  10px rgba(127,127,127, 0.5);
        z-index: 10;
        background: #eee;
        display: flex;
        flex-direction: column;
        max-width: 300px;
    }

    ::slotted(ox-item:focus) {
        background-color: var(--light-accent-color, lightblue);
    }

    ::slotted(ox-item) {
        background-color: #ddd;
        display: flex;
        flex-direction: row;
        height: 32px;
        cursor: pointer;
    }

    ::slotted(ox-item:hover) {
        filter: brightness(1.1);
    }

    ::slotted(ox-item:active) {
        filter: brightness(0.9);
    }

`;

export class OxMenu extends OxControl {

    static observedAttributes = ["modal"];

    constructor() {
        super();
        
        this.createShadowRoot(template, style);
        


    }

    connectedCallback() {
        super.connectedCallback();


    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

    open(opts) {
        //return this.shadowRoot.firstElementChild.open(opts);
    }

    close(value) {
        this.shadowRoot.firstElementChild.close(value);
    }
}

window.customElements.define("ox-menu", OxMenu);