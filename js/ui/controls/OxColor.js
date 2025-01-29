import {OxControl} from "./OxControl.js";



const template = /*html*/`
    <div id="rgb-color-canvas">
        <div id="color-rgb-model">
        </div>
        <div id="hue-color-slider"></div>
    </div>
    <div id="color-preview">
        <div id="color-swatch"></div>
        <button>Eyedropper</button>
        <select>
            <option>RGB</option>
            <option>HSL</option>
            <option>HSV</option>
            <option>CMYK</option>
        </select>
        <select>
            <option>Rectangle</option>
            <option>Circle</option>
        </select>
        <input id="color-main-input" value="#rrggbbaa">
    </div>
    <div id="color-inputs">
        <div id="rgb-color-inputs">
            <div>
                <label><span class="color-label" style="color: darkred;">R:</span><input id="rgb-r-input" type="number" value="255"></label>
                <input type="range" id="rgb-r-range">
            </div>
            <div>
                <label><span class="color-label" style="color: green;">G:</span><input id="rgb-g-input" type="number" value="255"></label>
                <input type="range" id="rgb-g-range">
            </div>
            <div>
                <label><span class="color-label" style="color: darkblue;">B:</span><input id="rgb-b-input" type="number" value="255"></label>
                <input type="range" id="rgb-b-range">
            </div>
        </div>
        <div id="alpha-input">
            <label><span class="color-label" style="color: black;">A:</span><input id="color-alpha-input" type="number" value="255"></label>
            <input type="range" id="alpha-range">
        </div>
    </div>

`;

const style = /*css*/`

    :host {
        display: flex;
        flex-direction: column;
        justify-content: stretch;
        align-items: stretch;
        padding: 0.5em;
        gap: 0.5em;
    }

    #picker {
        display: flex;
        flex-direction: column;
        justify-content: stretch;
        align-items: stretch;
        min-width: 100px;
        min-height: 100px;
    }

    #rgb-color-canvas {
        display: flex;
        flex: 1;
    }
    #color-rgb-model {
        border: 1px solid black;
        background: linear-gradient(0deg, black, transparent), linear-gradient(90deg, red, transparent);
        flex: 20;
    }

    #hue-color-slider {
        border: 1px solid black;
        background: linear-gradient(0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
        flex-basis: 5mm;
        flex-grow: 1;
    }

    #color-inputs {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
    }

    #color-inputs>div {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
    }

    #color-inputs>div>div, div#alpha-input {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: stretch;
        gap: 0;
    }

    #color-inputs>div>div>label>input, #alpha-input>label>input {
        min-width: 0;
        font-size: 1.2em;
        width: auto;
        width: 3em;
    }

    #color-inputs>div>div>label, #alpha-input>label {
        display: flex;
        flex: 1;
        flex-basis: 50px;
        max-width: 100%;
    }

    #color-inputs>div>div>input[type=range], #alpha-input>input[type=range] {
        flex-basis: 200px;
        flex: 10;
    }



    #rgb-color-inputs {

    }

    .color-label {
        width: 1em; 
        display: inline-block; 
        align-self: center;
    }

    #alpha-input {
        display: flex;
        flex-direction: column;
    }

    #color-preview {
        display: flex;
        flex-wrap: wrap;
        justify-items: stretch;
        gap: 0.5em;
    }

    #color-swatch {
        min-width: 10mm;
        min-height: 10mm;
        background-color: blue;
        border-radius: 100%;
        border: 1px solid white;
        outline: 1px solid black;
        margin: -0.25em;
    }

    #color-main-input {
        min-width: 5em;
        flex: 1;
    }
`;

export class OxColor extends OxControl {

    static observedAttributes = ["shown"];

    constructor() {
        super();

        this.createShadowRoot(template, style,{mode: "open", slotAssignment: "named"});
    }

    connectedCallback() {
        super.connectedCallback();
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

window.customElements.define("ox-color", OxColor);