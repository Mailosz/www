import { CanvasManager } from "./CanvasManager.js";


export class UserAction {

    /**
     * Keyboard shortcut invoking this action
     * @property {string}
     */
    keyboardShortcut;

    constructor(keyboardShortcut) {
        this.keyboardShortcut = keyboardShortcut;
    }

    /**
     * Concise and user friendly name of an action
     * @returns 
     */
    getName() {
        return this.constructor.name;
    }

    /**
     * Description of an action
     * @returns 
     */
    getDescription() {
        return "";
    }

    /**
     * Perform the action
     * @param {CanvasManager} cm 
     * @returns The UserChange for CanvasManager to commit
     */
    perform(cm) {
        throw "perform not implemented";
    }

}

export class GenericUserAction {

    /**
     * Keyboard shortcut invoking this action
     * @property {string}
     */
    keyboardShortcut;

    constructor(keyboardShortcut, name, description, actionFunction) {
        this.keyboardShortcut = keyboardShortcut;
        this.name = name;
        this.description = description;
        this.actionFunction = actionFunction;
    }

    /**
     * Concise and user friendly name of an action
     * @returns 
     */
    getName() {
        return this.name;
    }

    /**
     * Description of an action
     * @returns 
     */
    getDescription() {
        return this.description;
    }

    /**
     * Perform the action
     * @param {CanvasManager} cm 
     * @returns The UserChange for CanvasManager to commit
     */
    perform(cm) {
        this.actionFunction(cm);
    }

}