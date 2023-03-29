import {PlacementHelper} from './PlacementHelper.js';


export class Popup {

    constructor(content, options) {

        let defaultOptions = {
            dismissable: true,
            blocksInput: true,
            seeTroughElement: null,
            popupClassName: "popup",
            backdropClassName: "popup-backdrop"
        }

        // no need to check for nulls
        this.options = {...defaultOptions, ...options};
        this.content = content;
    }

    /**
     * Shows the popup
     * @param {(HTMLElement|{x,y})} anchor An object or location to place popup relative to
     * @param {string} placement Placement options
     */
    show(anchor, placement) {

        this.backdrop = document.createElement("div");
        this.backdrop.classList.add(this.options.backdropClassName);

        this.popup = document.createElement("div");
        this.popup.classList.add(this.options.popupClassName);

        let contentContainer = document.createElement("div");
        contentContainer.classList.add("popup-content-container");
        this.popup.appendChild(contentContainer);

        let content;
        if (this.content instanceof Function) {
            content = this.content();
        } else {
            content = this.content;
        }

        contentContainer.appendChild(content);


        this.backdrop.appendChild(this.popup);
        document.body.appendChild(this.backdrop);

        PlacementHelper.placeElement(this.popup, anchor, placement, {keepInside: this.backdrop});
    }

    hide() {
        
    }
}