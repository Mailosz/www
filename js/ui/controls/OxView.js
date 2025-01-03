import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="view">
        <div id="view-header">
            <div id="header-title">
                <slot name="header">View title</slot>
            </div>
            <div id="header-actions">
                <slot name="actions">Actions</slot>
            </div>
        </div>
        <div id="view-content">
            <slot>Content</slot>
        </div>
        <div id="view-footer">
            <slot name="view footer">Footer</slot>
        </div>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: flex;
        justify-content: stretch;
        flex-direction: column;
        flex: 1;
        background-color: aliceblue;
    }

    #view {
        flex: 1;
        display: flex;
        flex-direction: column;
        background:red;
        justify-content: stretch;

    }

    #view-header {
        display: flex;
        position: sticky;
        top: 0;
        background: wheat;
        justify-content: space-between;
    }

    #view-content {
        display: flex;
        background: azure;
        flex-grow: 1;
    }

    #view-footer {
        display: flex;
        position: sticky;
        bottom: 0;
        background: wheat;
    }

`;

export class OxView extends OxControl {

    static observedAttributes = [];

    constructor() {
        super();
        
        this.createShadowRoot(template, style);
        
        


    }

    connectedCallback() {
        super.connectedCallback();
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

}

window.customElements.define("ox-view", OxView);