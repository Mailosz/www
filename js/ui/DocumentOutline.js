export class DocumentOutline {

    /**
     * 
     * @param {HTMLElement} documentRoot 
     * @param {HTMLElement} targetContainer 
     */
    constructor(documentRoot, targetContainer) {

        this.documentRoot = documentRoot;
        this.targetContainer = targetContainer;

        this.prepare();
    }

    prepare() {
        const headers = this.documentRoot.querySelectorAll("h1,h2,h3,h4,h5,h6");

        let level = 0;
        let last = this.targetContainer;

        for (const header of headers) {
            let headerLevel;
            switch (header.tagName) {
                case "H1":
                    headerLevel = 1;
                    break;
                case "H2":
                    headerLevel = 2;
                    break;
                case "H3":
                    headerLevel = 3;
                    break;
                case "H4":
                    headerLevel = 4;
                    break;
                case "H5":
                    headerLevel = 5;
                    break;
                case "H6":
                    headerLevel = 6;
                    break;
                default:
                    throw "Error";
            }

            if (header.id == "") {
                let id = window.crypto.randomUUID('hex');
                header.id = id;
            }
            
            
            let item = document.createElement("li");
            let link = document.createElement("a");
            link.innerText = header.innerText;
            link.href = "#" + header.id;
            item.appendChild(link);
            
            
            if (headerLevel > level) {
                let list = document.createElement("ol");
                last.appendChild(list);
                list.appendChild(item);
            } else {

                while (headerLevel < level) {
                    level--;
                    last = last.parentElement.parentElement;
                }
                //last.parentElement.parentElement.appendChild(item);

                last.parentElement.appendChild(item);
            }
            last = item;

            level = headerLevel;
        }
    }

}