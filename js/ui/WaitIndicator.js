import { PlacementHelper } from "../utils/PlacementHelper.js";

export class WaitIndicator {

    /**
     * 
     * @param {HTMLElement} domElement 
     */
    constructor(domElement, opts) {

        let defaultOptions = {

        };

        this.opts = {...defaultOptions, ...opts}



        this.indicator = document.createElement("div");
        this.indicator.classList.add("wait-indicator");



        document.body.appendChild(this.indicator);

        new ResizeObserver(() => {
            PlacementHelper.placeElement(this.indicator, domElement, "center center", {relativeTo: document.body});

        }).observe(domElement);



    }

}