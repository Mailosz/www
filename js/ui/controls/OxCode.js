import { DocBuilder } from "../../utils/DocBuilder.js";
import {OxControl} from "./OxControl.js";
import {StringTokenizer, StringTokenizerLanguageService} from "../../StringTokenizer/StringTokenizer.js";


const template = /*html*/`
<div id="code-box"></div>
<link rel="stylesheet">
<div id="line-counters-box" contenteditable="false"></div>
`;

const style = /*css*/`


    :host {
        display: flex;
        flex-direction: row-reverse;


        background: rgba(127,127,127,0.1);
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

        --selected-line-background: rgba(127,127,127,0.1);
    }
    
    #code-box {
        display: block;
        flex: 1;
        padding: 4px 0;
        overflow-x: auto;
        white-space: pre;
    }

    #code-box:focus {
        outline: none;
    }

    #code-box>div {
        min-height: 1.1em;
        padding: 0 4px;
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

        #code-box>div:hover {
            background: var(--selected-line-background);
        }

        #code-box>div:hover::before {
            background: rgba(127,127,127,0.3);
        }

    #line-counters-box {
        width: var(--line-counter-width);
        background: var(--line-counter-background);
        border-right: var(--line-counter-border);
    }
`;

export class OxCode extends OxControl {

    static observedAttributes = ["tokenizer-language", "contenteditable", "code-style"];

    tokenizerLanguage = null;

    #tokenizationTimeout = null;

    constructor() {
        super();

        this.createShadowRoot(template, style, {delegatesFocus: true, slotAssignment: "manual"});

        this.spellcheck = false;

        const codeBox = this.shadowRoot.querySelector("#code-box");

        /**
         * @param {InputEvent} event 
         */
        codeBox.onbeforeinput = (event) => {this.#handleInput(event);}

        const code = this.innerHTML;
        if (code.length > 0) {
            this.#createCodeBox(code);
        }

    }

    setCode() {
        this.#createCodeBox(newValue);
    }


    getCode() {
        return this.shadowRoot.querySelector("#code-box").innerText;
    }

    /**
     * 
     * @param {InputEvent} event 
     */
    #handleInput(event) {
        // recolorizing after a time
        const ranges = event.getTargetRanges();
        clearTimeout(this.#tokenizationTimeout);
        setTimeout(() => {
            let firstNode = null;
            for (const range of ranges) {
                let currentNode = range.startContainer;
                while (currentNode != null) {
                    if ("DIV" == currentNode.nodeName) {
                        if (firstNode == null || firstNode.compareDocumentPosition(currentNode) & Node.DOCUMENT_POSITION_PRECEDING) {
                            firstNode = currentNode;
                        }
                        break;
                    }
                    currentNode = currentNode.parentElement;
                }
            }

            if (firstNode != null) {
                this.tokenizeCode(firstNode);
            }
        }, 1000);
    }

    #isWhitespace(c) {
        return c === ' '
            || c === '\n'
            || c === '\t'
            || c === '\r'
            || c === '\f'
            || c === '\v'
            || c === '\u00a0'
            || c === '\u1680'
            || c === '\u2000'
            || c === '\u200a'
            || c === '\u2028'
            || c === '\u2029'
            || c === '\u202f'
            || c === '\u205f'
            || c === '\u3000'
            || c === '\ufeff';
    }

    /**
     * 
     * @param {String} code 
     */
    #createCodeBox(code) {

        if (typeof(code) === "undefined") {code = "";}

        const lines = code.split('\n');

        //remove first empty line
        if (lines.length > 0 && lines[0].trimStart().length == 0) {
            lines.shift();
        }

        //remove last empty line
        if (lines.length > 0 && lines[lines.length - 1].trimStart().length == 0) {
            lines.pop();
        }

        let whitespacePadding = 0;
        if (lines.length > 0) {
            const firstLine = lines[0];
            for (let i = 0; i < firstLine.length; i++) {
                let c = firstLine.charAt(i);
                if (!this.#isWhitespace(c)) {
                    whitespacePadding = i;
                    break;
                }
            }
        }

        let codeBox = this.shadowRoot.querySelector("#code-box");
        codeBox.innerHTML = "";
        for (const line of lines){    
            let linePadding = whitespacePadding;
            for (let i = 0; i < whitespacePadding; i++) {
                let c = line.charAt(i);
                if (!this.#isWhitespace(c)) {
                    linePadding = i;
                    break;
                }
            }        
            const lineElement = document.createElement("div");
            lineElement.innerHTML = line.substring(linePadding) + "\n";
            codeBox.appendChild(lineElement);
        }

        if (this.tokenizerLanguage) {
            this.tokenizeCode();
        }
    }

    /**
     * Tokenizes code using chosen language (tokenizer-language attribute)
     * @param {Node?} startingFrom Optional node from which to start tokenizing code
     */
    tokenizeCode(startingFrom) {

        //TODO: keep selection
        const codeBox = this.shadowRoot.querySelector("#code-box");

        const tokenizer = new StringTokenizer(this.tokenizerLanguage);

        let lineElement;
        if (!startingFrom) {
            lineElement = codeBox.firstElementChild;
        } else {
            lineElement = startingFrom;
            if (startingFrom.firstElementChild != null && startingFrom.firstElementChild.tokenState != null) {
                tokenizer.setState(startingFrom.firstElementChild.tokenState);
            }
        }


        // save selection positions
        const countDivOffset = (container, containerOffset) => {
            //TODO: it could fail for when container type is element, but hasn't so far in tests
            let current = container;
            let offset = containerOffset;
            while (current != null) {
                if (current.parentElement == null) {
                    return null;
                }

                if (current.parentElement.isSameNode(codeBox)) {
                    return {container: current, offset: offset};
                }

                while (current.previousSibling != null) {
                    current = current.previousSibling;
                    offset += current.textContent.length;
                }
                current = current.parentElement;
            }
        }
        
        /**
         * @type {Selection}
         */
        let selection;
        if (this.shadowRoot.getSelection) { // selection handling incosistency between chrome and firefox - check safari
            selection = this.shadowRoot.getSelection();
        } else {
            selection = document.getSelection();
        }
        const oldRanges = [];
        for (let i = 0; i < selection.rangeCount; i++) {
            let range = selection.getRangeAt(i);
            let start = countDivOffset(range.startContainer, range.startOffset);
            if (start) {
                if (range.collapsed) {
                    oldRanges.push({ start: start, end: null});
                } else {
                    let end = countDivOffset(range.endContainer, range.endOffset);
                    if (end) {
                        oldRanges.push({ start: start, end: end});
                    }
                }
            }
        }
        //

        while (lineElement != null) {
            tokenizer.resetText(lineElement.innerText);
            lineElement.innerText = "";
            
                while (!tokenizer.isFinished()) {
                let token = tokenizer.getNextToken();

                let span = document.createElement("span");
                span.innerText = token.text;
                span.tokenState = token.state;
                span.classList.add("token");
                if (token.data && token.data.class) {
                    span.classList.add(token.data.class);
                } else {
                    span.classList.add(token.state);
                }
                if (token.startData && token.startData.error) {
                    span.style.textDecoration = "1px wavy red underline";
                }

                lineElement.appendChild(span);
            }
            lineElement = lineElement.nextSibling;
        }

        // restore selection positions
        const findElementFromOffset = (containerOffset) => {
            let current = containerOffset.container;
            let offset = containerOffset.offset;
            while (current != null) {
                if (offset > current.textContent.length) {
                    offset -= current.textContent.length;
                    current = current.nextSibling;
                    continue;
                }

                if (current.firstChild != null) {
                    current = current.firstChild;
                } else {
                    return {element: current, offset: offset};
                }
            }
        }

        selection.empty();
        for (let oldRange of oldRanges) {
            const range = document.createRange();
            const start = findElementFromOffset(oldRange.start);
            range.setStart(start.element, start.offset);
            if (oldRange.end) {
                const end = findElementFromOffset(oldRange.end);
                range.setEnd(end.element, end.offset);
            } else {
                range.setEnd(start.element, start.offset);
            }
            selection.addRange(range);
        }
        //
    }

    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "tokenizer-language") {
            StringTokenizerLanguageService.getLanguageAsync(newValue).then((language) => {
                this.tokenizerLanguage = language;
                this.tokenizeCode();
            });
        } else if (name == "contenteditable") {
            this.shadowRoot.querySelector("#code-box").contentEditable = newValue;
        } else if (name == "code-style") {
            this.shadowRoot.querySelector("link").href = newValue;
        }
    }


}

window.customElements.define("ox-code", OxCode);