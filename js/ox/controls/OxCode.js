import {StringTokenizer, StringTokenizerLanguageService} from "../../tokenizer/StringTokenizer.js";
import { OxCustomElementBase } from "./OxCustomElementBase.js";
import { Builder } from "../Builder.js";


const template = /*html*/`
<div id="container">
    <div id="code-box">
        <slot></slot>
    </div>
</div>
<div id="line-counters-box" style="height: 50px;"></div>
<link rel="stylesheet">
`;
//<div id="line-counters-box" contenteditable="false"></div>

const style = /*css*/`


    :host {
        display: block;
        position: relative;

        background: rgba(127,127,127,0.1);
        font-family: monospace;
        border: 1px solid black;

        counter-reset: row-num 0;
        --line-counter-width: 2em;
        --line-counter-background: #ccc;
        --line-counter-border: 2px solid gray;

        --selected-line-background: rgba(127,127,127,0.1);

        display: block;
        overflow: hidden;
    }

    :host([compact]) #line-counters-box {
        display: none;
    }

    :host([compact]) #code-box>div::before {
        display: none;
    }

    #container {
        display: flex;
        height: 100%;
        width: 100%;
        position: relative;
        padding: 0;

        position: relative;
        overflow: auto;
    }

    #line-counters-box {
        width: var(--line-counter-width, 2em);
        background-color: var(--line-counter-background);
        border-right: var(--line-counter-border);
        position: absolute;
        padding-right: 0.25em;
        left: 0;
        top: 0;
    }
    
    #code-box {
        white-space: pre;
        display: block;
        position: relative;
        flex: 1;
        padding: 0.75em 0;
        white-space: pre;
        min-height: 1em;
        text-align: left;
    }

    #code-box:focus {
        outline: none;
    }

    #code-box>div {
        display: block;
        list-style-position: outside;
        min-height: 1.1em;
        padding: 0 1em 0 0;
        counter-increment: row-num;
    }

    #code-box>div::before {
        content: counter(row-num);
        width: var(--line-counter-width);
        text-align: right;
        display: inline-block;
        margin-right: 0.75em;
        
        position: sticky;
        left: 0;
        z-index: 2;
    }

        #code-box>div:hover {
            background: var(--selected-line-background);
        }

        #code-box>div:hover::marker {
            background: rgba(127,127,127,0.3);
        }
`;

export class OxCode extends OxCustomElementBase {
    static { this.registerCustomElement("ox-code"); }

    static observedAttributes = ["tokenizer-language", "code-style", "contenteditable", "tokenizer-delay"];

    tokenizerLanguage = null;
    tokenizationDelay = 1000;

    #tokenizationTimeout = null;

    #codeBox;

    constructor() {
        super();
        this.spellcheck = false;
        
        this.customAttributes["tokenizer-language"].listen((newValue) => {

            if (newValue == null) {
                this.tokenizerLanguage = null;
                return;
            }
            StringTokenizerLanguageService.getLanguageAsync(newValue).then((language) => {
                this.tokenizerLanguage = language;
                this.#tokenizeCode();
            });

        });

        this.customAttributes["contenteditable"].listen((newValue) => {

            this.shadowRoot.querySelector("#code-box").contentEditable = newValue === "" || newValue === "true";

        });

        this.customAttributes["tokenizer-delay"].listen((newValue) => {
            if (newValue == null) {
                this.tokenizationDelay = 1000;
                return;
            } else {
                const delay = parseInt(newValue);
                if (!isNaN(delay)) {
                    this.tokenizationDelay = delay;
                }
            }
        });

        this.customAttributes["code-style"].listen((newValue) => {
            let link = this.shadowRoot.querySelector("link");
            if (link) {
                link.href = newValue;
            }
        });

    }
    
    connectedCallback() {
        super.connectedCallback();
        
        this.attachShadow({mode: "open", delegatesFocus: false});
        this.attachShadowCss(style);

        const builder = new Builder(this.ownerDocument);

        this.shadowRoot.appendChild(builder.tag("div").children(
            builder.tag("div").id("code-box").children(
                builder.tag("slot")
            ),
            builder.tag("link").attr("rel", "stylesheet").attr("href", this.getAttribute("code-style") || ""),
        ).build());

        this.#codeBox = this.shadowRoot.querySelector("#code-box");

        this.#codeBox.addEventListener("input", (event) => { this.#handleInput(event); });
        this.#codeBox.addEventListener("beforeinput", (event) => { this.#handleBeforeInput(event); });
        this.ownerDocument.addEventListener("selectionchange", (event) => { this.#handleSelectionChange(event); });
        // this.#presentCode();
    }

    #handleBeforeInput(event) {
        console.log("Before input detected");
    }

    #handleInput(event) {
        console.log("Input detected");
        clearTimeout(this.#tokenizationTimeout);
        this.textContent = this.#codeBox.textContent; // sync content to light DOM
        // this.#presentCode(); // re-present code to update line counters
        this.#tokenizationTimeout = setTimeout(() => { this.#tokenizeCode(); }, this.tokenizationDelay);

    }

    #handleSelectionChange(event) {
        console.log("Selection change detected", this.#getSelection());
    }

    #getSelection() {
        return "getSelection" in this.shadowRoot ? this.shadowRoot.getSelection() : this.ownerDocument.getSelection();
    }

    #tokenizeCode() {
        if (!this.tokenizerLanguage) return;
        const tokenizer = new StringTokenizer(this.tokenizerLanguage);

        
        tokenizer.resetText(this.textContent);

        
        this.#codeBox.innerHTML = "";
        while (!tokenizer.isFinished()) {
            let token = tokenizer.getNextToken();

            const tokenSpan = this.ownerDocument.createElement("span");
            tokenSpan.textContent = token.text;
            tokenSpan.classList.add(token.state);
            this.#codeBox.appendChild(tokenSpan);
        }
        // console.log("Tokenization complete", CSS.highlights);
    }

}