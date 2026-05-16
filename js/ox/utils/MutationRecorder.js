

export class MutationRecorder {
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
    recordedChanges = [];


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
        for (const change of changes) {
            this.recordedChanges.unshift(change);
        }
    }

    startRecording() {
        this.#observer.observe(this.#rootElement, this.options);
    }

    stopRecording() {
        this.#observer.disconnect();
    }

    undo() {
        for (const change of this.recordedChanges) {
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
}