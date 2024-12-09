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
        background: #aaa;
        border: 1px solid black;
        --cell-gap:1px;
        --cell-padding: 2px 4px;
        --cell-background: white;
        --header-background: #ddd;
        position: relative;
    }

    #grid {
        flex: 1;
        display: grid;
        gap: var(--cell-gap);

        justify-content: stretch;
        align-items: stretch;
        justify-items: stretch;
        grid-template-columns: [header] min-content;
        grid-auto-columns: 1fr;
    }

    .cell:focus {
        outline: 4px rgba(0,0,255,0.7) solid;
        z-index: 10;
    }

    .cell {
        background: var(--cell-background);
        min-width: 10px;
        min-height: 1em;
        padding: var(--cell-padding);
        position: relative;
    }

    .cell:empty::before {
        content: "\\200B"; /* minimum height hack */
    }

    .cell>.edit-box {
        outline: 4px rgba(0,0,255,0.7) solid;
        padding: var(--cell-padding);
        background: var(--cell-background);
        min-width: 100%;
        min-height: 100%;
        z-index: 10;
        position: absolute;
        left: 0;
        top: 0;
    }

    .row, .header {
        display: contents;
    }

    .row-header {
        text-align: right;
        padding: var(--cell-padding);
        background: var(--header-background);
    }

    .col-header {
        min-height: 1em;
        text-align: center;
        padding: var(--cell-padding);
        background: var(--header-background);
    }

    .add-row {
        position: absolute;
        bottom: 0;
        left: 0;
        transform: translate(-50%,50%);
    }

    .add-col {
        position: absolute;
        top: 0;
        right: 0;
        transform: translate(50%,-50%);
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

        if (this.#data) {
            this.#populateFromData(this.#data);
        }

        let db = new DocBuilder(this.ownerDocument);

        this.shadowRoot.appendChild(db.button().innerText("+").class("add-row").event("click", () => this.insertRow(null, this.shadowRoot.querySelector("#grid").children.length - 1)).get());
        this.shadowRoot.appendChild(db.button().innerText("+").class("add-col").event("click", () => this.addColumn()).get());
   }

    get data() {
        return this.#data;
    }

    setData(data) {
        this.#data = data;
        this.#populateFromData(data);
    }

    #updateData(row, col, value) {
        console.log("Cell edited: " + col + ", " + row + ", value: " + value);
        if (this.data) {
            if (row == -1) { // column header
                while (this.data.columns.length <= col) {
                    this.data.columns.push({});
                }
                this.data.columns[col].name = value;
            } else if (col == -1) { // row header
                while (this.data.rows.length <= row) {
                    this.data.rows.push({cells: []});
                }
                this.data.rows[row].name = value;
            } else {

                while (this.data.rows.length <= row) {
                    this.data.rows.push({cells: []});
                }

                while (this.data.rows[row].cells.length <= col) {
                    this.data.rows[row].cells.push("");
                }
                this.data.rows[row].cells[col] = value;
            }
        }
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
                this.insertRow(rowData, grid.children.length);
            }
        }

        const header = db.div().class("header").get();
        header.appendChild(db.div().class("col-header").innerText(null).get());
        if (data.columns) {
            for (const column of data.columns) {
                const rowHeader = this.#createCell(-1, header.children.length - 1, column.name);
                rowHeader.classList.add("col-header");
                header.appendChild(rowHeader);
            }
        }

        while (header.children.length < this.#columnsLength + 1) {
            const rowHeader = this.#createCell(-1, header.children.length - 1, null);
            rowHeader.classList.add("col-header");
            header.appendChild(rowHeader);
        }
        grid.insertBefore(header, grid.firstElementChild);

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "editable") {
            this.editable = newValue == "true";
            this.#populateFromData(this.data);
        }
    }

    #editCell(row, col, cell, text) {
        const editBox = document.createElement("div");
        editBox.classList.add("edit-box");
        editBox.contentEditable = true;
        editBox.innerText = text ?? cell.innerText;

        const confirm = () => {
            this.#updateData(row, col, editBox.innerText);
            cell.innerText = editBox.innerText;
        }

        editBox.onkeydown = (event) => {
            if (event.key == "Escape") {
                cell.removeChild(editBox);
            } else if (event.key == "Enter") {
                if (!event.shiftKey && !event.ctrlKey) {
                    confirm();
                }

            }
        }
        
        editBox.onblur = (event) => { confirm();};
        
        cell.appendChild(editBox);
        editBox.focus();
        if (editBox.lastChild != null) {
            document.getSelection().removeAllRanges();
            const range = document.createRange();
            range.setStart(editBox.lastChild, editBox.lastChild.length);
            document.getSelection().addRange(range);
        }
    }

    #createCell(row, col, text) {
        const cell = document.createElement("div");
        cell.innerText = text ?? "";
        cell.classList.add("cell");
        cell.style.gridRow = row + 2;
        cell.style.gridColumn = col + 2;
        cell.part = "cell";
        cell.tabIndex = 0;

        cell.onkeypress = (event) => {
            if (event.target == event.currentTarget) {
                this.#editCell(row, col, cell, event.key);
            }
        }

        cell.ondblclick = (event) => {
           this.#editCell(row, col, cell);
        };

        return cell;
    }



    

    /**
     * Inserts a row to the grid
     * @param {*} rowData 
     */
    insertRow(rowData, rowNumber) {

        if (!rowData) {
            rowData = {cells: []};
        }

        const grid = this.shadowRoot.firstElementChild;

        const db = new DocBuilder(this.ownerDocument);
        const rowEl = document.createElement("div");
        rowEl.classList.add("row");

        //row header
        const rowHeader = this.#createCell(rowNumber, -1, rowData.name ?? rowData.id);
        rowHeader.classList.add("row-header");
        rowEl.appendChild(rowHeader);


        let col = 0;
        for (const cell of rowData.cells) {
            const cellEl = this.#createCell(rowNumber, col, cell);
            rowEl.appendChild(cellEl);
            col++;
        }
        if (rowData.cells.length > this.#columnsLength) {
            this.#columnsLength = rowData.cells.length;
            let rr = 0;
            for (const row of grid.children) {
                while (row.children.length < this.#columnsLength + 1) {
                    row.appendChild(this.#createCell(rr, row.children.length - 1, null));
                }
                rr++;
            }
        } else if (rowData.cells.length < this.#columnsLength) {
            for (let i = rowData.cells.length; i < this.#columnsLength; i++) {
                rowEl.appendChild(this.#createCell(rowNumber, i, null));
            }
        }

        if (rowNumber < grid.children.length) {
            grid.insertBefore(rowEl, grid.children.item(rowNumber));
        } else if (rowNumber == grid.children.length) {
             grid.appendChild(rowEl);
        } else {
            throw "Too big index";
        }
    }

    /**
     * Inserts a column to the grid
     * @param {*} rowData 
     */
    addColumn(columnData) {

    }
}

window.customElements.define("ox-grid", OxGrid);