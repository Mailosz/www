import { DocBuilder } from "../../utils/DocBuilder.js";
import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="grid">

    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: block;
        background: rgba(127,127,127,0.2);
        border: 1px solid black;
        --col-border:1px solid gray;
        --row-border:1px solid gray;
        --cell-padding: 2px 4px;
        --cell-background: white;
    }

    #grid {
        flex: 1;
        display: grid;
    }

    .cell:focus {
        outline: 4px blue solid;
        z-index: 10;
    }

    .cell {
        background: var(--cell-background);
        min-width: 10px;
        min-height: 1em;
        padding: var(--cell-padding);
    }

    .cell:not(:last-child) {
        border-right: var(--col-border);

    }

    .row:not(:last-child) > .cell {
        border-bottom: var(--row-border);
    }

    .row, .header {
        display: contents;
    }

    .row-num {
        text-align: right;
        padding: var(--cell-padding)
    }

    .col-num {
        min-height: 1em;
        text-align: center;
    }

`;

export class OxGrid extends OxControl {

    static observedAttributes = ["editable"];

    #data;

    constructor() {
        super();
        this.editable = true;
        this.createShadowRoot(template, style);

        if (this.data) {
            this.#populateFromData(this.data);
        }
   }

    get data() {
        return this.#data;
    }

    set data(data) {
        this.#data = data;
        this.#populateFromData(data);
    }

    #updateData(row, col, value) {
        console.log("Cell edited: " + row + ", " + col + ", value: " + value);
    }

    #populateFromData(data) {
        const grid = this.shadowRoot.firstElementChild;
        grid.innerHTML = "";
        grid.style

        let db = new DocBuilder(this.ownerDocument);

        const addCell = (row, col, text) => {
            const el = db.div().class("cell").innerText(text).style({"grid-row": row + 2, "grid-column": col + 2});
            if (this.editable == true) {
                el.attr("contenteditable", true);
                el.event("input", (event) => { this.#updateData(row, col, event.target.innerText)})
            }
            return el;
        }

        let rn = 0;
        let col = 0;
        let maxcells = 0;
        if (data.rows) {
            for (const row of data.rows) {

                const rowEl = db.div().class("row");

                if (row.id != null) {
                    rowEl.children(db.div().class("row-num").style({"grid-row": rn + 2, "grid-column": 1}).innerText(row.id));
                } else {
                    rowEl.children(db.div().class("row-num").style({"grid-row": rn + 2, "grid-column": 1}).class("empty"));
                }
                for (const cell of row.cells) {
                    const cellEl = addCell(rn, col, cell);
                    rowEl.children(cellEl);
                    col++;
                }
                if (row.cells.length > maxcells) {
                    maxcells = row.cells.length;
                    let rr = 0;
                    for (const row of grid.children) {
                        while (row.children.length < maxcells + 1) {
                            row.appendChild(addCell(rr, row.children.length - 1, null).get());
                        }
                        rr++;
                    }
                } else if (row.cells.length < maxcells) {
                    for (let i = row.cells.length; i < maxcells; i++) {
                        rowEl.children(addCell(rn, i, null));
                    }
                }
                grid.appendChild(rowEl.get());
                rn++;
                col=0;
            }
        }

        const header = db.div().class("header").get();
        header.appendChild(db.div().class("col-num").innerText(null).get());
        if (data.columns) {
            for (const column of data.columns) {
                header.appendChild(db.div().class("col-num").style({"grid-row": 1, "grid-column": header.children.length + 1}).innerText(column.name).get());
            }
        }

        while (header.children.length < maxcells + 1) {
            header.appendChild(db.div().class("col-num").style({"grid-row": 1, "grid-column": header.children.length + 1}).innerText("a").get());
        }
        grid.insertBefore(header, grid.firstElementChild);

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "editable") {
            this.editable = newValue == "true";
            this.#populateFromData(this.data);
        }
    }

}

window.customElements.define("ox-grid", OxGrid);