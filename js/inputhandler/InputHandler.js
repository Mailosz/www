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
                        range.setEnd(range.startContainer.parentElement, index);
                    } else {
                        range.setStart(range.startContainer.previousSibling, getNodeLength(range.startContainer.previousSibling));
                    }
                } else if (range.startContainer.parentElement) {
                    console.log("C");
                    range.setStart(range.startContainer.parentElement, 0);
                }
    
                range.collapse(true);
                console.log(range);
            }
        }
        showSelection(selection);
    } else if (event.key === "ArrowRight") {
        event.preventDefault();

        for (const item of selection) {
            if (item instanceof Range) {
                const range = item;

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
                            console.log("A");
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



                range.collapse(false);
                console.log(range);

            }
        }
        showSelection(selection);
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
 * @param {[StaticRange]} staticRanges 
 * @param {function(Range)} foo 
 */
function editStaticRanges(staticRanges, foo) {
    const ranges = staticRanges.map((sr) => rangeFromStatic(sr));
    ranges.forEach(foo);

    const selection = document.getSelection();
    selection.empty();
    ranges.forEach((range) => selection.addRange(range));
}


/**
 * Handles user input in a predictive way
 * @param {InputEvent} event 
 */
export function handleInput(options) {

    return (event) => {
        console.log(options);

        event.preventDefault();
    
        /**
         * @type {HTMLElement}
         */
        const editor = event.target;
    
        if (event.inputType == "insertText") {
            editStaticRanges(event.getTargetRanges(), (range) => {
                if (!range.collapsed) {
                    range.deleteContents();
                }
                
                // let container = range.startContainer;
                // if (container === editor) { // no paragraph element
                //     const div = document.createElement("div");
                //     range.insertNode(div);
                // }
    
                const node = document.createTextNode(event.data.replaceAll(" ", "\xA0"));
                range.insertNode(node);
                range.setEndAfter(node);
                range.collapse(false);
                range.commonAncestorContainer.normalize();
    
            });
        } else if (event.inputType == "insertParagraph") {
            editStaticRanges(event.getTargetRanges(), (range) => {
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


                if (editor === context) {
                    context = null;
                }

                const paragraph = (options.paragraph ?? context)?.cloneNode(false) ?? document.createElement("div");

                paragraph.append(frag);

                if (context) {
                    range.setEndAfter(context);
                    range.collapse();
                }
    
                range.insertNode(paragraph);
                range.setStart(paragraph, 0);
                range.collapse(true);
            })

        }
    };

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