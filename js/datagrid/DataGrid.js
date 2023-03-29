export class DataGrid {
    /**
     * 
     * @param {HTMLElement} target 
     */
    constructor (target, options) {
        this.root = target;

        let defaultOptions = {
            showColumnHeaders: true,
            showRowHeaders: true,
            resizableColumns: true,
            resizableRows: true
        }

        this.options = {...defaultOptions, ...options};
    }

    setData(data) {
        this.root.innerHTML = "";

        let dataRows = null;
        if (Array.isArray(data)) {
            dataRows = data;
        } else {
            dataRows = data.data;
        }



        let rowCount = 0;
        let maxCellCount = 0;
        for (let dataRow of dataRows) {
            rowCount++;

            let row = this.createRow(dataRow, rowCount);
           
            maxCellCount = Math.max(maxCellCount, row.childNodes.length);
            this.root.appendChild(row);
            
        }

        // column headers row
        if (this.options.showColumnHeaders) {
            let columnsHeaders = document.createElement("div");
            columnsHeaders.classList.add("columns-header");

            if (this.options.showRowHeaders) {
                let rowHeader = document.createElement("div");
                rowHeader.classList.add("row-header");
                columnsHeaders.appendChild(rowHeader);
            }

            for (let i = 1; i < maxCellCount; i++) {
                let header = document.createElement("div");
                header.classList.add("row-header");
                header.appendChild(document.createTextNode("Column " + i));


                if (this.options.resizableColumns) {
                    let resizer = document.createElement("div");
                    resizer.classList.add("resizer");

                    resizer.addEventListener("pointerdown", (event) => {
                        resizer.setPointerCapture(event.pointerId);
                    });

                    resizer.addEventListener("pointermove", (event) => {
                        //TODO
                    });

                    header.appendChild(resizer);
                }
                columnsHeaders.appendChild(header);
            }

            this.root.insertBefore(columnsHeaders, this.root.firstChild);
        }



    }

    createRow(rowData, rowIndex) {

        let row = document.createElement("div");
        row.classList.add("grid-row");

        let rowHeaderContent = rowIndex;
        let cells = null;
        if (Array.isArray(rowData)) {
            cells = rowData;
        } else {
            cells = rowData.data;
        }

        //row header
        if (this.options.showRowHeaders) {
            let rowHeader = document.createElement("div");
            rowHeader.classList.add("row-header");
            rowHeader.style.gridRow = rowIndex;
            rowHeader.innerText = rowHeaderContent;
            row.appendChild(rowHeader);
        }


        let cellCount = 0;
        for (let dataCell of cells) {
            cellCount++;
            let cell = document.createElement("div");

            let content = null;
            if (Object.prototype.toString.call(dataCell) === "[object String]") {
                content = dataCell;
            } else {
                content = dataCell.data;
            }

            cell.innerText = content;
            row.appendChild(cell);
        }

        return row;
    }
}