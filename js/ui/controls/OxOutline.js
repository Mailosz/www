import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="view">
        <div id="view-header">
            <div id="header-title">
                <slot name="header">View title</slot>
            </div>
            <div id="header-actions">
                <slot name="actions">Actions</slot>
            </div>
        </div>
        <div id="view-content">
            <slot>Content</slot>
        </div>
        <div id="view-footer">
            <slot name="view footer">Footer</slot>
        </div>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: flex;
        justify-content: stretch;
        flex-direction: column;
        flex: 1;
        background-color: aliceblue;
    }

`;

export class OxOutline extends OxControl {

    static observedAttributes = [];

    constructor() {
        super();
        
        //this.createShadowRoot(template, style);
    
    }

    connectedCallback() {
        super.connectedCallback();

        this.updateIndex();
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

    updateIndex() {

        this.innerHTML = "";

        let parent;
        if (this.hasAttribute("for")) {
            parent = this.ownerDocument.querySelector(this.getAttribute("for"));
        } else {
            parent = this.parentElement;
            while (parent != null) {
                if (parent.tagName === "MAIN" || parent.tagName === "SECTION" || parent.tagName === "ARTICLE") {
                    break;
                }
                parent = parent.parentElement;
            }
            if (!parent) {
                parent = this.parentElement;
            }
        }

        const headers = parent.querySelectorAll("h1,h2,h3,h4,h5,h6");

        let level = 0;
        let last = this;

        for (const header of headers) {
            let headerLevel;
            switch (header.tagName) {
                case "H1":
                    headerLevel = 1;
                    break;
                case "H2":
                    headerLevel = 2;
                    break;
                case "H3":
                    headerLevel = 3;
                    break;
                case "H4":
                    headerLevel = 4;
                    break;
                case "H5":
                    headerLevel = 5;
                    break;
                case "H6":
                    headerLevel = 6;
                    break;
                default:
                    throw "Error";
            }

            if (header.id == "") {
                let id = window.crypto.randomUUID('hex');
                header.id = id;
            }
            
            
            let item = document.createElement("li");
            let link = document.createElement("a");
            link.innerText = header.innerText;
            link.href = "#" + header.id;
            item.appendChild(link);
            
            
            if (headerLevel > level) {
                let list = document.createElement("ol");
                last.appendChild(list);
                list.appendChild(item);
            } else {

                while (headerLevel < level) {
                    level--;
                    last = last.parentElement.parentElement;
                }
                //last.parentElement.parentElement.appendChild(item);

                last.parentElement.appendChild(item);
            }
            last = item;

            level = headerLevel;
        }
    }

}

window.customElements.define("ox-outline", OxOutline);