import { OxControl } from "./OxControl.js";

const template = /*html*/`
    <div id="container">
        <div id="first"></div>
        <div id="start"></div>
        <div id="prev"></div>
        <div id="current" class="page-number" part="selected"></div>
        <div id="next"></div>
        <div id="end"></div>
        <div id="last"></div>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {

    }

    #current {
        font-weight: 600;
        background: var(--light-accent-color, lightblue); 
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

    #start, #prev, #next, #end {
        display: flex;
        gap: 0.5em;
    }

    #first.active::before {
        content: "\\276E";
    }

    #last.active::before {
        content: "\\276F";
    }

    #start:not(:empty)::after,
    #end:not(:empty)::before {
        content: "...";
    }

    #first, #last {
        flex: 1;
        max-width: 4em;
    }

    #first, #last,
    .page-number {
        display: inline-block;
        text-align: center;
        min-width: 2em;
        padding: 0.5em 2px;
        line-height: 1em;
    }

    .active, .page-number {
        cursor: pointer;
    }


    div.page-number::before {
        content: attr(page-index);
    }

    div.page-number:hover,
    .active:hover {
        background: rgba(127,127,127,0.2);
    }

    div.page-number:active,
    .active:active {
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
        const container = this.shadowRoot.firstElementChild;


        
        let maxnum = 10;

        const currentEl = this.shadowRoot.querySelector("#current");
        currentEl.setAttribute("page-index", current);


        let createPageNumber = (number) => {
            const indexEl = document.createElement("div");
            indexEl.setAttribute("page-index", number);
            indexEl.classList.add("page-number");
            indexEl.onclick = (event) => {
                this.setAttribute("current-index", number);
            }
            return indexEl;
        }

        const prevEl = this.shadowRoot.querySelector("#prev");
        const prevMax = Math.max(maxnum / 2, maxnum - (last - current));
        for (let i = 1; i <= prevMax && current - i >= first; i++) {
            const indexEl = createPageNumber(current - i);
            prevEl.insertBefore(indexEl, prevEl.firstChild);
        }

        const nextEl = this.shadowRoot.querySelector("#next");
        const nextMax = Math.max(maxnum / 2, maxnum - (current - first));
        for (let i = 1; i <= nextMax && current + i <= last; i++) {
            const indexEl = createPageNumber(current + i);
            nextEl.appendChild(indexEl);
        }

        const ro = new ResizeObserver((entry) => {
            const target = entry[0].target;
            let child = target.firstElementChild;
            while (child != null) {

                if (target.scrollWidth > target.clientWidth) {
                    target.style.display = none;
                } else {
                    break;
                }
                child = child.nextElementSibling;
            }


            child = target.firstElementChild;
            while (child != null) {

                if (target.scrollWidth > target.clientWidth) {
                    target.style.display = none;
                } else {
                    break;
                }
                child = child.nextElementSibling;
            }
        });
        ro.observe(prevEl);
        ro.observe(nextEl);

        const lower = current - prevMax;
        if (lower > first) {
            const startEl = this.shadowRoot.querySelector("#start");

            const indexEl = createPageNumber(first);
            startEl.appendChild(indexEl);
        }

        const upper = current + nextMax;
        if (upper < last) {
            const endEl = this.shadowRoot.querySelector("#end");

            const indexEl = createPageNumber(last);
            endEl.appendChild(indexEl);
        }

        const firstEl = this.shadowRoot.querySelector("#first");
        if (current > first) {
            firstEl.onclick = () => this.previousPage();
            firstEl.classList.add("active");
        }
        const lastEl = this.shadowRoot.querySelector("#last");
        if (current < last) {
            lastEl.onclick = () => this.nextPage();
            lastEl.classList.add("active");
        }
    }

    previousPage() {
        this.setAttribute("current-index", Math.max(+this.getAttribute("current-index") - 1, this.getAttribute("first-index")));
    }

    nextPage() {
        this.setAttribute("current-index", Math.min(+this.getAttribute("current-index") + 1, +this.getAttribute("last-index")));
    }
}

window.customElements.define("ox-paging", OxPaging);