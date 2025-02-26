import {OxControl} from "./OxControl.js";
import {DocBuilder} from "../../utils/DocBuilder.js";
import {AutoSizeIframe} from "./AutoSizeIframe.js";


const template = /*html*/`
    <div id="example">
        <ox-code id="code-box"></ox-code>
        <div id="controls">
            <button id="run-button" part="run-button" title="Run"></button>
            <div class="spacer"></div>
            <button id="orientation-button" part="orientation-button" title="Orientation"></button>
            <button id="fullscreen-button" part="fullscreen-button" title="Fullscreen"></button>
        </div>
        <div id="preview-container">
            <iframe id="preview"></iframe>
            <div id="refresh-panel">
                <slot name="refresh-label">Click to refresh</slot>
            </div>
        </div>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        background-color: aliceblue;
    }

    #example {
        display: flex;
        justify-content: stretch;
        flex-direction: column;
    }

    :host([horizontal]) #example {
        flex-direction: row;
    }

        :host([horizontal]) #example {
            flex-direction: row;
        }
        :host([horizontal]) #controls {
            flex-direction: column;
            border-top: var(--border-width) solid var(--border-color);
            border-bottom: var(--border-width) solid var(--border-color);
            border-left: none;
            border-right: none;
        }

    #code-box {
        border: var(--border-width) solid var(--border-color);
        background-color: white;
        flex: 1;
    }

    #controls {
        display: flex;
        flex-direction: row;
        justify-content: stretch;
        font-size: 16px;
        background-color: #e0e0e0;
        border-left: var(--border-width) solid var(--border-color);
        border-right: var(--border-width) solid var(--border-color);
    
        min-height: 32px;
        min-width: 32px;
    }   
        #controls>button {
            width: 40px;
            height: 32px;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            background-color: inherit;
            border: none;
        }
            #controls>button:hover {
                filter: brightness(1.1);
            }
            #controls>button:active {
                filter: brightness(0.9);
            }



        #run-button {
            background-image: url("../../../res/img/play.png");
        }

        #orientation-button {
            background-image: url("../../../res/img/settings.png");
        }

        #fullscreen-button {
            background-image: url("../../../res/img/fullscreen.png");
        }

        .fullscreen #fullscreen-button {
            background-image: url("../../../res/img/small.png");
        }

        .spacer {
            flex: 10;
        }


    #preview {
        background-color: white;
        border: none;
        flex: 1;
        width: 100%;
        min-height: 100px;
    }

    #example.fullscreen #preview, #example.fullscreen #code-box {
        height: 100%;
    }


    #example.fullscreen {
        position: fixed;
        left: 0px;
        top: 0px;
        right: 0px;
        bottom: 0px;

        z-index: 1000;
    }

    :host(:not([horizontal])) #example.fullscreen>#code-box {
        height: auto;
        flex: 1;
    } 

    #preview-container {
        position: relative;
        border: var(--border-width) solid var(--border-color);
        flex: 1 1;
    }

    #refresh-panel {
        display: none;
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background: rgba(127,127,127,0.2);

        justify-content: center;
        align-items: center;
    }

    #refresh-panel.show {
        display: flex;
    }
`;

export class OxExample extends OxControl {

    static observedAttributes = ["editable", "autorun"];

    constructor() {
        super();
        
        this.createShadowRoot(template, style);
        


    }

    connectedCallback() {
        super.connectedCallback();

        this.shadowRoot.getElementById("run-button").onclick = (event) => this.run();
        this.shadowRoot.getElementById("orientation-button").onclick = (event) => this.changeOrientation();
        this.shadowRoot.getElementById("fullscreen-button").onclick = (event) => this.changeFullscreen();

        const preview = this.shadowRoot.getElementById("preview");
        preview.onload = () => preview.height = preview.contentDocument.body.scrollHeight;

        const codeBox = this.shadowRoot.getElementById("code-box");
        codeBox.setCode(this.textContent);

        codeBox.setAttribute("tokenizer-language", import.meta.resolve("../../tokenizer/html.json"));
        codeBox.setAttribute("code-style", import.meta.resolve("../../../css/langs/html-lang.css"));

        if (this.autorun) {
            this.run();
        } else {
            const refreshPanel = this.shadowRoot.getElementById("refresh-panel");
            refreshPanel.classList.add("show");
            refreshPanel.onclick = ()=>this.run();
        }

    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name === "editable") {
            const codeBox = this.shadowRoot.getElementById("code-box");
            codeBox.setAttribute("contenteditable", newValue);
        } else if (name === "autorun") {
            this.autorun = true;
        }
    }

    run() {
        const preview = this.shadowRoot.getElementById("preview");
        const codeBox = this.shadowRoot.getElementById("code-box");

        const code = codeBox.getCode();
        preview.srcdoc = code;

        this.shadowRoot.getElementById("refresh-panel").classList.remove("show");
    }

    changeOrientation() {
        if (this.hasAttribute("horizontal")) {
            this.removeAttribute("horizontal");
        } else {
            this.setAttribute("horizontal", null);
        }
    }

    changeFullscreen() {
        const example = this.shadowRoot.getElementById("example");
        example.classList.toggle("fullscreen");
    }

}

window.customElements.define("ox-example", OxExample);