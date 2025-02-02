import { DocBuilder } from "../../utils/DocBuilder.js";
import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="grid">
        <div style="display: contents;"></div>
        <div class="overlay"></div>
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

    #focus-overlay {
        outline: 4px rgba(0,0,255,0.7) solid;
        pointer-events: none;
        z-index: 10;
        box-shadow: 2px 2px 10px rgba(127,127,127,0.75)
    }

    .overlay {
        display: contents;
    }
    .selection {
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
        outline: none;
    }

    .cell:empty::before {
        content: "\\200B"; /* minimum height hack */
    }

    .cell>.edit-box {
        outline: 4px rgba(0,0,255,0.7) solid;
        padding: var(--cell-padding);
        background: var(--cell-background, white);
        color: black;
        min-width: 100%;
        min-height: 100%;
        z-index: 10;
        position: absolute;
        left: 0;
        top: 0;
        box-shadow: 2px 2px 10px rgba(127,127,127,0.75)
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
    #undoList = [];
    #redoList = [];
    #changesBuffer = {};

    constructor() {
        super();
        this.editable = false;
        this.createShadowRoot(template, style);
        this.contentEditable = true;
        let db = new DocBuilder(this.ownerDocument);

        this.shadowRoot.appendChild(db.button().innerText("+").class("add-row").event("click", () => this.insertRow(null, this.rowCount)).get());
        this.shadowRoot.appendChild(db.button().innerText("+").class("add-col").event("click", () => this.insertColumn(null, this.columnCount)).get());

        if (this.data) {
            this.#data = this.data;
            this.#populateFromData(this.data);
        }

        // navigation between cells
        /**
         * 
         * @param {KeyboardEvent} event 
         */
        this.onkeydown = (event) => {
            if (event.key === "ArrowLeft") {
                this.moveFocusLeft();
            } else if (event.key === "ArrowRight") {
                this.moveFocusRight();
            } else if (event.key === "ArrowUp") {
                this.moveFocusUp();
            } else if (event.key === "ArrowDown") {
                this.moveFocusDown();
            } else if ((event.key === "z" || event.key === "Z") && event.ctrlKey) {
                if (event.shiftKey) {
                    this.redo();
                } else {
                    this.undo();
                }
                event.preventDefault();
            } else if ((event.key === "y" || event.key === "Y") && event.ctrlKey) {
                this.redo();
                event.preventDefault();
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
     * @returns {HTMLDivElement}
     */
    #getGrid() {
        return this.shadowRoot.firstElementChild.firstElementChild;
    }

    /**
     * 
     * @returns {HTMLDivElement}
     */
    #getOverlay() {
        return this.shadowRoot.firstElementChild.lastElementChild;
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

    /**
     * 
     * @returns {[GridRange]}
     */
    getSelectionRanges() {
        return this.#selectionRanges;
    }

    moveFocusDown() {
        let current = this.shadowRoot.activeElement.previousElementSibling;
        let index = 0;
        while (current != null) {
            current = current.previousElementSibling;
            index++;
        }

        let row = this.shadowRoot.activeElement?.parentElement.nextElementSibling;
        while (row != null) {
            current = row.children.item(index);
            current.focus();
            if (this.shadowRoot.activeElement == current) {
                break
            } else {
                row = row.nextElementSibling;
            }
        }
    }

    moveFocusUp() {
        let current = this.shadowRoot.activeElement.previousElementSibling;
        let index = 0;
        while (current != null) {
            current = current.previousElementSibling;
            index++;
        }
        
        let row = this.shadowRoot.activeElement?.parentElement.previousElementSibling;
        while (row != null) {
            current = row.children.item(index);
            current.focus();
            if (this.shadowRoot.activeElement == current) {
                break
            } else {
                row = row.previousElementSibling;
            }
        }
    }
    moveFocusLeft() {
        let current = this.shadowRoot.activeElement.previousElementSibling;
        if (current) {
            current.focus();
            while (this.shadowRoot.activeElement != current) {
                current = current.previousElementSibling;
                if (current == null) {
                    break;
                } else {
                    current.focus()
                }
            }
        }

    }
    moveFocusRight() {
        let current = this.shadowRoot.activeElement.nextElementSibling;
        if (current) {
            current.focus();
            while (this.shadowRoot.activeElement != current) {
                current = current.nextElementSibling;
                if (current == null) {
                    break;
                } else {
                    current.focus()
                }
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
        
        // top left cell
        const topLeftHeader = this.#createCell(-1, -1);
        topLeftHeader.id = "top-left-header";
        topLeftHeader.part = "top-left-header";
        topLeftHeader.disabled = true;
        this.#resetCellDataPresentation(topLeftHeader, "");
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
            if (col == -1) {
                return "";
            } else {
                if (this.#data.columns.length > col) {
                    if (cellData === undefined) {
                        cellData = this.#data.columns[col];
                    } 
                    return cellData.name;
                }
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
            const cellData = this.#updateCellDataValue(col, row, newValue);
            if (cellData instanceof Object) {
                this.#showData(col, row, cell, cellData, newValue, true);
            } else {
                this.#resetCellDataPresentation(cell, cellData);
            }
            this.#pushUndoBuffer();
        }

        editBox.onkeydown = (event) => {
            event.stopPropagation();
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

        const focusOverlay = this.#getOverlay().querySelector("#focus-overlay");
        if (focusOverlay) {
            focusOverlay.remove();
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
            if (event.key == "Enter") {debugger
                this.#editCell(col, row, cell, this.#getCellText(col, row));
                event.preventDefault();
            } else if (event.key == " ") {
                const cellData = this.getCellData(col, row);
                if (cellData?.type == "boolean") {
                    const checkbox = this.activeCell?.querySelector("input[type=checkbox]");
                    this.#updateCellDataAndVisuals(col, row, cell, {data: !(cellData.data == true)});
                    event.preventDefault();
                }
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
            cell.focus({preventScroll: true});
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
        this.#selection = {startX: Math.max(col, 0), startY: Math.max(row, 0), endX: Math.max(col, 0), endY: Math.max(row, 0), element: null, range: null};

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
            selem.classList.add("selection")
            this.#selection.element = selem;
            const overlay = this.#getOverlay();
            overlay.append(selem);
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
        const selection = this.#getOverlay().querySelectorAll(".selection");
        for (const sel of selection) {
            sel.remove();
        }
    }

    /**
     * 
     * @param {HTMLElement} cell 
     */
    #focusCell(cell) {
        
        this.#selectedCell = cell;

        let focusOverlay = this.#getOverlay().querySelector("#focus-overlay");
        if (this.#selectedCell) {
            if (!focusOverlay) {
                focusOverlay = document.createElement("div");
                focusOverlay.id = "focus-overlay";
                this.#getOverlay().appendChild(focusOverlay);
            }
            focusOverlay.style.gridColumnStart = cell.style.gridColumnStart;
            focusOverlay.style.gridColumnEnd = cell.style.gridColumnEnd;
            focusOverlay.style.gridRowStart = cell.style.gridRowStart;
            focusOverlay.style.gridRowEnd = cell.style.gridRowEnd;
        } else {
            if (focusOverlay) {
                focusOverlay.remove();
            }
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
        this.#insertColumn(columnData, columnNumber, postFunctions);

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

    #findCellRowAndColumn(cell) {
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
        return [col, row];
    }

    /**
     * Update cell visual and data properites for all cells in the range
     * @param {GridRange} range 
     * @param {*} properties 
     */
    updateRangeProperties(range, properties) {
        if (range == null || properties == null) return;
        
        let cell = range.firstCell;
        if (!cell) {
            cell = this.#getCellElement(range.startX, range.startY);
        }
        this.#clearUndoBuffer();
        forCellRange(cell, range.startX, range.endX - range.startX + 1, range.endY - range.startY + 1, (cell, x, y) => {
            const col = range.startX + x;
            const row = range.startY + y;
            this.#updateCellDataAndVisuals(col, row, cell, properties);
        });
        this.#pushUndoBuffer();
    }

    /**
     * Update cell visual and data properites
     * @param {HTMLElement} cell 
     * @param {*} properties 
     */
    updateCellProperties(cell, properties) {
        if (cell == null || properties == null) return;
        const [col, row] = this.#findCellRowAndColumn(cell);

        console.log(properties);

        this.#clearUndoBuffer();
        this.#updateCellDataAndVisuals(col, row, cell, properties);
        this.#pushUndoBuffer();
    }

    #getCellElement(col, row) {
        return this.#getGrid().children.item(+row + 1).children.item(+col + 1);
    }

    #clearUndoBuffer() {
        this.#changesBuffer = {};
    }

    #saveState(col, row, cellState) {

        let line = this.#changesBuffer[row];
        if (line === undefined) {
            line = {};
            this.#changesBuffer[row] = line;
        }

        let cellData = line[col];
        if (cellData === undefined) {
            line[col] = cellState;
        } else {
            if (cellData instanceof Object) {
                line[col] = {...cellData, ...cellState};
            } 
        }

    }

    #isEmptyObject(obj) {
        for (var prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
              return false;
            }
        }
        
        return true
    }

    #pushUndoBuffer() {
        if (!this.#isEmptyObject(this.#changesBuffer)) {
            this.#undoList.push(this.#changesBuffer);
        }
        this.#clearUndoBuffer();
    }

    undo() {
        console.log(this.#undoList);
        this.#pushUndoBuffer();
        const state = this.#undoList.pop();

        if (state != undefined) {
            for (const row in state) {
                const line = state[row];
                for (const col in line) {
                    const cellState = line[col];
    
                    this.#updateCellDataAndVisuals(+col, +row, this.#getCellElement(+col, +row), cellState);
                }
            }
        }
        if (!this.#isEmptyObject(this.#changesBuffer)) {
            this.#redoList.push(this.#changesBuffer);
        }
        this.#clearUndoBuffer();
    }

    redo() {
        let state;
        if (!this.#isEmptyObject(this.#changesBuffer)) {
            state = this.#changesBuffer;
            this.#clearUndoBuffer();
        } else {
            state = this.#redoList.pop();
        }

        this.#clearUndoBuffer();
        if (state != undefined) {
            for (const row in state) {
                const line = state[row];
                for (const col in line) {
                    const cellState = line[col];
    
                    this.#updateCellDataAndVisuals(+col, +row, this.#getCellElement(+col, +row), cellState);
                }
            }
        }
        this.#pushUndoBuffer();
        this.#clearUndoBuffer();
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
     * Updates cell data without recomputing visuals
     * @param {*} col 
     * @param {*} row 
     * @param {*} value 
     * @returns Updated cell with all its properties, and new value
     */
    #updateCellDataValue(col, row, value) {
        console.log("Cell edited: " + col + ", " + row + ", value: " + value);

        let beforeState;

        const cellData = this.#updateData(col, row, (cellData) => {

            if (row == -1 || col == -1) {
                beforeState = cellData.name;
                cellData.name = value;
                return cellData;
            } else {
                if (cellData instanceof Object) {
                    beforeState = cellData.data;
                    cellData.data = value;
                    return cellData;
                } else {
                    beforeState = cellData;
                    return value;
                }
            }
        });

        this.#saveState(col, row, beforeState);

        this.#dispatchValueChangedEvent(col, row, beforeState, cellData, value);
        return cellData;
    }

    #dispatchValueChangedEvent(col, row, oldValues, cellData, value) {
        const event = new CustomEvent("valuechanged", {detail: {cellColumn: col, cellRow: row, oldValues: oldValues, cellData: cellData, value: value}});
        this.dispatchEvent(event);
        if (this.onvaluechanged) {
            this.onvaluechanged(event);
        }
    }

    
    /**
     * Updates cell data and recomputes visuals
     * @param {*} col 
     * @param {*} row 
     * @param {*} value either an object containing properties to modify (not existing properties are left the same), or a value of the cell
     * @returns Updated cell with all its properties
     */
    #updateCellDataAndVisuals(col, row, cell, value) {
        
        let beforeState = {};
        
        const computeFunctions = [];
        const cellData = this.#updateData(col, row, (cellData) => {
            
            console.log("Cell props changed: " + col + ", " + row + "", cellData, value);

            if (value instanceof Object) {
                if (!(cellData instanceof Object)) { // only cells can be a string and not an object
                    cellData = {data: cellData};
                }
            } else {
                if (!(cellData instanceof Object)) { // only cells can be a string and not an object
                    beforeState = cellData;
                    cellData = value;

                    computeFunctions.push(() => this.#resetCellDataPresentation(cell, cellData));
                    return cellData;
                } else {
                    if (col == -1 || row == -1) {
                        value = {name: value};
                    } else {
                        value = {data: value};
                    }
                }
            }
            
            for (const property in value) {
                const computeVisual = OxGrid.#computeVisualProperties[property];
                if (computeVisual === undefined) {
                    console.error(`Unknown property "${property}"`);
                    continue;
                }

                const oldValue = cellData[property];
                const newValue = value[property]

                if (oldValue != newValue) {
                    if (newValue === undefined) {
                        delete cellData[property];
                    } else {
                        cellData[property] = newValue;
                    }
                    if (computeVisual) {
                        computeFunctions.push(() => computeVisual(this, col, row, cell, oldValue, cellData));
                    }
                    beforeState[property] = oldValue;
                }
            }

            
            return cellData;
        });

        this.#saveState(col, row, beforeState);

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
        this.#updateCellDataAndVisuals(range.startX, range.startY, cell, {"merged": merged})
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
            this.#updateCellDataAndVisuals(col, row, cell, {"merged": undefined})
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
                this.#updateCellDataValue(col, row, checkbox.checked);
                this.#pushUndoBuffer();
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
                    this.#updateCellDataValue(col, row, value);
                    this.#pushUndoBuffer();
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
        "background": (grid,col, row, cell, oldValue, cellData) => cell.style.background = cellData.background ?? "var(--cell-background, white)",
        "color": (grid,col, row, cell, oldValue, cellData) => cell.style.color = cellData.color ?? "inherit",
        "bold": (grid,col, row, cell, oldValue, cellData) => cell.style.fontWeight = (cellData.bold == "true" ? 600 : 300) ?? "inherit",
        "italic": (grid,col, row, cell, oldValue, cellData) => cell.style.fontStyle = (cellData.italic == "true" ? "italic" : "normal") ?? "inherit",
        "underline": (grid,col, row, cell, oldValue, cellData) => cell.style.textDecoration = (cellData.underline == "true" ? "underline 1px solid black" : "none") ?? "inherit",
        "hborder": (grid,col, row, cell, oldValue, cellData) => {
            if (cellData.hborder) {
                cell.style.borderTop = cellData.hborder;
                cell.style.marginTop = `calc(-${cell.style.borderTopWidth} / 2)`;
            } else {
                cell.style.borderTop = "none";
                cell.style.marginTop = "0";
            }
        },
        "vborder": (grid,col, row, cell, oldValue, cellData) => {
            if (cellData.hborder) {
                cell.style.borderLeft = cellData.vborder
                cell.style.marginLeft = `calc(-${cell.style.borderLeftWidth} / 2)`;
            } else {
                cell.style.borderLeft = "none";
                cell.style.marginLeft = "0";
            }

        },
        "align": (grid,col, row, cell, oldValue, cellData) => cell.style.textAlign = cellData.align ?? "left",
        "disabled": (grid,col, row, cell, oldValue, cellData) => cell.disabled = cellData.disabled ?? "false",
        "type": (grid, col, row, cell, oldValue, cellData) => {
            grid.#showData(col, row, cell, cellData, grid.#getCellText(col, row, cellData), true);
        },
        "merged": (grid, col, row, cell, oldValue, cellData) => {
            grid.#unmerge(col, row, cell, oldValue);
            grid.#merge(col, row, cell, cellData.merged)
        },
        
    };

}

window.customElements.define("ox-grid", OxGrid);


export class GridRange {
    constructor (x1, y1, x2, y2, firstCell) {
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

        this.firstCell = firstCell;
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

function forCellRange(first, offset, w, h, fn) {
    let line = first.parentElement;
    let current = first;
    for (let y = 0; y < h; y++) {
        current = line.children.item(offset+1);
        for (let x = 0; x < w; x++) {
            fn(current, x, y);
            current = current.nextElementSibling;
            if (current == null) {
                break;
            }
        }
        line = line.nextElementSibling;
        if (line == null) {
            break;
        }
    }
}