import {OxControl} from "./OxControl.js";
import {OxButton} from "./OxItem.js";


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
        // this.setAttribute("popover", "auto");

        this.addEventListener("keydown", this.#keydown);
        this.addEventListener("toggle", (event) => {
            if (event.newState == "open") {
                this.shadowRoot.getElementById("slot-id").assignedElements().at(0).focus();
            }
        });

        /**
         * @type {HTMLSlotElement}
         */
        const slot = this.shadowRoot.getElementById("slot-id");
        slot.onclick = (event) => {
            console.log(event.target);
            this.tryOpenSubmenu(event.target);
        }
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
            if (el) {
                this.tryOpenSubmenu(el);
            }
            event.preventDefault();
        } else if (event.key == "Escape" || event.key == "ArrowLeft") {
            if (this.popover) {
                this.hidePopover()
            } else {
                this.previousElementSibling.focus({preventScroll: true});
            }
            event.preventDefault();
        } else if (event.key == "Enter") {
            this.getRootNode().activeElement?.click();
        }
    }

    tryOpenSubmenu(item) {
        if (item instanceof OxButton) {

            const subitems = [];
            for (const subitem of item.children) {
                if (!subitem.hasAttribute("slot")) {
                    // subitem.showPopover();
                    subitems.push(subitem);
                }
            }
            if (subitems.length > 0) {

                const submenu = document.createElement("ox-menu");
                submenu.append(...subitems);
                submenu.part="submenu";
                submenu.classList.add("submenu");

                const submenuClose = () => {
                    submenu.remove();
                    item.append(...subitems);
                }
                
                item.after(submenu);

                submenu.firstElementChild.focus();
                submenu.addEventListener("focusout", (event) => {
                    if (!event.relatedTarget) {
                        submenuClose();
                    } else if (event.relatedTarget instanceof Node) {
                        if (!submenu.contains(event.relatedTarget)) {
                            submenuClose();
                        }
                    } else {
                        submenuClose();
                    }
                });
                
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

    open(opts) {
        //return this.shadowRoot.firstElementChild.open(opts);
    }

    close(value) {
        this.shadowRoot.firstElementChild.close(value);
    }
}

window.customElements.define("ox-menu", OxMenu);