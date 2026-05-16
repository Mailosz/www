/**
 * Calls the specified function for every top-most node in the range. Only returns nodes that are completely selected. Splits text nodes if needed.
 * @param {Range} range The range to iterate over
 * @param {function(Node)} callback The function to call for every node in the range
 */
export function forNodesInRange(range, callback) {

    forRange(range, callback, (node, startOffset, endOffset) => {

        if (startOffset === 0 && endOffset === node.textContent.length) {
            callback(node);
            return;
        } else {
            if (endOffset < node.textContent.length) {
                let afterNode = document.createTextNode(node.textContent.substring(endOffset));
                node.parentElement.insertBefore(afterNode, node.nextSibling);
                node.textContent = node.textContent.substring(0, endOffset);
            }
            if (startOffset > 0) {
                let beforeNode = document.createTextNode(node.textContent.substring(0, startOffset));
                node.parentElement.insertBefore(beforeNode, node);
                node.textContent = node.textContent.substring(startOffset);
                range.setStart(node, 0);
                range.setEnd(node, node.textContent.length);
            }
            callback(node);
        }

    });
}

/**
 * Calls functions for every node in range. 
 * @param {Range} range The range to iterate over
 * @param {function(Element)} elementCallback The function to call for every element node in the range
 * @param {function(Node, startOffset, endOffset)} textCallback The function to call for every partially selected text node in range
 */
export function forRange(range, elementCallback, textCallback) {
    let startContainer = range.startContainer;
    let startOffset = range.startOffset;

    let endContainer = range.endContainer;
    let endOffset = range.endOffset;

    const commonAncestor = range.commonAncestorContainer;

    //
    if (startContainer.nodeType === Node.TEXT_NODE) {
        if (startContainer === commonAncestor) { // special case - selection inside a single node
            if (startOffset === 0 && endOffset === startContainer.textContent.length) {
                // if the whole node is selected, return the container element
                if (startContainer.parentElement !== null && startContainer.parentElement.firstChild === startContainer && startContainer.parentElement.lastChild === startContainer) {
                    startContainer = startContainer.parentElement;
                }
                elementCallback(startContainer);
            } else {
                textCallback(startContainer, startOffset, endOffset);
            }
            return;
        } else {
            if (startOffset === 0) {
                startOffset = Array.prototype.indexOf.call(startContainer.parentElement.childNodes, startContainer);
                startContainer = startContainer.parentElement;
            } else {
                if (startOffset < startContainer.textContent.length) {
                    const nextSibling = startContainer.nextSibling;
                    const parent = startContainer.parentElement;
                    textCallback(startContainer, startOffset, startContainer.textContent.length);
                    startContainer = parent;
                    startOffset = nextSibling ? Array.prototype.indexOf.call(parent.childNodes, nextSibling) : parent.childNodes.length;
                } else {
                    startOffset = Array.prototype.indexOf.call(startContainer.parentElement.childNodes, startContainer) + 1;
                    startContainer = startContainer.parentElement;
                }
            }
        }
    }

    //

    while (startContainer !== commonAncestor) {

        if (startOffset === 0) {
            startOffset = Array.prototype.indexOf.call(startContainer.parentElement.childNodes, startContainer);
            startContainer = startContainer.parentElement;
        } else {
            for (let i = startOffset; i < startContainer.childNodes.length; i++) {
                let node = startContainer.childNodes[i];
                elementCallback(node);
            }
            startOffset = Array.prototype.indexOf.call(startContainer.parentElement.childNodes, startContainer) + 1;
            startContainer = startContainer.parentElement;

        }
    }

    //
    if (endContainer.nodeType === Node.TEXT_NODE) {
        if (endOffset === endContainer.textContent.length) {
            endOffset = Array.prototype.indexOf.call(endContainer.parentElement.childNodes, endContainer) + 1;
            endContainer = endContainer.parentElement;
        } else {
            if (endOffset > 0) {
                const offset = Array.prototype.indexOf.call(endContainer.parentElement.childNodes, endContainer);
                const parent = endContainer.parentElement;
                textCallback(endContainer, 0, endOffset);
                endOffset = offset;
                endContainer = parent;
            } else {
                endOffset = Array.prototype.indexOf.call(endContainer.parentElement.childNodes, endContainer);
                endContainer = endContainer.parentElement;
            }
        }
    }

    //

    while (endContainer !== commonAncestor) {

        if (!endContainer.hasChildNodes() || endContainer.childNodes.length === endOffset) {
            endOffset = Array.prototype.indexOf.call(endContainer.parentElement.childNodes, endContainer) + 1;
            endContainer = endContainer.parentElement;
        } else {
            for (let i = endOffset - 1; i >= 0; i--) {
                let node = endContainer.childNodes[i];
                elementCallback(node);
            }
            endOffset = Array.prototype.indexOf.call(endContainer.parentElement.childNodes, endContainer);
            endContainer = endContainer.parentElement;

        }
    }

    // select between start and end
    if (startOffset === 0 && endOffset === startContainer.childNodes.length) {
        elementCallback(startContainer);
    } else {
        for (let i = startOffset; i < endOffset; i++) {
            let node = startContainer.childNodes[i];
            elementCallback(node);
        }
    }

}