import { OxControl } from "./OxControl.js";

const template = /*html*/`
    <div id="container">
        <div id="first">&#10094;</div>
        <div id="start"></div>
        <div id="middle"></div>
        <div id="end"></div>
        <div id="last">&#10095;</div>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {

    }

    ::part(selected) {
        font-weight: 600;
        background: rgba(31,31,224,0.2);
    }

    #container {
        display: flex;
        grid-auto-columns: 2em;
        grid-auto-flow: row;
        grid-template-rows: 2em 2em;
        flex-wrap: nowrap;
        gap: 0.5em;
        justify-content: center;
    }

    #start, #middle, #end {
        display: flex;
        gap: 0.5em;
    }

    #start:not(:empty)::after,
    #end:not(:empty)::before {
        content: "...";
    }

    #first, #last,
    .page-number {
        display: inline-block;
        text-align: center;
        cursor: pointer;
        min-width: 2em;
        padding: 0.5em 2px;
        line-height: 1em;
    }

    div.page-number::before {
        content: attr(page-index);
    }

    div.page-number:hover,
    #first:hover, #last:hover {
        background: rgba(127,127,127,0.2);
    }

    div.page-number:active,
    #first:active, #last:active {
        background: rgba(127,127,127,0.5);
    }

    div.page-number {
        border: 1px solid black;
    }
`;

export class OxPaging extends OxControl {
    static observedAttributes = ["first-index", "last-index", "current-index", "has-more"];

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
        this.#build();
    }

    #build() {
        this.shadowRoot.innerHTML = template;

        const first = +this.opts.firstIndex;
        const last = +this.opts.lastIndex ?? +this.opts.currentIndex;

        const current = +this.opts.currentIndex;

        const middle = this.shadowRoot.querySelector("#middle");

        const currentEl = document.createElement("div");
        currentEl.setAttribute("page-index", current);
        currentEl.part = "selected";
        currentEl.classList.add("page-number");
        middle.appendChild(currentEl);

        let createPageNumber = (number) => {
            const indexEl = document.createElement("div");
            indexEl.setAttribute("page-index", number);
            indexEl.classList.add("page-number");
            indexEl.onclick = (event) => {
                this.setAttribute("current-index", number);
            }
            return indexEl;
        }

        let maxnum = 6;

        for (let i = 1; i <= maxnum && current - i >= first; i++) {
            const indexEl = createPageNumber(current - i);
            middle.insertBefore(indexEl, middle.firstChild);
        }

        for (let i = 1; i <= maxnum && current + i <= last; i++) {
            const indexEl = createPageNumber(current + i);
            middle.appendChild(indexEl);
        }

        const lower = current - maxnum;
        if (lower > first) {
            const startEl = this.shadowRoot.querySelector("#start");

            const indexEl = createPageNumber(first);
            startEl.appendChild(indexEl);
        }

        const upper = current + maxnum;
        if (upper < last) {
            const endEl = this.shadowRoot.querySelector("#end");

            const indexEl = createPageNumber(last);
            endEl.appendChild(indexEl);
        }

        this.shadowRoot.querySelector("#first").onclick = () => this.previousPage();
        this.shadowRoot.querySelector("#last").onclick = () => this.nextPage();
    }

    previousPage() {

        this.setAttribute("current-index", Math.max(+this.getAttribute("current-index") - 1, this.getAttribute("first-index")));
    }

    nextPage() {
        this.setAttribute("current-index", Math.min(+this.getAttribute("current-index") + 1, +this.getAttribute("last-index")));
    }
}

window.customElements.define("ox-paging", OxPaging);