

export class UserChange {

    constructor() {

    }

    /**
     * Executes UserChange applying changes to the document
     * @param {CanvasManager} cm
     */
    commit(cm) {
        throw "commit not implemented"
    }

    /**
     * Undoes changes to the document made by that change
     * @param {CanvasManager} cm
     */
    revert(cm) {
        throw "revert not implemented"
    }
}