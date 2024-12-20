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

    .cell.focused:focus{
        outline: 4px rgba(0,0,255,0.7) solid;
    }
    
    .cell.focused {
        outline: 4px rgba(64,128,255,0.7) solid;
        z-index: 10;
    }

    .cell:focus-within {
        overflow: visible;
    }

    .cell {
        background: var(--cell-background);
        min-width: 4em;
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
    #selectedCell;

    constructor() {
        super();
        this.editable = false;
        this.createShadowRoot(template, style);

        let db = new DocBuilder(this.ownerDocument);

        this.shadowRoot.appendChild(db.button().innerText("+").class("add-row").event("click", () => this.insertRow(null, this.rowCount)).get());
        this.shadowRoot.appendChild(db.button().innerText("+").class("add-col").event("click", () => this.insertColumn(null, this.columnCount)).get());

        if (this.data) {
            this.#data = this.data;
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
            } else if (event.key === "F1") {
                this.updateCellProperties(this.#getGrid().lastElementChild.lastElementChild);
                event.preventDefault();
            } else {
                console.log(event.key);
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

    set data(value) {
        this.setData(value);
    }

    setData(data) {
        this.#data = data;
        this.#populateFromData(data);
    }

    get rowCount() {
        return this.#getGrid().children.length - 1;
    }

    get columnCount() {
        return this.#getGrid().firstElementChild.children.length - 1;
    }

    get selectedCell() {
        return this.#selectedCell;
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
                    this.data.rows[row].cells.push(null);
                }
                const cell = this.data.rows[row].cells[col];
                if (cell instanceof Object) {
                    cell.data = value;
                } else {
                    this.data.rows[row].cells[col] = value;
                }
                
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

    #editCell(col, row, cell, text) {
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

    #createCell(col, row, text) {
        const cell = document.createElement("div");
        cell.innerText = text ?? "";
        cell.classList.add("cell");
        cell.style.gridRow = row + 2;
        cell.style.gridColumn = col + 2;
        cell.part = "cell";
        cell.tabIndex = 0;

        cell.cellColumn = col;
        cell.cellRow = row;

        cell.onkeypress = (event) => {
            if (event.target == event.currentTarget) {
                this.#editCell(col, row, cell, event.key);
                event.preventDefault();
            }
        }

        cell.onpaste = (event) => {
            //TODO: start editing
        }

        cell.ondblclick = (event) => {
           this.#editCell(col, row, cell);
        };


        cell.onfocus = (event) => {
            this.#focusCell(cell);
        }
        

        return cell;
    }

    #createColumnHeaderCell(col, columnData) {
        const columnHeader = this.#createCell(col, -1, columnData?.name ?? "");
        columnHeader.classList.add("col-header");
        columnHeader.part = "column-header";

        return columnHeader;
    }

    /**
     * Update cell visual and data properites
     * @param {HTMLElement} cell 
     * @param {*} properties 
     */
    updateCellProperties(cell, properties) {
        let col = 0;
        let row = 0;
        console.time("szukaj");
        let prev = cell;
        while (prev.previousElementSibling != null) {
            col++;
            prev = prev.previousElementSibling;
        }
        prev = prev.parentElement;
        while (prev != null) {
            row++;
            prev = prev.previousElementSibling;;
        }
        console.timeEnd("szukaj");
        console.log("col: " + col + ", row: " + row);

        this.#updateCellVisual(cell, properties);
        this.#updateCellProperties(col, row, properties);
    }

    /**
     * 
     * @param {HTMLElement} cell 
     */
    #focusCell(cell) {
        console.log("Cell selected")
        if (this.#selectedCell) {
            this.#selectedCell.classList.remove("focused");
        }
        this.#selectedCell = cell;
        if (this.#selectedCell) {
            this.#selectedCell.classList.add("focused");
        }
    }

    /**
     * Updates grid cell to match new properties
     * @param {HTMLElement} cell 
     * @param {*} properties 
     */
    #updateCellVisual(cell, properties) {

        if (properties.data != null) {
            cell.innerText = properties.data;
        }

        if (properties.background != null) {
            cell.style.background = properties.background;
        }

        if (properties.color != null) {
            cell.style.color = properties.color;
        }

        if (properties.align != null) {
            cell.style.textAlign = properties.align;
        }

        if (properties.disabled != null) {
            cell.disabled = properties.disabled;
        }

        if (properties.type) {
            if (properties.type == "boolean") {
                cell.innerHTML = "";
                let checkbox = this.ownerDocument.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = cell.innerText;
                cell.appendChild(checkbox);
            }
        }

    }

    /**
     * Updates grid data with new cell properties 
     * @param {*} col 
     * @param {*} row 
     * @param {*} properties 
     */
    #updateCellProperties(col, row, properties) {
        //TODO
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
        const rowHeader = this.#createCell(-1, rowNumber, rowData.name ?? rowData.id);
        rowHeader.classList.add("row-header");
        rowHeader.part = "row-header";
        currentRow.appendChild(rowHeader);

        // insert data cells
        for (const cell of rowData.cells) {
            if (cell instanceof Object) {
                const element = this.#createCell(currentRow.childElementCount - 1, rowNumber, "");
                this.#updateCellVisual(element, cell);
                currentRow.appendChild(element);
            } else {
                currentRow.appendChild(this.#createCell(currentRow.childElementCount - 1, rowNumber, cell));
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
                    row.appendChild(this.#createCell(row.children.length - 1, rowNumber, null));
                }
                rowNumber++;
                row = row.nextElementSibling;
            }
        } else if (rowData.cells.length < columnsLength) {
            for (let i = rowData.cells.length; i < columnsLength; i++) {
                currentRow.appendChild(this.#createCell(i, rowNumber, null));
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
            row.appendChild(this.#createCell(columnNumber, rowNumber, null));
            row = row.nextElementSibling;
            rowNumber++;
        }
    }
}

window.customElements.define("ox-grid", OxGrid);