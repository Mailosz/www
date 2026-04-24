import { StringTokenizer, StringTokenizerLanguageService} from "../../tokenizer/StringTokenizer.js";
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
    static observedAttributes = ["tokenizer-language", "code-style", "editable", "tokenizer-delay"];
    static { this.registerCustomElement("ox-code"); }


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
                // this.#tokenizeCode();
            });

        });

        this.customAttributes["editable"].listen((newValue) => {

            this.shadowRoot.querySelector("#code-box").contentEditable = newValue? "plaintext-only" : "false";

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
                builder.tag("div").children(
                    // builder.tag("span").innerText("a"),
                    // builder.tag("span").innerText("b"),
                    builder.tag("br")
                )
            ),
            builder.tag("link").attr("rel", "stylesheet").attr("href", this.getAttribute("code-style") || ""),
        ).build());

        this.#codeBox = this.shadowRoot.querySelector("#code-box");

        this.#codeBox.addEventListener("input", (event) => { this.#handleAfterInput(event); });
        this.#codeBox.addEventListener("beforeinput", (event) => { this.#handleBeforeInput(event); });
        this.ownerDocument.addEventListener("selectionchange", (event) => { this.#handleSelectionChange(event); });
        
        //this.replaceText(this.textContent, this.#codeBox);
    }

    /**
     * 
     * @param {string} text 
     * @param {Range} range 
     */
    replaceText(text, range) {
        if (!range.collapsed) {
            this.#removeRange(range);
        }

        const startNode = range.startContainer;
        const startOffset = range.startOffset;
        let textNode;
        if (range.startContainer.nodeType == Node.TEXT_NODE) {
            const rest = range.startContainer.splitText(range.startOffset);
            textNode = range.startContainer;
        } else if (range.startContainer.nodeType == Node.ELEMENT_NODE) {
            if (range.startContainer.nodeName == "DIV") {
                if (range.startContainer.firstChild == null || range.startContainer.lastChild.nodeName != "BR") {
                    // something's not right, the div should always have at least a <br> in it
                    throw "DIV must have exactly one <br> at the end";
                } else if (range.startContainer.firstChild == range.startContainer.lastChild || range.startOffset == 0) {
                    const span = this.ownerDocument.createElement("span");
                    textNode = this.ownerDocument.createTextNode("");
                    span.appendChild(textNode);
                    range.startContainer.insertBefore(span, range.startContainer.lastChild);

                } else {
                    //TODO: untested, should never happen
                    const span = range.startContainer.childNodes[range.startOffset - 1];
                    if (span.firstChild === null) {
                        textNode = this.ownerDocument.createTextNode("");
                        span.appendChild(textNode);
                    } else {
                        textNode = span.lastChild;
                    }
                }
            } else if (range.startContainer.nodeName == "SPAN") {
                if (range.startContainer.firstChild == null || range.startOffset == 0) {
                    textNode = this.ownerDocument.createTextNode("");
                    range.startContainer.insertBefore(textNode, range.startContainer.firstChild);
                } else {
                    textNode = range.startContainer.childNodes[range.startOffset - 1];
                }
            } else if (range.startContainer.nodeName == "SPAN") {
                throw "Node should be DIV or SPAN"
            }
        }

        //append text
        textNode = this.#appendText(text, textNode);

        const endOffset = textNode.textContent.length;
        if (endOffset === 0) { // set the range to the
            range.setStart(startNode, startOffset);
            range.setEnd(textNode, endOffset);
            textNode.parentElement.normalize();

        } else {
            textNode.normalize();
            range.setStart(startNode, startOffset);
            range.setEnd(textNode, endOffset);
        }

        return range;
    }

    #removeRange(range) {
        // TODO: handle range starting and/or ending beyond the codebox

    }

    /**
     * Appends text to a specified node
     * @param {string} text 
     * @param {Text} node
     * @param {number} index
     */
    #appendText(text, node) {

        let start = 0;
        let end;
        while ((end = text.indexOf("\n", start)) !== -1) {
            if (start != end) {
                const line = text.substring(start, end);
                this.#insertSingleLineText(line, node);
            }
            node = this.#insertLineBreak(node);
            start = end + 1;
        }

        if (start < text.length) {
            this.#insertSingleLineText(text.substring(start), node);
        }
        return node;
    }

    /**
     * 
     * @param {string} text 
     * @param {Text} node
     */
    #insertSingleLineText(line, node) {
        node.textContent += line;
    }

    /**
     * 
     * @param {string} text 
     * @param {Text} node
     */
    #insertLineBreak(node) {
        if (node.nextSibling != null) { // need to split span
            const span = node.parentNode;
            const newSpan = this.ownerDocument.createElement("span");

            let current = node.nextSibling;
            while (current) {
                const next = current.nextSibling;
                newSpan.appendChild(current);
                current = next;
            }
            span.parentNode.insertBefore(newSpan, span.nextSibling);
        } else {
            if (node.parentNode.nextSibling.nodeName == "BR") {
                node.parentNode.parentNode.insertBefore(this.ownerDocument.createElement("span"), node.parentNode.nextSibling);
            }
        }

        // create new empty text node to append to
        const newNode = this.ownerDocument.createTextNode("");
        node.parentNode.nextSibling.insertBefore(newNode, node.parentNode.nextSibling.firstChild);

        //create new line and add everything up to the node to it
        const div = node.parentNode.parentNode;
        const createdLine = this.ownerDocument.createElement("div");

        let current = node.parentNode.nextSibling;
        while (current) {
            const next = current.nextSibling;
            createdLine.appendChild(current);
            current = next;
        }

        node.parentNode.parentNode.appendChild(this.ownerDocument.createElement("br"));
        div.parentElement.insertBefore(createdLine, div.nextSibling);

        return newNode;
    }

    /**
     * 
     * @param {InputEvent} event 
     */
    #handleBeforeInput(event) {
        console.log("INPUT: ", event.inputType, event);
        event.preventDefault();

        if (event.inputType == "historyUndo") {
            
        } else if (event.inputType == "historyRedo") {
            
        } else if (event.inputType == "insertParagraph" || event.inputType == "insertLineBreak") {
            this.#forSelectionRanges((range) => {
                return collapseRange(this.replaceText("\n", range), false);
            });
        } else if (event.inputType == "insertText") {
            this.#forSelectionRanges((range) => {
                return collapseRange(this.replaceText(event.data, range), false);
            });
        } else if (event.inputType == "insertFromPaste") {
            this.#forSelectionRanges((range) => {
                const data = event.data ?? event.dataTransfer.getData("text/plain");
                return collapseRange(this.replaceText(data, range), false);
            });
        } else {
            console.log("Not intercepted inputType", event.inputType, data, ranges);
        }
    }

    #handleAfterInput(event) {
        console.log("Input", event);
        clearTimeout(this.#tokenizationTimeout);
        this.textContent = this.#codeBox.textContent; // sync content to light DOM
        // this.#presentCode(); // re-present code to update line counters
        this.#tokenizationTimeout = setTimeout(() => { this.#tokenizeCode(); }, this.tokenizationDelay);

    }

    #handleSelectionChange(event) {

        console.log("Selection", this.#getRanges(this.#getSelection()).map((range) => this.#toLiveRange(range)));
    }

    /**
     * 
     * @returns {Selection}
     */
    #getSelection() {
        let selection;
        if (this.shadowRoot.getSelection) { // selection handling incosistency between chrome and firefox - check safari
            selection = this.shadowRoot.getSelection();
        } else {
            selection = this.ownerDocument.getSelection();
        }
        return selection;
    }

    /**
     * Handles inconsistencies between browsers in selection handling in shadow DOM
     * @param {Selection} selection 
     * @returns {function(number): Range}
     */
    #getSelectionRangeFunction(selection) {

        let getRange;
        if (selection.getComposedRanges) { // right way but only works in safari
            const composedRanges = selection.getComposedRanges({ shadowRoots: [this.shadowRoot] });
            getRange = (i) => composedRanges[i];
        } else {
            getRange = (i) => selection.getRangeAt(i);
        }
        return getRange;
    }

    /**
     * 
     */
    #getRanges(selection) {
        this.#getSelectionRangeFunction(selection);
        let ranges = [];
        for (let i = 0; i < selection.rangeCount; i++) {
            ranges.push(this.#getSelectionRangeFunction(selection)(i));
        }
        return ranges;
    }

    /**
     * Creates live Range from any AbstractRange
     * @param {AbstractRange} range 
     * @returns {Range}
     */
    #toLiveRange(range) {
        let realRange = this.shadowRoot.ownerDocument.createRange();
        realRange.setStart(range.startContainer, range.startOffset);
        realRange.setEnd(range.endContainer, range.endOffset);
        return realRange;
    }


    #forSelectionRanges(fn) {

        const selection = this.#getSelection();

        const ranges = this.#getRanges(selection).map((range) => this.#toLiveRange(range)).map(fn);

        selection.empty();
        ranges.filter((range) => range != null).forEach((range) => selection.addRange(range));

    }

    #tokenizeCode() {
        if (!this.tokenizerLanguage) return;
        const tokenizer = new StringTokenizer(this.tokenizerLanguage);

        
        tokenizer.resetText(this.textContent);

        // let selection = this.#getSelection();

        // let range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        this.#codeBox.innerHTML = "";
        let currentSpan = this.#codeBox.firstElementChild;
        let currentIndex = 0;
        while (!tokenizer.isFinished()) {
            let token = tokenizer.getNextToken();

            if (currentSpan != null) {
                if (currentSpan.textContent === token.text) {
                    currentSpan.className = token.state;
                    currentSpan = currentSpan.nextElementSibling;
                    currentIndex++;
                    continue;
                } else {
                    while (this.#codeBox.lastChild != currentSpan) {
                        this.#codeBox.removeChild(this.#codeBox.lastChild);
                    }
                    currentSpan = null;
                }
            } 

            const tokenSpan = this.ownerDocument.createElement("span");
            tokenSpan.textContent = token.text;
            tokenSpan.classList.add(token.state);
            this.#codeBox.appendChild(tokenSpan);
        }
        // console.log("Tokenization complete", CSS.highlights);
    }

}

/**
 * 
 * @param {Range} range 
 * @param {boolean} toEnd 
 * @returns {Range} collapsed range
 */
function collapseRange(range, toStart) {
    range.collapse(toStart);
    return range;
}