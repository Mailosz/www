import { DocBuilder } from "../../utils/DocBuilder.js";
import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="grid">
        <div style="display: contents;"></div>
        <div class="selection"></div>
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
        min-width: fit-content;
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

    .selection {
        display: contents;
    }
    .selection>div {
        background: rgba(0,0,255,0.1);
        border: 1px solid rgba(0,0,255,0.7);
        z-index: 10;
        pointer-events: none;
    }

    .cell:focus-within {
        overflow: visible;
    }

    .cell[inputmode=decimal] {
        text-overflow: ellipsis;
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

    .calendar-button::before {
        content: '\\1F4C5';
    }

    :hover>.calendar-button {
        display: block;
    }

    .calendar-button {
        position: absolute;
        right: 0;
        top: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        display: none;
        padding: 0;
    }

    .calendar-button:hover {
        filter: brightness(1.1);
    }

    .calendar-button:active {
        filter: brightness(1.1);
    }
`;

export class OxGrid extends OxControl {

    static observedAttributes = ["contenteditable", "editable", "data"];

    #data;
    #selectedCell;
    #selection;
    #selectionRanges = [];

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
                this.moveFocusDown();
            } else if (event.key === "F1") {
                this.updateCellProperties(this.#getGrid().lastElementChild.lastElementChild);
                event.preventDefault();
            } else {
                console.log(event.key);
            }
        }

        this.addEventListener("pointerup", this.#endSelection);
        this.addEventListener("pointercancel", this.#cancelSelection);

    }

    /**
     * 
     * @returns {HTMLElement}
     */
    #getGrid() {
        return this.shadowRoot.firstElementChild.firstElementChild;
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

    get activeCell() {
        return this.#selectedCell;
    }

    getSelectionRanges() {
        return this.#selectionRanges;
    }

    moveFocusDown() {
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

    #populateFromData(data) {
        const grid = this.#getGrid();
        grid.innerHTML = "";
        const postFunctions = [];

        const headerRow = this.ownerDocument.createElement("div");
        headerRow.id = "header-row";
        headerRow.classList.add("header");
        
        const topLeftHeader = this.ownerDocument.createElement("div");
        topLeftHeader.id = "top-left-header";
        topLeftHeader.part = "top-left-header";
        topLeftHeader.style.gridArea = "1 / 1";
        headerRow.appendChild(topLeftHeader);
        grid.appendChild(headerRow);

        if (data.columns) {
            for (const columnData of data.columns) {
                this.#insertColumn(columnData, headerRow.children.length - 1, postFunctions);
            }
        }

        if (data.rows) {
            for (const rowData of data.rows) {
                this.#insertRow(rowData, grid.children.length - 1, postFunctions);
            }
        }

        for (const postFunction of postFunctions) {
            postFunction();
        }
    }

    getCell(col, row) {
        let current = this.#getGrid().firstElementChild;
        if (current == null || col < -1 || row < -1) {
            return null;
        }
        while (row > -1) {
            current = current.nextElementSibling;
            if (current == null) {
                return null;
            }
            row--;
        }
        current = current.firstElementChild;
        while (col > -1) {
            if (current == null) {
                return null;
            }
            current = current.nextElementSibling;
            col--;
        }
        return current;
    }

    getCellData(col, row) {
        if (row == -1) {
            if (this.#data.columns.length > col) {
                return this.#data.columns[col];
            }
        } else if (this.#data.rows.length > row) {
            if (col == -1) {
                return this.#data.rows[row];
            } else if (this.#data.rows[row].cells.length > col) {
                return this.#data.rows[row].cells[col];
            }
        }
        return null;
    }

    /**
     * 
     * @param {*} col 
     * @param {*} row 
     * @param {*} cellData If undefined then automatically retrieved from data
     * @returns {Object|String|null} Cell text (dat, name or id) or null
     */
    #getCellText(col, row, cellData) {
        if (row == -1) {
            if (this.#data.columns.length > col) {
                if (cellData === undefined) {
                    cellData = this.#data.columns[col];
                } 
                return cellData.name;
            }
        } else if (this.#data.rows.length > row) {
            if (col == -1) {
                if (cellData === undefined) {
                    cellData = this.#data.rows[row];
                } 
                return cellData.name;
            } else if (this.#data.rows[row].cells.length > col) {
                if (cellData === undefined) {
                    cellData = this.#data.rows[row].cells[col];
                } 
                if (cellData instanceof Object) {
                    return cellData.data;
                } else {
                    return cellData;
                }
            }
        }
        return null;
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
        editBox.innerText = text ?? "";
        editBox.inputMode = cell.inputMode;

        const confirm = () => {
            const newValue = editBox.innerText;
            const cellData = this.#updateCellValue(col, row, newValue);
            if (cellData instanceof Object) {
                this.#showData(col, row, cell, cellData, newValue, true);
            } else {
                this.#resetCellDataPresentation(cell, cellData);
            }
        }

        editBox.onkeydown = (event) => {
            if (event.key == "Escape") {
                editBox.onblur = null; // it would trigger confirm
                editBox.remove();
                cell.focus();
            } else if (event.key == "Enter") {
                if (!event.shiftKey && !event.ctrlKey) {
                    confirm();
                    cell.focus();
                    this.moveFocusDown();
                    event.preventDefault();
                }
                event.stopPropagation();
            }
        }
        
        editBox.onblur = (event) => {
            confirm();
        };
        
        cell.appendChild(editBox);
        editBox.focus();
        if (editBox.lastChild != null) {
            document.getSelection().setPosition(editBox.lastChild, editBox.lastChild.length)
        }
    }

    #createCell(col, row) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.style.gridRow = row + 2;
        cell.style.gridColumn = col + 2;
        cell.part = "cell";
        cell.tabIndex = 0;

        cell.cellColumn = col;
        cell.cellRow = row;


        cell.onkeydown = (event) => {
            if (event.key == "Enter") {
                this.#editCell(col, row, cell, this.#getCellText(col, row));
                event.preventDefault();
            }
        }

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
            if (event.target == event.currentTarget) {
                this.#editCell(col, row, cell, this.#getCellText(col, row));
            }
        };

        cell.onpointerdown = (event) => {
            this.#beginSelection(col, row);
        }

        cell.onpointerover = (event) => {
            if (this.#selection) {
                if (event.pressure < Number.EPSILON) {
                    this.#endSelection();
                } else {
                    this.#moveSelection(col, row);
                }
            }
        }

        cell.onfocus = (event) => {
            this.#focusCell(cell);
        }


        return cell;
    }

    #createColumnHeaderCell(col, columnData, postFunctions) {
        const columnHeader = this.#createCell(col, -1, columnData);
        columnHeader.classList.add("col-header");
        columnHeader.part = "column-header";
        
        if (columnData) {
            this.#initiateCellVisual(col, -1, columnHeader, columnData, postFunctions);
            //this.#computeCellDataPresentation(col, -1, columnHeader, columnData, columnData.name);
        }

        return columnHeader;
    }

    #createRowHeaderCell(row, rowData, postFunctions) {

        const rowHeader = this.#createCell(-1, row, rowData);
        rowHeader.classList.add("row-header");
        rowHeader.part = "row-header";

        if (rowData) {
            this.#initiateCellVisual(-1, row, rowHeader, rowData, postFunctions);
            //this.#computeCellDataPresentation(-1, row, rowHeader, rowData, rowData.name ?? rowData.id);
        }

        return rowHeader;
    }

    /**
     * 
     * @param {HTMLElement} cell 
     */
    #beginSelection(col, row) {
        this.#clearSelection(); // just for sure
        this.#selection = {startX: col, startY: row, endX: col, endY: row, element: null, range: null};

        if (col == -1 || row == -1) {
            this.#moveSelection(col, row);
        }
        
    }

    #moveSelection(col, row) {

        if (!this.#selection) {
            return;
        }

        //remove text selection
        this.ownerDocument.getSelection().empty();

        if (this.#selection.element == null) {
            const selem = this.ownerDocument.createElement("div");
            this.#selection.element = selem;
            const selection = this.shadowRoot.firstElementChild.lastElementChild;
            selection.innerHTML = "";
            selection.append(selem);
        }

        this.#selection.endX = col;
        this.#selection.endY = row;

        let selectionRange;

        if (col == -1) {
            if (row == -1) { //select all
                selectionRange = new GridRange(0,0,Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY);
            } else { //select row
                selectionRange = new GridRange(0,this.#selection.startY,Number.POSITIVE_INFINITY,this.#selection.endY);
            }
        } else if (row == -1) { //select column
            selectionRange = new GridRange(this.#selection.startX,0,this.#selection.endX,Number.POSITIVE_INFINITY);
        } else { // select cells

            const cellData = this.getCellData(col, row);
            if (cellData instanceof Object && "merged" in cellData) {
                this.#selection.endX += cellData.merged.w - 1;
                this.#selection.endY += cellData.merged.h - 1;
            }
            selectionRange = new GridRange(this.#selection.startX,this.#selection.startY,this.#selection.endX,this.#selection.endY);
        }
        this.#selection.range = selectionRange; 


        this.#selection.element.style.gridColumnStart = selectionRange.startX + 2;
        this.#selection.element.style.gridRowStart = selectionRange.startY  + 2; 
        const columnEnd = selectionRange.endX + 3;
        const rowEnd = selectionRange.endY + 3;

        this.#selection.element.style.gridColumnEnd = Math.min(columnEnd, this.columnCount + 2);
        this.#selection.element.style.gridRowEnd = Math.min(rowEnd, this.rowCount + 2);
    }

    #endSelection() {
        if (this.#selection) {
            if (this.#selection.startX == this.#selection.endX && this.#selection.startY == this.#selection.endY && this.#selection.startX != -1 && this.#selection.startY != -1) {
                this.#cancelSelection();
            } else {
                if (this.#selection.range) {
                    this.#selectionRanges.push(this.#selection.range);
                }
                this.#selection = null;
            }
        }
    }

    #cancelSelection() {
        if (this.#selection) {
            this.#selection.element?.remove();
            this.#selection = null;
        }
    }

    #clearSelection() {
        if (this.#selection) {
            this.#selection = null;
        }
        this.#selectionRanges.splice(0, this.#selectionRanges.length);
        const selection = this.shadowRoot.firstElementChild.lastElementChild;
        selection.innerHTML = "";
    }

    /**
     * 
     * @param {HTMLElement} cell 
     */
    #focusCell(cell) {
        if (this.#selectedCell) {
            this.#selectedCell.classList.remove("focused");
        }
        this.#selectedCell = cell;
        if (this.#selectedCell) {
            this.#selectedCell.classList.add("focused");
        }

        const event = new CustomEvent("cellfocused", {detail: {cell: cell}});
        this.dispatchEvent(event);
        if (this.oncellfocused) {
            this.oncellfocused(event);
        }
    }

    /**
     * Inserts a row to the grid
     * @param {*} rowData 
     */
    insertRow(rowData, rowNumber) {
        const postFunctions = [];
        this.#insertRow(rowData, rowNumber, postFunctions);

        for (const postFunction of postFunctions) {
            postFunction();
        }
    }

    #insertRow(rowData, rowNumber, postFunctions) {

        if (!rowData) {
            rowData = {cells: []};
        }

        const grid = this.#getGrid();

        const currentRow = document.createElement("div");
        currentRow.classList.add("row");

        //row header
        const rowHeader = this.#createRowHeaderCell(rowNumber, rowData, postFunctions);
        currentRow.appendChild(rowHeader);

        // insert data cells
        for (const cellData of rowData.cells) {
            const colNumber = currentRow.childElementCount - 1;
            const cell = this.#createCell(colNumber, rowNumber);
            currentRow.appendChild(cell);
            
            if (cellData instanceof Object) {
                this.#initiateCellVisual(colNumber, rowNumber, cell, cellData, postFunctions);
            } else {
                this.#resetCellDataPresentation(cell, cellData);
            }
        }

        //filling in not present cells
        const columnsLength = grid.firstElementChild.children.length - 1;
        const currentRowCount = currentRow.childElementCount;
        if (currentRowCount > columnsLength) { 

            const headerRow = grid.firstElementChild;
            while (headerRow.children.length < currentRowCount) {// add headers
                headerRow.appendChild(this.#createColumnHeaderCell(headerRow.children.length - 1, null, postFunctions));
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
        const postFunctions = [];
        this.#insertRow(columnData, columnNumber, postFunctions);

        for (const postFunction of postFunctions) {
            postFunction();
        }
    }

    #insertColumn(columnData, columnNumber, postFunctions) {

        if (!columnData) {
            columnData = {};
        }

        const grid = this.#getGrid();

        const headerRow = grid.firstElementChild;
        headerRow.appendChild(this.#createColumnHeaderCell(columnNumber, columnData, postFunctions));

        // insert cells
        let row = headerRow.nextElementSibling;
        let rowNumber = 0;
        while (row != null) {
            row.appendChild(this.#createCell(columnNumber, rowNumber, null));
            row = row.nextElementSibling;
            rowNumber++;
        }
    }

    /**
     * Update cell visual and data properites
     * @param {HTMLElement} cell 
     * @param {*} properties 
     */
    updateCellProperties(cell, properties) {
        if (cell == null || properties == null) return;
        let col = -1;
        let row = -1;
        console.time("szukaj");
        let prev = cell;
        while (prev.previousElementSibling != null) {
            col++;
            prev = prev.previousElementSibling;
        }
        prev = prev.parentElement?.previousElementSibling;
        while (prev != null) {
            row++;
            prev = prev.previousElementSibling;;
        }
        console.timeEnd("szukaj");
        console.log("col: " + col + ", row: " + row);
        console.log(properties);

        this.#updateCellDataProperties(col, row, cell, properties);
        //this.#computeCellVisual(col, row, cell, properties);
    }

    /**
     * Ensures that the cell exists and updates its data
     * @param {*} col 
     * @param {*} row 
     * @param {*} updateFn 
     * @returns Updated cell
     */
    #updateData(col, row, updateFn) {
        if (this.data) {
            if (row == -1) { // column header
                while (this.data.columns.length <= col) {
                    this.data.columns.push({});
                }
                const cellData = updateFn(this.data.columns[col]);
                this.data.columns[col] = cellData;
                return cellData;
            } else if (col == -1) { // row header
                while (this.data.rows.length <= row) {
                    this.data.rows.push({cells: []});
                }
                const cellData = updateFn(this.data.rows[row]);
                this.data.rows[row] = cellData;
                return cellData;
            } else {

                while (this.data.rows.length <= row) {
                    this.data.rows.push({cells: []});
                }
                while (this.data.rows[row].cells.length <= col) {
                    this.data.rows[row].cells.push(null);
                }

                const cellData = updateFn(this.data.rows[row].cells[col]); 
                this.data.rows[row].cells[col] = cellData;
                return cellData;
            }
        }
    }

    /**
     * Updates cell data
     * @param {*} col 
     * @param {*} row 
     * @param {*} value 
     * @returns Updated cell with all its properties, and new value
     */
    #updateCellValue(col, row, value) {
        console.log("Cell edited: " + col + ", " + row + ", value: " + value);

        const cellData = this.#updateData(col, row, (cell) => {
            if (row == -1 || col == -1) {
                cell.name = value;
                return cell;
            } else {
                if (cell instanceof Object) {
                    cell.data = value;
                    return cell;
                } else {
                    return value;
                }
            }
        });

        const event = new CustomEvent("valuechanged", {detail: {cellColumn: col, cellRow: row, value: value}});
        this.dispatchEvent(event);
        if (this.onvaluechanged) {
            this.onvaluechanged(event);
        }
        return cellData;
    }

    
    /**
     * Updates grid data with new cell properties 
     * @param {*} col 
     * @param {*} row 
     * @param {*} properties 
     * @returns Updated cell with all its properties
     */
    #updateCellDataProperties(col, row, cell, properties) {
        console.log("Cell props changed: " + col + ", " + row + "");

        const computeFunctions = [];

        const cellData = this.#updateData(col, row, (cellData) => {
            
            if (!(cellData instanceof Object)) { // only cells can be a string and not an object
                cellData = {data: cellData};
            }

            for (const property in properties) {
                const computeVisual = OxGrid.#computeVisualProperties[property];
                if (computeVisual === undefined) {
                    console.error(`Unknown property "${property}"`);
                    continue;
                }

                const oldValue = cellData[property];
                const newValue = properties[property]

                if (oldValue != newValue) {
                    cellData[property] = newValue;
                    if (computeVisual) {
                        computeFunctions.push(() => computeVisual(this, col, row, cell, oldValue, cellData));
                    }
                }
            }
            return cellData;
        });

        for (const compute of computeFunctions) {
            compute();
        }

        return cellData;
    }

    
    /**
     * Initiates grid cell to match new properties
     * @param {HTMLElement} cell 
     * @param {*} cellData partial cellData to update
     */
    #initiateCellVisual(col, row, cell, cellData, postFunctions) {

        if (cellData instanceof Object) {
            for (const property in cellData) {

                if (property == "merged") { //special handling
                    if ("w" in cellData.merged && "h" in cellData.merged) {
                        postFunctions.push(() => {
                            this.#merge(col, row, cell, cellData.merged);
                        });
                    }
                    continue;
                }

                // generic handling
                const computeVisual = OxGrid.#computeVisualProperties[property];
                if (computeVisual === undefined) {
                    console.error(`Unknown property "${property}"`);
                    continue;
                }
                const oldValue = undefined;
                if (computeVisual) {
                    computeVisual(this, col, row, cell, oldValue, cellData)
                }
            }
        } else {
            this.#resetCellDataPresentation(cell, this.#getCellText(cell, row, cellData));
        }

    }




    /**
     * 
     * @param {GridRange} range 
     * @returns 
     */
    mergeRange(range) {
        let cellData = this.getCellData(range.startX, range.startY);

        if (cellData && cellData.merged) { // TODO: better check (forEach every cell)
            return;
        }

        const merged = {};
        if (range.endX == Number.POSITIVE_INFINITY) {
            merged.w = Math.min(range.endX - range.startX + 1, this.columnCount - range.startX);
        } else {
            merged.w = range.endX - range.startX + 1;
        }

        if (range.endY == Number.POSITIVE_INFINITY) {
            merged.h = Math.min(range.endY - range.startY + 1, this.rowCount - range.startY);
        } else {
            merged.h = range.endY - range.startY + 1;
        }


        const cell = this.getCell(range.startX, range.startY);
        this.#updateCellDataProperties(range.startX, range.startY, cell, {"merged": merged})
    }

    #merge(col, row, cell, merged) {
        if (merged && "w" in merged && "h" in merged) {

            cell.style.gridColumnStart = col + 2;
            cell.style.gridRowStart = row + 2;
            cell.style.gridColumnEnd = col + merged.w + 2;
            cell.style.gridRowEnd = row + merged.h + 2;

            // make sure merged elements are merged
            const mergeElement = (current, x, y) => {
                current.inert = "";
                current.style.visibility = "hidden";
            };

            forCellRangeExceptFirst(cell, col, merged.w, merged.h, mergeElement)
        }
    }

    unmergeCell(cell) {
        if (cell) {
            const row = cell.cellRow;
            const col = cell.cellColumn;
            let cellData = this.getCellData(col, row);
            this.#updateCellDataProperties(col, row, cell, {"merged": undefined})
        }
    }

    #unmerge(col, row, cell, merged) {
        //cleaning
        if (merged && merged.w !== undefined && merged.h !== undefined) {
            cell.style.gridColumnStart = col + 2;
            cell.style.gridRowStart = row + 2;
            cell.style.gridColumnEnd = col + 3;
            cell.style.gridRowEnd = row + 3;

            // make sure merged elements are merged
            const unmergeElement = (current, x, y) => {
                current.inert = null;
                current.style.visibility = "visible";
            };

            forCellRangeExceptFirst(cell, col, merged.w, merged.h, unmergeElement)
        }
    }

    /**
     * 
     * @param {*} col 
     * @param {*} row 
     * @param {HTMLDivElement} cell 
     * @param {*} cellData 
     * @param {*} textValue 
     * @param {*} updatePresentation 
     */
    #showData(col, row, cell, cellData, textValue, updatePresentation = false) {

        if (cellData.type == "boolean") {
            let checkbox;
            if (updatePresentation || (checkbox = cell.querySelector("input[type=checkbox]"))) {
                cell.innerHTML = "";
                checkbox = this.ownerDocument.createElement("input");
                checkbox.type = "checkbox";
                cell.appendChild(checkbox);
            }

            
            if (textValue === true || textValue == "true") {
                checkbox.checked = true;
            } else if (textValue) {
                if (!isNaN(textValue)) {
                    if (textValue > 0) {
                        checkbox.checked = true;
                    }
                } else if (textValue != "false") {
                    checkbox.indeterminate = true;
                }
            }

            checkbox.onchange = (event) => {
                this.#updateCellValue(col, row, checkbox.checked);
            }
            cell.inputMode = "text";
        } else if (cellData.type == "number") {
            cell.innerText = textValue ?? "";
            cell.inputMode = "decimal";
        } else if (cellData.type == "date") {
            cell.innerText = textValue ?? "";
            cell.inputMode = "text";
            
            const button = this.ownerDocument.createElement("button");
            button.classList.add("calendar-button");
            button.onclick = () => {
                button.innerHTML = "";
                const dateInput = this.ownerDocument.createElement("input");
                dateInput.type = "date";
                dateInput.style.display = "none";
                dateInput.oninput = (event) => {
                    const value =  dateInput.value;
                    this.#updateCellValue(col, row, value);
                    this.#showData(col, row, cell, cellData, value, false);
                    button.innerHTML = "";
                }
                button.appendChild(dateInput);

                dateInput.showPicker();
            } 
            cell.appendChild(button);


        } else if (cellData.type == "html") {
            cell.innerHTML = textValue;
        } else {
            this.#resetCellDataPresentation(cell, textValue);
        }
    }
    
    #resetCellDataPresentation(cell, textValue) {
        cell.innerText = textValue ?? "";
        cell.inputMode = "text";
    }


    static #computeVisualProperties = {
        "name": (grid, col, row, cell, oldValue, cellData) => grid.#showData(col, row, cell, cellData, cellData.name, false),
        "id": (grid, col, row, cell, oldValue, cellData) => {
            if (cellData.name == null && cellData.data == null) {
                grid.#showData(col, row, cell, cellData, cellData.id, false);
            }
        },
        "cells": null,
        "skip": null,
        "data": (grid, col, row, cell, oldValue, cellData) => grid.#showData(col, row, cell, cellData, cellData.data, false),
        "background": (grid,col, row, cell, oldValue, cellData) => cell.style.background = cellData.background,
        "color": (grid,col, row, cell, oldValue, cellData) => cell.style.color = cellData.color,
        "bold": (grid,col, row, cell, oldValue, cellData) => cell.style.fontWeight = cellData.bold ? 600 : 400,
        "align": (grid,col, row, cell, oldValue, cellData) => cell.style.textAlign = cellData.align,
        "disabled": (grid,col, row, cell, oldValue, cellData) => cell.disabled = cellData.disabled,
        "type": (grid, col, row, cell, oldValue, cellData) => {
            grid.#showData(col, row, cell, cellData, grid.#getCellText(col, row, cellData), true);
        },
        // force use of mergeRange and unmergeCells
        "merged": (grid, col, row, cell, oldValue, cellData) => {
            grid.#unmerge(col, row, cell, oldValue);
            grid.#merge(col, row, cell, cellData.merged)
        },
        
    };

}

window.customElements.define("ox-grid", OxGrid);


class GridRange {
    constructor (x1, y1, x2, y2) {
        if (x1 > x2) {
            this.startX = x2;
            this.endX = x1;
        } else {
            this.startX = x1;
            this.endX = x2;
        }

        if (y1 > y2) {
            this.startY = y2;
            this.endY = y1;
        } else {
            this.startY = y1;
            this.endY = y2;
        }
    }

}

function forCellRangeExceptFirst(first, offset, w, h, fn) {
    let line = first.parentElement;
    let current = first.nextElementSibling;
    for (let x = 1; current != null && x < w; x++) {
        fn(current, x, 0);
        current = current.nextElementSibling;
    }
    line = line.nextElementSibling;
    for (let y = 1; line != null && y < h; y++) {
        current = line.children.item(offset+1);
        for (let x = 0; current != null && x < w; x++) {
            fn(current, x, y);
            current = current.nextElementSibling;
        }
        line = line.nextElementSibling;
    }

}