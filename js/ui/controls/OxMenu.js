import {OxControl} from "./OxControl.js";
import {OxButton} from "./OxButton.js";


const template = /*html*/`
    <div id="popup" part="popup">
        <slot id="slot-id"></slot>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host{

    }
`;

export class OxMenu extends OxControl {

    static observedAttributes = ["modal"];

    constructor() {
        super();
        
        this.createShadowRoot(template, style, {mode: "open", delegatesFocus: true});
        
        // new MutationObserver((records) => {
        //     for (const record of records) {

        //     }
        // }).observe(this, {childList: true});

    }

    connectedCallback() {
        super.connectedCallback();
        this.setAttribute("popover", "auto");

        this.addEventListener("click", (event)=> event.stopPropagation());

        this.addEventListener("keydown", this.#keydown);
        this.addEventListener("toggle", (event) => {
            if (event.newState == "open") {
                this.shadowRoot.getElementById("slot-id").assignedElements().at(0).focus();
            }
        });
        this.addEventListener("focusout", (event) => {
            if (!event.relatedTarget) {
                this.close();
            } else if (event.relatedTarget instanceof Node) {
                if (!this.contains(event.relatedTarget)) {
                    this.close();
                }
            } else {
                this.close();
            }
        });
    }
    /**
     * 
     * @param {KeyboardEvent} event 
     */
    #keydown(event) {
        console.log(event.key);
        event.stopPropagation();
        if (event.key == "ArrowUp") {
            event.preventDefault();
            const rootNode = this.ownerDocument;
            let prev = rootNode.activeElement.previousElementSibling;
            while (prev != null) {
                prev.focus({preventScroll: true});
                if (rootNode.activeElement == prev) {
                    return;
                }
                prev = this.previousElementSibling;
            }
        } else if (event.key == "ArrowDown") {
            event.preventDefault();
            const rootNode = this.ownerDocument;
            let next = rootNode.activeElement.nextElementSibling;
            while (next != null) {
                next.focus({preventScroll: true});
                if (rootNode.activeElement == next) {
                    return;
                }
                next = this.nextElementSibling;
            }
        } else if (event.key == "ArrowRight") {
            let el = this.getRootNode().activeElement;
            if (el instanceof OxButton) {
                el.openSubmenu(el);
            }
            event.preventDefault();
        } else if (event.key == "ArrowLeft") {
            this.parentElement.focus({preventScroll: true});
            event.preventDefault();
        }
    }

    showFor(element) {
        this.showPopover();
        this.firstElementChild.focus();
    }

    close() {
        this.hidePopover();
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }
}

window.customElements.define("ox-menu", OxMenu);