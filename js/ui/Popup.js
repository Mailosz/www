import {PlacementHelper} from './PlacementHelper.js';
import { UsefulUtils } from '../UsefulUtils.js';


export class Popup {

    #focusStolen = null;

    constructor(content, options) {

        let defaultOptions = {
            pointerDismissable: true,
            keyboardDismissable: true,
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

        this.#focusStolen = document.activeElement;

        this.backdrop = document.createElement("div");
        this.backdrop.classList.add(this.options.backdropClassName);

        UsefulUtils.stopPointerEventsBubbling(this.backdrop);

        if (this.options.pointerDismissable) {
            this.backdrop.addEventListener("pointerdown", (event)=> {
                if (event.target == this.backdrop) {
                    event.preventDefault();
                    this.hide(event.pointerId);
                }
            });
        }



        this.popup = document.createElement("div");
        this.popup.classList.add(this.options.popupClassName);

        if (!this.options.blocksInput) {
            this.backdrop.style.pointerEvents = "none";
            this.popup.style.pointerEvents = "all";
        }

        if (this.options.keyboardDismissable) {
            
            if (this.options.keyboardDismissable === true) { // use default keyboard dismission key
                this.popup.addEventListener("keydown", (event)=> {
                    if (event.key == "Escape"){
                        event.preventDefault();
                        this.hide();
                    }
                });
            } else {
                if (Array.isArray(this.options.keyboardDismissable)) {
                    this.popup.addEventListener("keydown", (event)=> {
                        if (this.options.keyboardDismissable.findIndex((element) => element == event.key) >= 0){
                            event.preventDefault();
                            this.hide();
                        }
                    });
                } else { // treat as string
                    this.popup.addEventListener("keydown", (event)=> {

                        if (this.options.keyboardDismissable == event.key){
                            event.preventDefault();
                            this.hide();
                        }
                    });
                }
            }
        }


        const shadowRoot = this.popup.attachShadow({mode: "open", delegatesFocus: true});


        let contentContainer = document.createElement("div");
        contentContainer.classList.add("popup-content-container");
        
        shadowRoot.appendChild(contentContainer);

        let content;
        if (this.content instanceof Function) {
            content = this.content();
        } else {
            content = this.content;
        }

        contentContainer.appendChild(content);


        this.backdrop.appendChild(this.popup);
        document.body.appendChild(this.backdrop);

        //placing popup
        PlacementHelper.placeElement(this.popup, anchor, placement, {keepInside: this.backdrop});

        //delegating focus
        this.popup.focus();
        if (document.activeElement != this.popup) { // this means there is no focusable element
            // so we are going to make container focusable
            contentContainer.tabIndex = -1;
            this.popup.focus();
        }
    }

    /**
     * Hides the popup (and removes it from the document)
     * @param {number} [pointerId] optional pointerId when hiding a popup through pointer input
     */
    hide(pointerId) {

        let backdrop = this.backdrop;

        // when dismissing popup through pointer input, we wait before the end of a current interaction before stoppping receiving inputs 
        // (or else events such as click will fire underneath the popup)
        if (pointerId) {
            this.backdrop.setPointerCapture(pointerId);
            this.backdrop.addEventListener("pointerup", (event) => backdrop.style.pointerEvents = "none");
        } else {
            //when closing otherwise we want to immediately allow seethrough input
            backdrop.style.pointerEvents = "none";
        }

        
        //apply hiding class
        this.backdrop.classList.add("hiding");
        //remove popup after animation finished
        UsefulUtils.removeElementAfterAllAnimations(this.backdrop);


        //workaround to restore stolen focus
        if (this.#focusStolen) {
            this.#focusStolen.focus();
        }
    }

    static getCurrentPopup() {
        //TODO: do
    }
}