import { MutationRecorder } from "../utils/MutationRecorder.js";
import { revertMutationChanges } from "../utils/MutationUndoer.js";

const selection = [];
let currentSelection = null;
let pointerPressed = false;
function clearSelection() {
    selection.length = 0;
}



/**
 * 
 * @param {MouseEvent} event 
 */
export function handlePointerDown(event) {
    
    event.currentTarget.focus();

    const element = document.elementFromPoint(event.x, event.y);

    document.querySelectorAll(".selected").forEach((e)=>e.classList.remove("selected"));
    element.classList.add("selected");

    const range = document.createRange();
    range.selectNodeContents(element);

    clearSelection();
    const clientRects = range.getClientRects();
    if (pointInsideClientRects(event.x, event.y, clientRects)) {
        const caret = document.caretPositionFromPoint(event.x, event.y);
        
        currentSelection = {anchor: caret};
    } else {
        selection.push(element);
    }
    pointerPressed = true;
    
    showSelection(selection);
    event.preventDefault();
}

function pointInsideClientRects(x, y, clientRects) {
    for (const rect of clientRects) {
        if (rect.left < x && rect.right > x && rect.top < y && rect.bottom > y) {
            return true;
        }
    }

    return false;
}

function selectionToRange(currentSelection) {
    let range;
    if (currentSelection.caret) {
        if (currentSelection.anchor.offsetNode == currentSelection.caret.offsetNode) {
            if (currentSelection.anchor.offset > currentSelection.caret.offset) {
                range = createRange(currentSelection.caret.offsetNode, currentSelection.caret.offset, currentSelection.anchor.offsetNode, currentSelection.anchor.offset);
            } else {
                range = createRange(currentSelection.anchor.offsetNode, currentSelection.anchor.offset, currentSelection.caret.offsetNode, currentSelection.caret.offset);
            }
        } else {
            const comp = currentSelection.caret.offsetNode.compareDocumentPosition(currentSelection.anchor.offsetNode);
            if (comp == Node.DOCUMENT_POSITION_FOLLOWING) {
                range = createRange(currentSelection.caret.offsetNode, currentSelection.caret.offset, currentSelection.anchor.offsetNode, currentSelection.anchor.offset);
            } else if (comp == Node.DOCUMENT_POSITION_PRECEDING) {
                range = createRange(currentSelection.anchor.offsetNode, currentSelection.anchor.offset, currentSelection.caret.offsetNode, currentSelection.caret.offset);
            } else {
                console.log("TODO");
                //TODO
            }
        }

    } else {
        range = createRange(currentSelection.anchor.offsetNode, currentSelection.anchor.offset);
    }
    return range;
}

/**
 * 
 * @param {MouseEvent} event 
 */
export function handlePointerMove(event) {
    if (pointerPressed) {
        if (currentSelection) {
            const caret = document.caretPositionFromPoint(event.x, event.y);

            currentSelection.caret = caret;

            const range = selectionToRange(currentSelection);

            showSelection([range]);
        }
    }
    event.preventDefault();
}

/**
 * 
 * @param {MouseEvent} event 
*/
export function handlePointerUp(event) {
    pointerPressed = false;
    
    if (currentSelection) {
        clearSelection();

        const range = selectionToRange(currentSelection);

        selection.push(range);
        showSelection(selection);

        currentSelection = null;
    } else {

    }
    event.preventDefault();
}



/**
 * 
 * @param {KeyboardEvent} event 
 */
export function handleKeyDown(event) {
    console.log(event.key);
    if (event.key === "ArrowLeft") {
        event.preventDefault();

        for (const item of selection) {
            const range = item;//selection.getRangeAt(i);

            if (item instanceof Range) {

                extendRangeBackward(item);
    
                item.collapse(true);
                console.log(item);
            }
        }
        showSelection(selection);
    } else if (event.key === "ArrowRight") {
        event.preventDefault();

        for (const item of selection) {
            if (item instanceof Range) {

                extendRangeForward(item);

                item.collapse(false);
                console.log(item);

            }
        }
        showSelection(selection);
    } else if (event.key == "z" && event.ctrlKey) {

        const inputEvent = new InputEvent("beforeinput", {inputType: "historyUndo"});
        event.currentTarget.dispatchEvent(inputEvent);

    }
}

/**
 * 
 * @param {*} startContainer 
 * @param {*} startOffset 
 * @param {*} endContainer 
 * @param {*} endOffset 
 * @returns {Range}
 */
function createRange(startContainer, startOffset, endContainer, endOffset) {
    const range = document.createRange();
    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer ?? startContainer, endOffset ?? startOffset);
    return range;
}

/**
 * 
 * @param {StaticRange} staticRange 
 * @returns {Range} A new range same as passed StaticRange
 */
function rangeFromStatic(staticRange) {
    const range = document.createRange();
    range.setStart(staticRange.startContainer, staticRange.startOffset);
    range.setEnd(staticRange.endContainer, staticRange.endOffset);
    return range;
}

/**
 *
 * @param {Range} range
 * @returns {StaticRange} A new range same as passed StaticRange
 */
function staticFromRange(range) {
    return new StaticRange({startContainer: range.startContainer, startOffset: range.startOffset, endContainer: range.endContainer, endOffset: range.endOffset})
}

/**
 * 
 * @param {[StaticRange]} staticRanges 
 * @param {function(Range)} foo 
 */
function editStaticRanges(staticRanges, foo) {
    const ranges = staticRanges.map((sr) => rangeFromStatic(sr));
    ranges.forEach(foo);

    setSelection(document.getSelection(), ranges);
}

/**
 * 
 * @param {Node} node 
 */
function findBlockContext(node) {
    let blockContext = node;
    if (!isElementNode(node)) {
        blockContext = node.parentElement;
    }

    while (blockContext) {
        if (isBlockElement(blockContext)) {
            return blockContext;
        }
        blockContext = blockContext.parentElement;
    }

    //no blockContext found
    return null;
}

/**
 * 
 * @param {Node} node 
 */
function isElementNode(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}

function isBlockElement(element) {
    if (element.nodeType !== Node.ELEMENT_NODE) return false;
    const displayValue = getComputedStyle(element).display;
    return displayValue === "block";
}

/**
 * 
 * @param {Node} node 
 */
function getNodeLength(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.length;
    } else {
        return node.childNodes.length;
    }
}

/**
 * Iterates on nodes between from to until (exclusively, without the specified nodes).
 * Will raise exception upon reaching the end of a tree from node is in, if until is not null, and is not found in the tree
 * @param {Node} from 
 * @param {Node} until 
 */
function* iterateBetweenNodes(from, until) {
    if (from !== until) {
        let node = from;

        while (true) {
            if (node.firstChild) {
                node = node.firstChild;
            } else if (node.nextSibling) {
                node = node.nextSibling;
            } else {
                do {
                    node = node.parentNode;
                    if (node === until) {
                        return;
                    }
                } while(!node.nextSibling);
                node = node.nextSibling;
            }
            if (node === until) {
                return;
            }
            if (node === null) {
                throw "Nodes are not in the same tree";
            }
            yield node;
        }
    }

}

let selectionRects = [];
function createSelectionRect(rect, ...classes) {
    let selem = document.createElement("div");
    selem.classList.add("selection");
    selem.classList.add(...classes);

    selem.style.left = window.scrollX + rect.left + "px";
    selem.style.top = window.scrollY + rect.top + "px";
    selem.style.width = rect.width + "px";
    selem.style.height = rect.height + "px";
    selem.style.position = "absolute";
    selem.inert = true;

    selectionRects.push(selem);

    document.body.appendChild(selem);
    return selem;
}

function showSelection(selection) {

    for (const selem of selectionRects) {
        selem.remove();
    }


    for (const item of selection) {

        if (item instanceof Range) {
            if (item.collapsed) {
                for (let rect of item.getClientRects()) {
                    createSelectionRect(rect, "caret")
                }
            } else {
                for (let rect of item.getClientRects()) {
                    createSelectionRect(rect, "range")
                }
            }
            break;
        } else {
            for (const rect of item.getClientRects()) {
                createSelectionRect(new DOMRect(rect.left, rect.top, rect.width, rect.height), "element");
            }

            break;
        }


        const rects = range.getClientRects();
        for (let rect of rects) {
            createSelectionRect(rect, "caret", range.collapsed ? "blink" : null)
        }

        if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
            if (range.startOffset === range.startContainer.childNodes.length) {
                let rect = range.startContainer.getBoundingClientRect();

                createSelectionRect(new DOMRect(rect.left, rect.top, rect.width, rect.height), "end");
                
            } else if (range.startOffset === 0) {
                let rect = range.startContainer.getBoundingClientRect();

                createSelectionRect(new DOMRect(rect.left, rect.top, rect.width, rect.height), "start");
            } else if (range.startOffset > 0) {

                let node = range.startContainer.childNodes.item(range.startOffset);

                let spacer = document.createElement("div");
                spacer.style.display = "inline";
                spacer.style.margin = "0";
                spacer.style.padding = "0";
                range.startContainer.insertBefore(spacer, node);
                
                let rects = spacer.getClientRects();
                range.startContainer.removeChild(spacer);
                for (const rect of rects) {
                    createSelectionRect(rect, "between");
                }

            }
        }
        console.log(rects);
    }
}
/**
 * 
 * @param {Range[]} ranges 
 */
function setSelection(selection, ranges) {
    selection.empty();
    ranges.forEach((range) => selection.addRange(range));
}


const observerOptions = {
    subtree: true, 
    childList: true, 
    attibutes: true, 
    attributeOldValue: true, 
    characterData: true, 
    characterDataOldValue: true,
};

/**
 * Handles user input in a predictive way
 */
export function handleInput(options) {

    console.log(options);
    const undoList = [];
    /**
     * Handles user input in a predictive way
     * @param {InputEvent} event 
     */
    return (event) => {
        event.preventDefault();
        event.stopPropagation();

        let targetRanges = [document.getSelection().getRangeAt(0)];
    
        /**
         * @type {HTMLElement}
         */
        const editor = event.target;
    
        console.log(event);
        if (event.inputType === "insertText") {

            const mr = new MutationObserver(() => {});
            mr.observe(event.target, observerOptions)

            const ranges = insertText(event.data, targetRanges);
            ranges.forEach((range) => range.collapse(false));
            setSelection(document.getSelection(), ranges);

            undoList.push(mr.takeRecords());
            mr.disconnect();

        } else if (event.inputType === "insertParagraph") {

            const ranges = insertParagraph(options.paragraph, targetRanges);
            // ranges.forEach((range) => range.collapse(true));
            setSelection(document.getSelection(), ranges);

        } else if (event.inputType === "deleteContentForward") {

            const ranges = deleteContent("forward", "character", targetRanges);
            setSelection(document.getSelection(), ranges);

        } else if (event.inputType === "deleteContentBackward") {

            // let r2 = targetRanges.pop();
            // let range = rangeFromStatic(r2);

            const ranges = deleteContent("backward", "character", targetRanges);
            setSelection(document.getSelection(), ranges);

        } else if (event.inputType === "deleteWordForward") {

            const ranges = deleteContent("forward", "word", targetRanges);
            setSelection(document.getSelection(), ranges);

        } else if (event.inputType === "deleteWordBackward") {

            const ranges = deleteContent("backward", "word", targetRanges);
            setSelection(document.getSelection(), ranges);

        } else if (event.inputType === "historyUndo") {
            console.log(undoList);
            if (undoList.length > 0) {
                const changes = undoList.pop();
                revertMutationChanges(changes);
            }

        } else if (event.inputType === "historyRedo") {


        } 

        event.target.dispatchEvent(new InputEvent("input"));
    };

}

/**
 * Copies from range A to B
 * @param {Range} a
 * @param {Range} b
 * @returns {Range} Range B
 */
function copyRange(a, b) {
    b.setStart(a.startContainer, a.startOffset);
    b.setEnd(a.endContainer, a.endOffset);
    return b;
}

/**
 * Extends range to the left in place
 * @param {*} range 
 */
function extendRangeBackward(range) {
    if (range.startOffset > 0) {
        console.log("A");
        if (isElementNode(range.startContainer)) {
            const node = range.startContainer.childNodes.item(range.startOffset - 1);
            if (isElementNode(node)) {
                range.setStart(node, node.childNodes?.length);
            } else {
                range.setStart(node, Math.max(0, node.length));
            }
        } else {
            range.setStart(range.startContainer, range.startOffset - 1);
        }
    } else if (range.startContainer.previousSibling) {

        console.log("B");
        if (range.startContainer.parentElement) {
            const index = Array.prototype.indexOf.call(range.startContainer.parentElement.childNodes, range.startContainer);
            range.setStart(range.startContainer.parentElement, index - 1);
        } else {
            range.setStart(range.startContainer.previousSibling, getNodeLength(range.startContainer.previousSibling));
        }
    } else if (range.startContainer.parentElement) {
        console.log("C");
        range.setStart(range.startContainer.parentElement, 0);
    }
}

/**
 * Extends range to the right in place
 * @param {*} range 
 */
function extendRangeForward(range) {
    let checkInside = () => {
        if (isElementNode(range.endContainer)) {
            if (range.endOffset < range.endContainer.childNodes.length) {
                console.log("A");
                const node = range.endContainer.childNodes.item(range.endOffset);
                range.setEnd(node, 0);
                return true;
            }
        } else {
            if (range.endOffset < range.endContainer.length) {
                console.log("X");
                range.setEnd(range.endContainer, range.endOffset + 1);
                return true;
            }
        }
        return false;
    };

    if (checkInside()) {

    } else if (range.endContainer.nextSibling) {
        console.log("B");
        if (range.endContainer.parentElement) {
            const index = Array.prototype.indexOf.call(range.endContainer.parentElement.childNodes, range.endContainer);
            range.setEnd(range.endContainer.parentElement, index + 1);
        } else {
            range.setEnd(range.endContainer.nextSibling, 0);
        }
    } else if (range.endContainer.parentElement) {
        console.log("C");
        range.setEnd(range.endContainer.parentElement, range.endContainer.parentElement.childNodes.length);
    }
}

/**
 * Inserts a string
 * @param {String} data 
 * @param {AbstractRange[]} ranges 
 */
export function insertText(data, ranges) {

    const editRanges = ranges.map((sr) => copyRange(sr, sr.startContainer.ownerDocument.createRange()));

    editRanges.forEach((range) => {
        if (!range.collapsed) {
            range.deleteContents();
        }
        const node = range.startContainer.ownerDocument.createTextNode(data);
        range.insertNode(node);
        range.setEndAfter(node);
        range.commonAncestorContainer.normalize();
    });

    return editRanges;
}

/**
 * 
 * @param {HTMLElement} paragraphElement 
 * @param {AbstractRange[]} ranges 
 */
function insertParagraph(paragraphElement, ranges) {

    const editRanges = ranges.map((sr) => copyRange(sr, sr.startContainer.ownerDocument.createRange()));

    editRanges.forEach((range) => {
        if (!range.collapsed) {
            range.deleteContents();
        }

        let context = findBlockContext(range.startContainer);

        range.setEnd(context, context.childNodes.length);
        
        // this checks if inside this element are other block elements
        for (const element of iterateBetweenNodes(range.startContainer, range.endContainer)) {
            if (isBlockElement(element)) {
                range.setEndBefore(element);
                break;
            }
        }
        const frag = range.extractContents();
    
        const paragraph = (paragraphElement ?? context)?.cloneNode(false) ?? document.createElement("div");
        paragraph.append(frag);
    
        if (context) {
            range.setStartAfter(context);
            range.setEndAfter(context);
            console.log(range);
            // range.collapse(false);
        }
    
        range.insertNode(paragraph);
        range.setStart(paragraph, 0);
        range.collapse(true);
    });

    return editRanges;


    
}

/**
 * 
 * @param {*} direction 
 * @param {*} granularity 
 * @param {Range[]} ranges
 * @returns 
 */
function deleteContent(direction, granularity, ranges) {
    const editRanges = ranges.map((sr) => copyRange(sr, sr.startContainer.ownerDocument.createRange()));

    /**
     * @type {Range[]}
     */
    editRanges.forEach((range) => {
        // option A
        // const sel = range.startContainer.ownerDocument.getSelection();
        // sel.empty();
        // sel.addRange(range);
        // sel.modify("extend", direction, granularity);
        // option B
        // browser automagically selects a text to delete
        // console.log(range)

        if (range.collapsed) {
            if (direction === "forward") {
                // range.collapse(true);
                extendRangeForward(range);
            } else if (direction === "backward") {
                // range.collapse(false);
                extendRangeBackward(range);
            }
        }


        if (range.startContainer.nodeType === Node.ELEMENT_NODE && range.startOffset === 0 ) {
            //delete node, add its contents after selection to the parent

        }
        if (range.endContainer.nodeType === Node.ELEMENT_NODE && range.endOffset === range.endContainer.childNodes.length) {
            //delete node, add its contents before selection to the parent

        }


        range.deleteContents();
    });

    return editRanges;
}

/**
 * Returns true if node is empty
 * @param {Node} node
 */
function isEmpty(node) {
    return !node.firstChild && !node.textContent;
}