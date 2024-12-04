import {OxControl} from "./OxControl.js";

const template = /*html*/`
    <iframe>

    </iframe>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: block;
        background: rgba(160,160,150,0.2);
        border: 1px solid black;
    }

    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
`;

export class OxEditor extends OxControl {

    static observedAttributes = ["src", "srcdoc"];

    constructor() {
        super();

        this.createShadowRoot(template, style, {delegatesFocus: true});

        /**
         * @type {HTMLIFrameElement}
         */
        const iframe = this.shadowRoot.firstElementChild;
        iframe.addEventListener("load", (event) => {
            iframe.contentDocument.designMode = "on";
        });

    }

    connectedCallback() {
        console.log("Custom element added to page.");
    }

    disconnectedCallback() {
        console.log("Custom element removed from page.");
    }

    adoptedCallback() {
        console.log("Custom element moved to new page.");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const iframe = this.shadowRoot.firstElementChild;
        if (name == "src") {
            iframe.setAttribute("src", newValue);
        } else if (name == "srcdoc") {
            iframe.setAttribute("srcdoc", newValue);
        }
    }

    /**
     * @return {HTMLIFrameElement}
     */
    getIframe() {
        return this.shadowRoot.firstElementChild;;
    }

    /**
     * 
     * @param {Range} range 
     * @param {Node} node 
     */
    surroundRangeWithNode(range, node) {

        const fr = range.extractContents(); 
                
        const newNode = node.cloneNode();
        newNode.appendChild(fr); 
        range.insertNode(newNode);

        return newNode;
    }

        /**
     * 
     * @param {Function} fn 
     */
    forEverySelectionRange(fn) {

        const selection = this.getIframe().contentWindow.getSelection();
        if (selection != null) {

            for (let i = 0; i < selection.rangeCount; i++) {
                const range = selection.getRangeAt(i);

                fn(range);
            }

        }
    }

    focus() {
        this.getIframe().focus({focusVisible: true});
    }

    get contentDocument() {
        return this.getIframe().contentDocument;
    }

    get contentWindow() {
        return this.getIframe().contentWindow;
    }

}

window.customElements.define("ox-editor", OxEditor);


export class NodeHelper {

    static START = 1;
    static MIDDLE = 2;
    static END = 3;


    static isTextNode(node) { Node
        return node.nodeType == Node.TEXT_NODE || node.nodeType == Node.COMMENT_NODE || node.nodeType == Node.CDATA_SECTION_NODE;
    }


    static containingElement(node) {
        if (this.isTextNode(node)) {
            return node.parentElement;
        } else {
            return node;
        }
    }

    static nodeOffsetPosition(node, offset) {
        if (offset == 0) { // start
            return NodeHelper.START;
        } else {
            if (NodeHelper.isTextNode(node)) {
                if (offset == node.nodeValue.length) { // end
                    return NodeHelper.END;
                } else { // middle
                    return NodeHelper.MIDDLE;
                }
            } else {
                if (offset == node.childNodes.length) { // end
                    return NodeHelper.END;
                } else { // middle
                    return NodeHelper.MIDDLE;
                }
            }
        }
    }

    /**
     * 
     * @param {Node} node 
     * @returns 
     */
    static isLastChild(node) {
        node = node.nextSibling;
        while (node != null) {
            if (node.childNodes.length > 0) {
                return false;
            }
            node = node.nextSibling;
        }
        return true;
        // let parent = node.parentElement;
        // if (parent == null) return false;
        // return node == parent.lastChild;
    }

        /**
     * 
     * @param {Node} node 
     * @returns 
     */
    static isFirstChild(node) {
        node = node.previousSibling;
        while (node != null) {
            if (node.childNodes.length > 0) {
                return false;
            }
            node = node.previousSibling;
        }
        return true;
        // let parent = node.parentElement;
        // if (parent == null) return false;
        // return node == parent.firstChild;
    }


}