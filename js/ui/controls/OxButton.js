import {OxControl} from "./OxControl.js";

const template = /*html*/`
    <div id="button-wrapper">
        <div id="button-container" part="button">
            <div id="content-container" part="content">
                <slot>
                </slot>
            </div>
            <div id="divider" part="divider"></div>
            <div id="menu-opener" part="opener">

            </div>
        </div>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: inline-block;
    }

    #button-wrapper {
        display: block;
        width: 100%;
        height: 100%;

        cursor: pointer;
        user-select: contain;
        border: none;
    }

    #button-wrapper:hover>#button-container {
        transform: scale(1.05)
    }


    #button-wrapper:active>#button-container {
        transform: scale(0.95);
        transition: transform 10ms;
    }

    /* not split */
    #button-wrapper:not(.opener-split):hover {
        filter: brightness(1.04);
    }

    #button-wrapper:not(.opener-split):active {
        filter: brightness(0.9);
    }

    /* split */
    #button-wrapper.opener-split #content-container:hover, 
    #button-wrapper.opener-split #menu-opener:hover{
        backdrop-filter: brightness(1.04);
    }

    #button-wrapper.opener-split #content-container:active, 
    #button-wrapper.opener-split #menu-opener:active{
        filter: brightness(0.9);
    }

    #button-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-items: stretch;
        align-items: stretch;
        box-shadow: 0 0 10px rgba(127,127,127,0.5);
        background: var(--button-background, #eee);
        transition: transform 300ms;
        overflow: hidden;
        border: inherit;
    }

    #content-container {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 4px;
    }


    #button-wrapper.opener-joint #content-container {
        padding-right: 0;
    }


    .opener-split #divider {
        width: 1px;
        height 100%;
        background-color: #ddd;
    }

    #button-wrapper:not(.opener-split):not(.opener-joint) #menu-opener {
        display: none;
    }

    #menu-opener {
        user-select:none;
        display: flex;
        justify-content: center;
        align-items: center;
        min-width: 1.5em;
    }

    #menu-opener::before {
        content: '\\25BC';
    }

    .opener-split #menu-opener {
        min-width: 2.5em;
    }
`;

export class OxButton extends OxControl {

    static observedAttributes = ["opener", "toggled", "mode"];

    constructor(opts) {
        super();

        const defaultOpts = {
            split: false,
            placement: null,
            mode: "default",
        };
    
        this.opts = {...defaultOpts, ...opts};
    
        const shadowRoot = this.attachShadow({ mode: "open"});
        shadowRoot.innerHTML = template;
    
    
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(style);
    
        shadowRoot.adoptedStyleSheets.push(styleSheet);

        this.wrapper = shadowRoot.getElementById("button-wrapper");
        //this.wrapper.addEventListener("mousedown", (event) => {if (event.detail > 1) {event.preventDefault()}}, {capture: true, passive: false});
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "opener") {

            if (newValue === true || newValue === "" || newValue == "joint") {
                this.wrapper.classList.remove("opener-split");
                this.wrapper.classList.add("opener-joint");
            } else if (newValue == "split") {
                this.wrapper.classList.remove("opener-joint");
                this.wrapper.classList.add("opener-split");
            } else {
                this.wrapper.classList.remove("opener-joint");
                this.wrapper.classList.remove("opener-split");
            }

            this.opts.opener = newValue;
        } else if (name == "mode") {
            let mode;
            if (newValue == null || newValue == "default") {
                mode = "default;"
            } else if (newValue == "toggle") {
                mode = "toggle;"
            } else if (newValue == "menu") {
                mode = "menu"
            } else {
                mode = "default";
            }
            if (mode != this.opts.mode) {
                this.opts.mode = mode;

                this.#build();
            }
        }
    }

    #build() {
        
    }

}

window.customElements.define("ox-button", OxButton);