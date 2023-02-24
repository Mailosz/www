export class ListView extends HTMLElement {

    /**
     * Register this element to use
     * @param {*} tagName optional tag name (defaults to "list-view")
     */
    static registerCustomElement(tagName) {

        if (!tagName) {
            tagName = "list-view";
        }

        customElements.define(tagName, ListView);
    }


    constructor() {
        super();
    
        this.attachShadow({ mode: "open" });

        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("list-view");
        this.wrapper.innerHTML = "LLLLLLLL";


        this.shadowRoot.append(this.wrapper);
        
      }
}