import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <slot id="start" part="start" name="start"></slot>
    <slot id="content" part="content"></slot>
    <slot id="end" part="end" name="end"></slot>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: flex;
        justify-content: stretch;
        flex-direction: column;
    }

    :host([orientation=horizontal]),
    :host([orientation=horizontal]) #start {
        flex-direction: row;
    }

    #start { 
        display: flex;
        justify-content: stretch;
        flex-direction: column;
    }

    #content {
        display: flex;
        justify-content: stretch;
        flex-direction: column;
        flex: 1;
    }

    #end {
        display: flex;
        justify-content: stretch;
        flex-direction: column;
    }
`;

export class OxPanel extends OxControl {

    static observedAttributes = ["horizontal"];

    constructor() {
        super();
        
        this.createShadowRoot(template, style);
        
        


    }

    connectedCallback() {
        super.connectedCallback();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "horizontal") {
            this.setAttribute("orientation", "horizontal");
        }
    }

}

window.customElements.define("ox-panel", OxPanel);