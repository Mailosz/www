import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="list">
        <slot></slot>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        --list-light-accent-color: var(--light-accent-color, #afa);
        --list-accent-color: var(--accent-color, #3f3);
        --list-strong-accent-color: var(--strong-accent-color, green);
    }

    #list {
        border: 1px solid black;
        overflow: auto;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        position: relative;
    }



    ::slotted(*) {
        flex: 0;
        padding: 4px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        cursor: pointer;
        background: white;
    }
        ::slotted(:hover){
            background: rgba(127, 127, 127, 0.2);
        }
        ::slotted(:active) {
            background: rgba(127, 127, 127, 0.5);
        }
        ::slotted(.selected) {
        background-color: var(--list-strong-accent-color);
    }

`;

export class OxList extends OxControl {

    static observedAttributes = ["multiple"];

    constructor() {
        super();
        
        this.createShadowRoot(template, style, {mode:"open"});
        
        this.shadowRoot.firstElementChild.onclick = (event) => {

            let elem = event.target;
            if (elem != this.shadowRoot.firstElementChild) {
                while (elem != null) {
                    if (elem.parentElement == this) {
                        elem.classList.toggle("selected");
                        break;
                    }
                    elem = elem.parentElement;
                }
            }
        }

    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

}

window.customElements.define("ox-list", OxList);