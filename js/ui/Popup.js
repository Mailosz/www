import {PlacementHelper} from '../utils/PlacementHelper.js';
import { UsefulUtils } from '../utils/UsefulUtils.js';



export class Popup {

    #focusStolen = null;
    static #currentFocusTrap;
    #lastFocusTrap;

    /**
     * 
     * @param {*} content 
     * @param {Object} options 
     * @param {boolean} options.pointerDismissable whether the popup should be closed by clicking outside of it
     * @param {boolean|string|[string]} options.keyboardDismissable whether the popup should be closed by a default key, or a specific key, or a list of keys that should close the popup
     * @param {boolean} options.blurDismissable whether the popup should be closed when losing focus
     * @param {boolean} options.blocksInput whether the popup should block pointer interaction with the elements beneath it
     * @param {boolean} options.seeTroughElement not yet available
     * @param {string} options.popupClassName class name for a popup container element
     * @param {string} options.backdropClassName class name for a popup's backdrop element
     */
    constructor(content, options) {

        let defaultOptions = {
            pointerDismissable: true,
            keyboardDismissable: true,
            blurDismissable: true,
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
     * @param {PlacementOpts} placement Placement options
     */
    show(anchor, placement) {

        // popup steals focus - remember where to return it once popup is closed
        this.#focusStolen = document.activeElement;

        // every popup has its own backdrop element
        this.backdrop = document.createElement("div");
        this.backdrop.classList.add(this.options.backdropClassName);
        this.backdrop.tabIndex = -1;

        UsefulUtils.stopPointerEventsBubbling(this.backdrop);

        // if a popup is pointerDismissable then clicking outside of it hides the popup
        if (this.options.pointerDismissable) {
            this.backdrop.addEventListener("pointerdown", (event)=> {
                if (event.target == this.backdrop) {
                    event.preventDefault();
                    this.hide(event.pointerId);
                }
            });
        }



        this.popupContainer = document.createElement("div");
        this.popupContainer.classList.add(this.options.popupClassName);
        this.popupContainer.parentPopup = this;
        

        if (!this.options.blocksInput) {
            this.backdrop.style.pointerEvents = "none";
            this.popupContainer.style.pointerEvents = "all";
        }

        if (this.options.blurDismissable) {
            this.backdrop.addEventListener("focusout", (event) => {
                
                if (!this.backdrop.contains(event.relatedTarget)) {
                    this.hide();
                }
            });
        }

        if (this.options.keyboardDismissable) {
            
            if (this.options.keyboardDismissable === true) { // use default keyboard dismission key
                this.backdrop.addEventListener("keydown", (event)=> {
                    if (event.key == "Escape"){
                        event.preventDefault();
                        this.hide();
                    }
                });
            } else {
                if (Array.isArray(this.options.keyboardDismissable)) {
                    this.backdrop.addEventListener("keydown", (event)=> {
                        if (this.options.keyboardDismissable.findIndex((element) => element == event.key) >= 0){
                            event.preventDefault();
                            this.hide();
                        }
                    });
                } else { // treat as string
                    this.backdrop.addEventListener("keydown", (event)=> {

                        if (this.options.keyboardDismissable == event.key){
                            event.preventDefault();
                            this.hide();
                        }
                    });
                }
            }
        }


        //const shadowRoot = this.popupContainer.attachShadow({mode: "open", delegatesFocus: true});
        //shadowRoot.parentPopup = this;
        //shadowRoot.styleSheets = document.styleSheets;


        let contentContainer = document.createElement("div");
        contentContainer.classList.add("popup-content-container");
        
        this.popupContainer.appendChild(contentContainer);

        let content;
        if (this.content instanceof Function) {
            content = this.content();
        } else {
            content = this.content;
        }

        contentContainer.appendChild(content);


        this.backdrop.appendChild(this.popupContainer);
        document.body.appendChild(this.backdrop);

        //placing popup
        PlacementHelper.placeElement(this.popupContainer, anchor, placement, {keepInside: this.backdrop});

        //delegating focus
        this.backdrop.focus();
    }

    /**
     * Hides the popup (and removes it from the document)
     * @param {number} [pointerId] optional pointerId when hiding a popup through pointer input
     */
    hide(pointerId) {

        let backdrop = this.backdrop;

        // when dismissing popup through pointer input, we wait before the end of a current interaction before stoppping receiving inputs 
        // (or else events such as click will fire underneath the popup)
        if (Number.isFinite(pointerId)) {
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

    /**
     * 
     * @param {HTMLElement} element 
     */
    static getPopupOfElement(element) {
        let parent = element.parentNode;
        while (parent != null) {
            if (parent.parentPopup != null) {
                return parent.parentPopup;
            }

            parent = parent.parentNode;
        }
        throw "No popup";
    }
}