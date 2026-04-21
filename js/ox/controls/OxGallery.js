import { OxCustomElementBase } from "./OxCustomElementBase.js";
import { Builder } from "../Builder.js";

const css = /*css*/`
    :host {
        display: block;
        background: gray;
    }

    #gallery {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
        grid-auto-rows: 400px;
        padding: 10px;

        position: relative;
    }

    .item {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :not(.focused){
        &>.item {
            cursor: pointer;
            transition: scale 200ms;
            width: 100%;
            height: 100%;

            &:hover {
                scale: 1.05;
            }

            &:active {
                scale: 0.9;
                transition: scale 50ms ease-out;
            }
        }
    }

    .focused>.item {
        position: fixed;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        padding: 5%;
        z-index: 10;
        background-color: rgba(0,0,0,0.3);
        backdrop-filter: blur(2px) contrast(0.8);
        transition: background-color 200ms ease, backdrop-filter 200ms ease;
    }
    slot {
        border: 2px solid red;
    }

    ::slotted(*) {
        object-fit: cover;
        object-position: center;
        width: 100%;
        height: 100%;
        transition: height 500ms ease;
    }

    .focused ::slotted(*) {
        object-fit: contain;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        margin: auto;
        box-shadow: 0 0 40px rgba(0,0,0,0.5);
    }

    `;

export class OxGallery extends OxCustomElementBase {
    static { this.registerCustomElement("ox-gallery"); }



    constructor() {
        super();
    }

    connectedCallback() {
        this.attachShadow({ mode: "open", slotAssignment: "manual" });
        this.attachShadowCss(css);

        this.shadowRoot.append(document.createElement("div"));
        this.shadowRoot.firstElementChild.id = "gallery";

        for (const child of this.children) {
            const wrapper = this.shadowRoot.ownerDocument.createElement("div");
            wrapper.classList.add("wrapper");
            
            const item = this.shadowRoot.ownerDocument.createElement("div");
            item.part = "item";
            item.classList.add("item");
            
            const slot = this.shadowRoot.ownerDocument.createElement("slot");
            slot.inert = true;
            slot.assign(child);
            item.appendChild(slot);
            wrapper.appendChild(item);
            this.shadowRoot.firstElementChild.appendChild(wrapper);
            wrapper.onclick = (event) => {this.itemClicked(event, wrapper, item, slot, child)};
        }
    }

    itemClicked(event, wrapper, item, slot, child) {
        if (wrapper.classList.contains("focused")) {
            if (event.target === item) {
                wrapper.classList.remove("focused");
                slot.inert = true;
            }
        } else {
            wrapper.classList.add("focused");
            slot.inert = false;
        }
    }

}