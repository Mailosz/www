import { OxControl } from "./OxControl.js";

const template = /*html*/`
    <div id="prev" class="active"></div>
    <div id="container">
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
        <div class="page-index"></div>
    </div>
    <div id="next" class="active"></div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    #prev.active::before {
        content: "\\276E";
    }

    #next.active::before {
        content: "\\276F";
    }

    :host {
        display: flex;
    }

    .page-index.current {
        font-weight: 600;
        background: var(--weak-accent-color, lightblue); 
    }

    #container {
        display: flex;
        grid-auto-columns: 2em;
        grid-auto-flow: row;
        grid-template-rows: 2em 2em;
        flex-wrap: nowrap;
        gap: 0.5em;
        margin: 0 0.5em;
        justify-content: center;
    }

    #start, #prev, #next, #end {
        display: flex;
        gap: 0.5em;
    }


    #first, #last {
        flex: 1;
        max-width: 4em;
    }

    #prev, #next,
    .page-index {
        display: inline-block;
        text-align: center;
        min-width: 2em;
        padding: 0.5em 2px;
        line-height: 1em;
    }

    .active, .page-index {
        cursor: pointer;
    }

    /*div.page-index:not([page-index]) {
        display: none;
    }*/


    div.page-index::before {
        content: attr(page-index);
    }

    div.page-index:hover,
    .active:hover {
        background: rgba(127,127,127,0.2);
    }

    div.page-index:active,
    .active:active {
        background: rgba(127,127,127,0.5);
    }

    div.page-index {
        border: 1px solid black;
    }
`;

export class OxPaging extends OxControl {
    static observedAttributes = ["first-index", "last-index", "current-index", "has-more"];

    #created = false;
    constructor(opts) {
        super(opts);

        this.opts = {
            firstIndex: 1,
            currentIndex: 1,
            hasMore: false,
            lastIndex: null
        }

        this.opts = {...this.opts, ...opts};

        this.createShadowRoot(template, style);
        

    }

    connectedCallback() {
        super.connectedCallback();

        this.shadowRoot.firstElementChild.onclick = (event) => this.previousPage();
        this.shadowRoot.lastElementChild.onclick = (event) => this.nextPage();

        this.#build();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "first-index") {
            this.opts.firstIndex = newValue;
        } else if (name == "current-index") {
            if (Number.isInteger(oldValue)) {

            }
            this.opts.currentIndex = newValue;
        } else if (name == "last-index") {
            this.opts.lastIndex = newValue;
        }
        if (this.#created) {
            this.#build();
        }
    }

    #pageIndexClicked(element, index) {
        if (isNaN(index)) {

        } else {
            this.setAttribute("current-index", index);
        }
    }

    #build() {
        const firstIndex = +this.opts.firstIndex;
        const lastIndex = +this.opts.lastIndex ?? +this.opts.currentIndex;
        
        const currentIndex = +this.opts.currentIndex;
        const container = this.shadowRoot.firstElementChild.nextElementSibling;
        
        
        let size = container.childElementCount;

        let element = container.firstElementChild;
        
        let setIndex = (element, index) => {
            element.setAttribute("page-index", index);
            if (index == currentIndex) {
                element.classList.add("current");
                element.onclick = null;
            } else {
                element.classList.remove("current");
                element.onclick = (event) => this.#pageIndexClicked(element, index);
            }
        }
        
    
        let last = Math.min(currentIndex + Math.round(size / 2) - 1, lastIndex);
        let start = last - size;
        
        let index = start;
        if (index < firstIndex) {
            index = firstIndex;
        } else if (index >= firstIndex) {
            setIndex(element, firstIndex);
            
            element = element.nextElementSibling;
            setIndex(element, "...");
            element = element.nextElementSibling;
            index += 3;
        }

        while (index < currentIndex) {
            setIndex(element, index);
            element = element.nextElementSibling;
            index++;
        }

        setIndex(element, currentIndex);
        element.onclick = null;
        element.classList.add("current");
        element = element.nextElementSibling;
        index++;

        last = Math.min(Math.max(start,0) + size, lastIndex);
        // debugger;
        if (last < lastIndex) {
            let lastElement = container.lastElementChild;
            setIndex(lastElement, lastIndex);
            lastElement = lastElement.previousElementSibling;
            setIndex(lastElement, "...");
            last -= 2;
        }

        while (index <= last) {
            setIndex(element, index);
            element.classList.remove("current");
            element = element.nextElementSibling;
            index++;
        }

        //clean up last elements
        // while (element) {
        //     element.removeAttribute("page-index");
        //     element.classList.remove("current");
        //     element = element.nextElementSibling;
        //     index++;
        // }

        this.#created = true;

    }

    previousPage() {
        this.setAttribute("current-index", Math.max(+this.getAttribute("current-index") - 1, this.getAttribute("first-index")));
    }

    nextPage() {
        this.setAttribute("current-index", Math.min(+this.getAttribute("current-index") + 1, +this.getAttribute("last-index")));
    }
}

window.customElements.define("ox-paging", OxPaging);