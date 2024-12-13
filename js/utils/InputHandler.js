
/**
 * 
 * @param {KeyboardEvent} event 
 */
export function handleKeyDown(event) {
    if (event.key === "ArrowLeft") {
        event.preventDefault();

        let selection = document.getSelection();
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);


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
    } else if (event.key === "ArrowRight") {
        event.preventDefault();

        let selection = document.getSelection();
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);

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