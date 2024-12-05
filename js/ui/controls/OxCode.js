import { DocBuilder } from "../../utils/DocBuilder.js";
import {OxControl} from "./OxControl.js";


const template = /*html*/`
<div id="code-box"></div>
<div id="line-counters-box"></div>
`;

const style = /*css*/`


    :host {
        display: flex;
        flex-direction: row-reverse;


        background: rgba(127,127,127,0.2);
        font-family: monospace;
        border: 1px solid black;
        position: relative;
        
        /*justify-content: stretch;
        align-items: stretch;
        justify-items: stretch;
        grid-template-columns: [rownum] 2em auto;*/

        counter-reset: row-num 0;
        --line-counter-width: 2em;
        --line-counter-background: rgba(127,127,127,0.2);
        --line-counter-border: 2px solid gray;

        --selected-line-background: rgba(127,127,127,0.2);
    }
    
    #code-box {
        flex: 1;
        padding: 4px;
        overflow-x: auto;
        white-space: pre;
    }

    #code-box:focus {
        outline: none;
    }

    #code-box>div {
        min-height: 1.1em;
    }

    #code-box>div:active {
        background: var(--selected-line-background);
    }

    #code-box>div::before {
        counter-increment: row-num;
        content: counter(row-num);
        width: var(--line-counter-width);
        text-align: right;
        display: block;
        
        position: absolute;
        left: 0;
    }

    #line-counters-box {
        width: var(--line-counter-width);
        background: var(--line-counter-background);
        border-right: var(--line-counter-border);
    }
`;

export class OxCode extends OxControl {

    constructor() {
        super();

        this.createShadowRoot(template, style);

        this.shadowRoot.firstElementChild.contentEditable = "true";

        const code = this.innerHTML;
        if (code.length > 0) {
            this.#createCodeBox(code);
        }

    }

    /**
     * 
     * @param {String} code 
     */
    #createCodeBox(code) {

        if (typeof(code) === "undefined") {code = "";}

        const lines = code.split('\n');

        //remove first empty line
        if (lines.length > 0 && lines[0].trim().length == 0) {
            lines.shift();
        }

        //remove last empty line
        while (lines.length > 0 && lines[lines.length - 1].trim().length == 0) {
            lines.pop();
        }

        for (const line of lines){            
            const lineCode = document.createElement("div");
            lineCode.innerText = line;
            this.shadowRoot.firstElementChild.appendChild(lineCode);
        }
    }


}

window.customElements.define("ox-code", OxCode);