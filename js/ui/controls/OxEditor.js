import {OxControl} from "./OxControl.js";

const template = /*html*/`
    <iframe>

    </iframe>
`;

let containers = [];

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

    #mutationObserver;

    constructor() {
        super();

        this.createShadowRoot(template, style, {delegatesFocus: true});



    }

    connectedCallback() {
        super.connectedCallback();

        const iframe = this.getIframe();
        iframe.addEventListener("load", (event) => {
            iframe.contentDocument.designMode = "on";

            iframe.contentDocument.onselectionchange = (event) => {
                const sel = iframe.contentDocument.getSelection();
                if (sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    for (const container of containers) {
                        container.style.outline = "none";
                    }
                    containers = [];
                    if (!NodeHelper.isTextNode(container)) {
                        container.style.outline = "4px dotted red";
                        containers.push(container);
                    }
                }
            }

            this.#mutationObserver = new MutationObserver(this.#detectChanges.bind(this));
            this.#mutationObserver.observe(iframe.contentDocument.body, {childList: true, subtree: true, characterData: true});
        });
    }

    #detectChanges() {
        this.dispatchEvent(new Event("edit"));
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
        return this.shadowRoot.firstElementChild;
    }

    /**
     * Clones the given node and inserts the given range into it, and then replace the range with it
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
     * Delete range contents, and replace it with the given node
     * @param {Range} range 
     * @param {Node} node 
     */
    insertNode(node) {
        forEverySelectionRange( (range) => {
            range.deleteContents();
            range.insertNode(node);
        });
    }


    /**
     * Changes block element node to a given one, but keeps its contents
     * @param {HTMLElement} element 
     */
    changeBlockElement(element) {

        /**
         *  @param {Range} range 
         */
        function findRelevantBlockElement(range, editingContext) {
            const container = range.commonAncestorContainer;
            console.log(container)
            if (editingContext == container) {
                const iterator = container.ownerDocument.createNodeIterator(container, NodeFilter.SHOW_ELEMENT, (node) => NodeHelper.isBlockElement(node));
    
                const foundElement = iterator.nextNode();
                if (foundElement) {
                    return foundElement;
                }
            } 


            if (NodeHelper.isBlockElement(container)) {
                return container;
            } else {
                const iterator = container.ownerDocument.createNodeIterator(container, NodeFilter.SHOW_ELEMENT, (node) => NodeHelper.isBlockElement(node));
    
                const foundElement = iterator.nextNode();
                if (foundElement) {
                    return foundElement;
                } else {
                    const parent = container.parentElement;
                    while (parent != null) {
                        if (parent == editingContext) {
                            return null;
                        }
                        if (NodeHelper.isBlockElement(parent)) {
                            return parent;
                        } else {
                            parent = parent.parentElement;
                        }
                    }
                }
            }
        }

        const selRanges = [];
        this.forEverySelectionRange((range) => {
            const block = findRelevantBlockElement(range, this.ownerDocument.body);
            if (block) {
                selRanges.push(new StaticRange(range));

                const blockRange = block.ownerDocument.createRange();
                blockRange.selectNodeContents(block);
                const contents = blockRange.extractContents();

                blockRange.selectNode(block);
                blockRange.deleteContents();

                blockRange.insertNode(element);
                blockRange.selectNodeContents(element);
                blockRange.insertNode(contents);
            }
        });

        const doc = this.getIframe().contentDocument;
        const sel = doc.getSelection();
        sel.empty();
        selRanges.forEach((r)=>sel.addRange(RangeUtil.copy(r, doc.createRange())));

        this.focus();
    }

    /**
     * @callback rangeCallback
     * @param {Range} range
     */

    /**
     *
     * @param {rangeCallback} fn 
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

    /**
     * 
     * @param {HTMLElement} element 
     * @returns 
     */
    static isBlockElement(element) {
        if (element.nodeType !== Node.ELEMENT_NODE) return false;
        const displayValue = getComputedStyle(element).display;
        return displayValue === "block";
    }

}

class RangeUtil {
    /**
     * @param {Range} range
     * @param {*} startContainer 
     * @param {*} startOffset 
     * @param {*} endContainer 
     * @param {*} endOffset 
     * @returns {Range}
     */
    static setRange(range, startContainer, startOffset, endContainer, endOffset) {
        range.setStart(startContainer, startOffset);
        range.setEnd(endContainer ?? startContainer, endOffset ?? startOffset);
        return range;
    }

    /**
     * Copies from range A to B
     * @param {AbstractRange} a
     * @param {AbstractRange} b 
     * @returns {AbstractRange} Range B
     */
    static copy(a, b) {
        b.setStart(a.startContainer, a.startOffset);
        b.setEnd(a.endContainer, a.endOffset);
        return b;
    }
}