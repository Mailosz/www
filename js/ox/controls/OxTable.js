import { OxCustomElementBase } from "./OxCustomElementBase.js";



export class OxTable extends OxCustomElementBase {
    static { this.registerCustomElement("ox-table"); }

    columns = [];

    rows = [];

    constructor() {
        super();
    }

    connectedCallback() {
        this.createTableDefinition();

        this.attachShadow({ mode: "open" });
        this.shadowRoot.append(document.createElement("table"));
    }

    createTableDefinition() {
        
        const iterator = this.ownerDocument.createNodeIterator(this, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
                if (node.tagName.toLowerCase() === "ox-table-column") {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        }); 

        this.columns = [];

        while (iterator.nextNode()) {
            const columnElement = iterator.referenceNode;
            this.columns.push({
                header: columnElement.getAttribute("header"),
                index: columnElement.getAttribute("index"),
            
            });
        }
    }

    #getTableElement() {
        return this.shadowRoot.firstElementChild;
    }

    updateTable(rows) {

        for (const row of rows) {
            const rowElement = this.shadowRoot.ownerDocument.createElement("tr");
            rowElement.part = "row";

            let index = 0;
            for (const col of this.columns) {
                const cell = this.shadowRoot.ownerDocument.createElement("td");
                cell.part = "cell";
                cell.setHTML(row[col.index ?? index]);
                rowElement.append(cell);
                index++;
            }
            this.#getTableElement().append(rowElement);
        }

    }
}

export class OxTableColumn extends OxCustomElementBase {
    static { this.registerCustomElement("ox-table-column"); }

    static observedAttributes = ["header"];

    constructor() {
        super();
    }

    connectedCallback() {
        
    }

}