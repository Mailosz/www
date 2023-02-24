


export class Popup {

    constructor(data) {

        this.data = data;


    }

    /**
     * Shows the popup
     * @param {(HTMLElement|{x,y})} anchor An object or location to place popup relative to
     * @param {string} placement Placement options
     */
    show(anchor, placement) {

        this.backdrop = document.createElement("div");
        this.backdrop.classList.add("popup-backdrop");

        this.popup = document.createElement("div");
        this.popup.classList.add("popup-root");

        let contentContainer = document.createElement("div");
        contentContainer.classList.add("popup-content-container");
        this.popup.appendChild(contentContainer);

        if (this.data.content) {
            if (typeof this.data.content == "HTMLElement") {
                contentContainer.appendChild(this.data.content)
            } else {
                contentContainer.innerHTML = this.data.content;
            }
        }

        if (this.data.header || this.data.closable) {
            let header = document.createElement("div");
            header.classList.add("popup-header");

            if (this.data.header) {
                let headerContainer = document.createElement("div");
                headerContainer.classList.add("popup-header-container")
                header.appendChild(headerContainer);

                if (typeof this.data.header == "HTMLElement") {
                    headerContainer.appendChild(this.data.header)
                } else {
                    headerContainer.innerText = this.data.header;
                }
            }

            if (this.data.closable) {
                let closeButton = document.createElement("div");
                closeButton.classList.add("popup-close-button");
                header.appendChild(closeButton);
            }
        }


        this.backdrop.appendChild(this.popup);
        document.appendChild(this.backdrop);
    }

    hide() {
        
    }
}