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

        justify-content: stretch;
        align-items: stretch;
        justify-items: stretch;
        grid-template-columns: [header] min-content;
        grid-auto-columns: 1fr;
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

    .row-header {
        text-align: right;
        padding: var(--cell-padding);
    }

    .col-header {
        min-height: 1em;
        text-align: center;
        padding: var(--cell-padding);
    }

`;

export class OxGrid extends OxControl {

    static observedAttributes = ["editable"];

    #data;
    #columnsLength = 0;

    constructor() {
        super();
        this.editable = true;
        this.createShadowRoot(template, style);

        if (this.data) {
            this.#populateFromData(this.data);
        }

        let db = new DocBuilder(this.ownerDocument);

        this.shadowRoot.appendChild(db.button().innerText("+").class("add-row").event("click", () => this.addRow()).get());
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


        let db = new DocBuilder(this.ownerDocument);

        let rn = 0;
        let col = 0;
        this.#columnsLength = 0;
        if (data.rows) {
            for (const rowData of data.rows) {
                this.addRow(rowData);
            }
        }

        const header = db.div().class("header").get();
        header.appendChild(db.div().class("col-header").innerText(null).get());
        if (data.columns) {
            for (const column of data.columns) {
                header.appendChild(db.div().class("col-header").style({"grid-row": 1, "grid-column": header.children.length + 1}).innerText(column.name).get());
            }
        }

        while (header.children.length < this.#columnsLength + 1) {
            header.appendChild(db.div().class("col-header").style({"grid-row": 1, "grid-column": header.children.length + 1}).innerText("a").get());
        }
        grid.insertBefore(header, grid.firstElementChild);

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "editable") {
            this.editable = newValue == "true";
            this.#populateFromData(this.data);
        }
    }

    

    /**
     * Inserts a row to the grid
     * @param {*} rowData 
     */
    addRow(rowData) {

        if (!rowData) {
            rowData = {cells: []};
        }

        const grid = this.shadowRoot.firstElementChild;

        const db = new DocBuilder(this.ownerDocument);
        const rowEl = db.div().class("row");

        const addCell = (row, col, text) => {
            const el = db.div().class("cell").innerText(text).style({"grid-row": row + 2, "grid-column": col + 2});
            if (this.editable == true) {
                el.attr("contenteditable", true);
                el.attr("enterkeyhint", "next");
                el.event("input", (event) => { this.#updateData(row, col, event.target.innerText)})
            }
            return el;
        }

        const rowNumber = grid.children.length;

        if (rowData.id != null) {
            rowEl.children(db.div().class("row-header").style({"grid-row": rowNumber + 2, "grid-column": 1}).innerText(rowData.id));
        } else {
            rowEl.children(db.div().class("row-header").style({"grid-row": rowNumber + 2, "grid-column": 1}).class("empty"));
        }
        let col = 0;
        for (const cell of rowData.cells) {
            const cellEl = addCell(rowNumber, col, cell);
            rowEl.children(cellEl);
            col++;
        }
        if (rowData.cells.length > this.#columnsLength) {
            this.#columnsLength = rowData.cells.length;
            let rr = 0;
            for (const row of grid.children) {
                while (row.children.length < this.#columnsLength + 1) {
                    row.appendChild(addCell(rr, row.children.length - 1, null).get());
                }
                rr++;
            }
        } else if (rowData.cells.length < this.#columnsLength) {
            for (let i = rowData.cells.length; i < this.#columnsLength; i++) {
                rowEl.children(addCell(rowNumber, i, null));
            }
        }

        grid.appendChild(rowEl.get());
    }
}

window.customElements.define("ox-grid", OxGrid);