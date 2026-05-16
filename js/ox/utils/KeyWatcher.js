
/**
 * Listens to all keydown and keyup events, and keep a map of all currently pressed keys
 */
export class KeyWatcher {

    pressedKeys = {};

    constructor() {

        document.addEventListener("keydown", this.keydown.bind(this), {capture: true, passive: true});
        document.addEventListener("keyup", this.keyup.bind(this), {capture: true, passive: true});
        window.addEventListener("blur", this.blur.bind(this), {capture: true, passive: true});
    }


    keydown(event) {
        this.pressedKeys[event.code] = true;
    }

    keyup(event) {
        this.pressedKeys[event.code] = undefined;
    }

    blur(event) {
        // document won't fire keyup events when not focused, so we clear the state here
        this.pressedKeys = {};
        // this means that we occasionely may not know all pressed keys (if pressed when document is not focused)
        // but it is better than registering too many keys
    }

    /**
     * Returns true if all keys of this shortcut are curently pressed
     * @param {string} shortcut 
     * @param {*} pressedKeys 
     */
    checkKeyboardShortcut(shortcut) {
        let keys = shortcut.split("+");

        for (let key of keys) {
            if (!this.pressedKeys[key]) {
                return false;
            }
        }
        // all keys of this shortcut are pressed
        return true;
    }
    
}