

export class MutationUndoer {
    /**
     * @type {HTMLElement}
     */
    #rootElement;
    /**
     * @type {MutationObserver}
     */
    #observer;

    /**
     * @type {MutationRecord[]}
     */
    #pendingChanges = [];
    #undoList = [];
    #redoList = [];
    #watch = false;

    /**
     * 
     * @param {HTMLElement} rootElement 
     * @param {*} options 
     */
    constructor(rootElement, options) {
        this.#rootElement = rootElement;
        this.options = {
            subtree: true, 
            childList: true, 
            attibutes: true, 
            attributeOldValue: true, 
            characterData: true, 
            characterDataOldValue: true,
             ...options
        };
        this.#observer = new MutationObserver(this.#detectChanges.bind(this));
    }

    /**
     * 
     * @param {MutationRecord[]} changes 
     */
    #detectChanges(changes) {
        if (this.#redoList.length > 0) {
            this.#redoList = [];
        }
        for (const change of changes) {
            this.#pendingChanges.unshift(change);
        }
    }

    /**
     * Start recording changes. If there were pending changes they are saved for undo
     */
    startRecording() {
        console.log("x");
        if (!this.#watch) {
            this.#observer.observe(this.#rootElement, this.options);
            this.#watch = true;
        }
        this.#pushPendingChanges(this.#undoList);
    }

    #pushPendingChanges(list) {
        if (this.#pendingChanges.length > 0) {
            list.push(this.#pendingChanges);
            this.#pendingChanges = [];
        }
    }

    stopRecording() {
        if (this.#watch) {
            this.#observer.disconnect();
            this.#watch = false;
        }
    }

    undo() {
        this.#pushPendingChanges(this.#undoList);
        this.#do(this.#undoList, this.#redoList);
    }
    
    redo() {
        this.#do(this.#redoList, this.#undoList);
    }

    #do(from, to) {
        if (from.length == 0) {
            return false;
        }
        if (!this.#watch) {
            this.#observer.observe(this.#rootElement, this.options);
            
            const changes = from.pop();
            revertMutationChanges(changes);
            to.push(this.#observer.takeRecords());

            this.#observer.disconnect();
        } else {
            const changes = from.pop();
            this.#observer.takeRecords();
            revertMutationChanges(changes);
            to.push(this.#observer.takeRecords().reverse());
        }

        return true;
    }


}

export function revertMutationChanges(changes) {
    for (const change of changes) {
        if (change.type == "characterData") {
            change.target.data = change.oldValue;
        } else if (change.type == "attributes") {
            if (change.oldValue === undefined) {
                change.target.removeAttribute(change.attributeName);
            } else {
                change.target.setAttribute(change.attributeName, change.oldValue);
            }
        } else if (change.type == "childList") {
            for (const addedNode of change.addedNodes) {
                change.target.removeChild(addedNode);
            }

            let before = change.nextSibling;
            for (const removedNode of change.removedNodes) {
                change.target.insertBefore(removedNode, before);
                before = removedNode;
            }
        } else {
            console.warn("Unknown change type " + change.type);
        }
    }
}