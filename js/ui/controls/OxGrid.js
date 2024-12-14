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

    .cell:focus-within {
        overflow: visible;
    }

    .cell {
        background: var(--cell-background);
        min-width: 10px;
        min-height: 1em;
        padding: var(--cell-padding);
        position: relative;
        overflow: hidden;
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
    #top-left-header {
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

    static observedAttributes = ["contenteditable", "editable", "data"];

    #data;

    constructor() {
        super();
        this.editable = false;
        this.createShadowRoot(template, style);

        if (this.#data) {
            this.#populateFromData(this.#data);
        }

        let db = new DocBuilder(this.ownerDocument);

        this.shadowRoot.appendChild(db.button().innerText("+").class("add-row").event("click", () => this.insertRow(null, this.#getGrid().children.length - 1)).get());
        this.shadowRoot.appendChild(db.button().innerText("+").class("add-col").event("click", () => this.insertColumn(null, this.#getGrid().firstElementChild.children.length - 1)).get());

        if (this.data) {
            this.#populateFromData(this.data);
        }

        // navigation between cells
        this.onkeydown = (event) => {
            if (event.key === "ArrowLeft") {
                if (this.shadowRoot.activeElement?.previousElementSibling) {
                    this.shadowRoot.activeElement.previousElementSibling.focus();
                }
            } else if (event.key === "ArrowRight") {
                if (this.shadowRoot.activeElement?.nextElementSibling) {
                    this.shadowRoot.activeElement.nextElementSibling.focus();
                }
            } else if (event.key === "ArrowUp") {
                const row = this.shadowRoot.activeElement?.parentElement?.previousElementSibling;
                if (row) {
                    let current = this.shadowRoot.activeElement.previousElementSibling;
                    let cell = row.firstElementChild;
                    while (current != null) {
                        current = current.previousElementSibling;
                        cell = cell.nextElementSibling;
                    }
                    if (cell) {
                        cell.focus();
                    }
                }
            } else if (event.key === "ArrowDown") {
                const row = this.shadowRoot.activeElement?.parentElement?.nextElementSibling;
                if (row) {
                    let current = this.shadowRoot.activeElement.previousElementSibling;
                    let cell = row.firstElementChild;
                    while (current != null) {
                        current = current.previousElementSibling;
                        cell = cell.nextElementSibling;
                    }
                    if (cell) {
                        cell.focus();
                    }
                }
            }
        }
    }

    /**
     * 
     * @returns {HTMLElement}
     */
    #getGrid() {
        return this.shadowRoot.firstElementChild;
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
        const grid = this.#getGrid();
        grid.innerHTML = "";

        const headerRow = this.ownerDocument.createElement("div");
        headerRow.id = "header-row";
        headerRow.classList.add("header");
        
        const topLeftHeader = this.ownerDocument.createElement("div");
        topLeftHeader.id = "top-left-header";
        topLeftHeader.part = "top-left-header";
        headerRow.appendChild(topLeftHeader);
        grid.appendChild(headerRow);


        if (data.columns) {
            for (const columnData of data.columns) {
                this.insertColumn(columnData, headerRow.children.length - 1);
            }
        }

        if (data.rows) {
            for (const rowData of data.rows) {
                this.insertRow(rowData, grid.children.length - 1);
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "contenteditable") {
            this.editable = newValue == "true";
        } else if (name == "editable") {
            this.editable = newValue == "true";
        } else if (name == "data") {
            this.#data = data;
            this.#populateFromData(data);
        }
    }

    #editCell(row, col, cell, text) {
        if (!this.editable || cell.disabled) {
            return;
        }

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
                cell.focus();
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
                event.preventDefault();
            }
        }

        cell.ondblclick = (event) => {
           this.#editCell(row, col, cell);
        };

        return cell;
    }

    #createColumnHeaderCell(col, columnData) {
        const columnHeader = this.#createCell(-1, col, columnData?.name ?? "");
        columnHeader.classList.add("col-header");
        columnHeader.part = "column-header";
        

        return columnHeader;
    }

    /**
     * Inserts a row to the grid
     * @param {*} rowData 
     */
    insertRow(rowData, rowNumber) {

        if (!rowData) {
            rowData = {cells: []};
        }

        const grid = this.#getGrid();

        const currentRow = document.createElement("div");
        currentRow.classList.add("row");

        //row header
        const rowHeader = this.#createCell(rowNumber, -1, rowData.name ?? rowData.id);
        rowHeader.classList.add("row-header");
        rowHeader.part = "row-header";
        currentRow.appendChild(rowHeader);

        // insert data cells
        for (const cell of rowData.cells) {
            if (cell instanceof Object) {
                let text = cell.data ?? "";
                const element = this.#createCell(rowNumber, currentRow.childElementCount - 1, text);

                if (cell.background) {
                    element.style.background = cell.background;
                }

                if (cell.color) {
                    element.style.color = cell.color;
                }

                if (cell.type) {
                    if (cell.type == "boolean") {
                        element.innerHTML = "";
                        let checkbox = this.ownerDocument.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.checked = cell.data;
                        element.appendChild(checkbox);
                    }
                }

                if (cell.disabled) {
                    element.disabled = cell.disabled;
                }
                
                currentRow.appendChild(element);
                if (cell.skip) { // skip no-data cells
                    for (let i = 0; i < cell.skip; i++) {
                        currentRow.appendChild(this.#createCell(rowNumber, currentRow.childElementCount - 1, null));
                    }
                }
            } else {
                currentRow.appendChild(this.#createCell(rowNumber, currentRow.childElementCount - 1, cell));
            }
        }

        //filling in not present cells
        const columnsLength = grid.firstElementChild.children.length - 1;
        const currentRowCount = currentRow.childElementCount;
        if (currentRowCount > columnsLength) { 

            const headerRow = grid.firstElementChild;
            while (headerRow.children.length < currentRowCount) {// add headers
                headerRow.appendChild(this.#createColumnHeaderCell(headerRow.children.length - 1, null));
            }

            let rowNumber = 0;
            let row = headerRow.nextElementSibling;
            while (row != null) {
                while (row.children.length < currentRowCount) {// add cells to shorter rows
                    row.appendChild(this.#createCell(rowNumber, row.children.length - 1, null));
                }
                rowNumber++;
                row = row.nextElementSibling;
            }
        } else if (rowData.cells.length < columnsLength) {
            for (let i = rowData.cells.length; i < columnsLength; i++) {
                currentRow.appendChild(this.#createCell(rowNumber, i, null));
            }
        }

        if (rowNumber < grid.children.length - 1) {
            grid.insertBefore(currentRow, grid.children.item(rowNumber));
        } else if (rowNumber == grid.children.length - 1) {
             grid.appendChild(currentRow);
        } else {
            throw "Too big index";
        }
    }

    /**
     * Inserts a column to the grid
     * @param {*} columnData 
     */
    insertColumn(columnData, columnNumber) {

        if (!columnData) {
            columnData = {};
        }

        const grid = this.#getGrid();

        const headerRow = grid.firstElementChild;
        headerRow.appendChild(this.#createColumnHeaderCell(columnNumber, columnData));

        // insert cells
        let row = headerRow.nextElementSibling;
        let rowNumber = 0;
        while (row != null) {
            row.appendChild(this.#createCell(rowNumber, columnNumber, null));
            row = row.nextElementSibling;
            rowNumber++;
        }
    }
}

window.customElements.define("ox-grid", OxGrid);