
import { OxCustomElementBase } from './OxCustomElementBase.js';
import { getSelection, getSelectionRangeFunction, forNodesInRange, splitTextNode } from "../utils/Edit.js";
import { MutationUndoer } from '../utils/MutationUndoer.js';

export class OxEdit extends OxCustomElementBase {

    static { this.registerCustomElement("ox-edit"); }

    #lastEdit = 0;

    constructor() {
        super();


        this.attachShadow({ mode: 'open'});
    }

    connectedCallback() {
        super.connectedCallback();
        this.contentEditable = "true";
        
        const container = document.createElement('div');
        container.classList.add('container');
        
        const toolbox = document.createElement("div");
        toolbox.classList.add("toolbox");
        
        toolbox.appendChild(this.#addTool("Undo", "undo", (event) => this.undo()));
        toolbox.appendChild(this.#addTool("Redo", "redo", (event) => this.redo()));
        toolbox.appendChild(this.#addTool("Bold", "bold", (event) => this.changeSelectionInlineStyle("font-weight", "600")));
        toolbox.appendChild(this.#addTool("Unbold", "bold", (event) => this.changeSelectionInlineStyle("font-weight", "normal")));
        toolbox.appendChild(this.#addTool("Italic", "italic", (event) => this.changeSelectionInlineStyle("font-style", "italic")));
        toolbox.appendChild(this.#addTool("Underline", "underline", (event) => this.changeSelectionInlineStyle("text-decoration", "underline")));
        
        
        const editarea = document.createElement("div");
        editarea.part = "editarea";
        
        
        
        const slot = document.createElement("slot");
        slot.contentEditable = "true";
        editarea.appendChild(slot);
        // this.addEventListener("focus", () => {
        //     slot.focus();
        // });

        container.appendChild(toolbox);
        container.appendChild(editarea);

        this.shadowRoot.appendChild(container);

        this.undoer = new MutationUndoer(this);
        this.undoer.startRecording();
        this.addEventListener("beforeinput", (event) => {
            this.#handleBeforeInput(event);
        });
    }

    #handleBeforeInput(event) {
        console.log(event.inputType);
        if (event.inputType === "undo") {
            event.preventDefault();
            this.undo();
        } else if (event.inputType === "redo") {
            event.preventDefault(); 
            this.redo();
        } else if (event.inputType === "formatBold") {
            event.preventDefault(); 
            this.changeSelectionInlineStyle("font-weight", "600");
        } else if (event.inputType === "formatItalic") {
            event.preventDefault(); 
            this.changeSelectionInlineStyle("font-style", "italic");
        } else if (event.inputType === "formatUnderline") {
            event.preventDefault(); 
            this.changeSelectionInlineStyle("text-decoration", "underline");
        } else if (event.inputType === "insertText") {
            const currentTime = Date.now();
            if ([" ", ",", ".", ":", ";", "="].includes(event.data) || currentTime - this.#lastEdit > 1000) {
                this.undoer.startRecording();
            } 
            this.#lastEdit = currentTime;
        } else if (
            event.inputType === "insertParagraph" ||
            event.inputType === "insertLineBreak" ||
            event.inputType === "insertFromPaste" ||
            event.inputType === "deleteContentBackward" ||
            event.inputType === "deleteContentForward" ||
            event.inputType === "deleteByCut"
        ) {
            this.undoer.startRecording();
        }
    }

    #addTool(name, icon, action) { 
        const button = document.createElement("button");
        button.classList.add("tool");
        button.setAttribute("title", name);
        button.textContent = name;
        button.addEventListener("click", action);
        return button;
    }

    changeSelectionInlineStyle(property, value) {
        const selection = this.ownerDocument.getSelection();

        const checkElementAndDescendants = (element) => {

            const elementStyle = getComputedStyle(element);

            if (elementStyle[property] !== value) {
                element.style[property] = "inherit";
            }

            let child = element.firstElementChild;
            while (child) {
                checkElementAndDescendants(child);
                child = child.nextElementSibling;
            }

        }

        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            
            forNodesInRange(range, (element) => {
                const elementStyle = getComputedStyle(element);
                const parentStyle = getComputedStyle(element.parentElement);

                if (elementStyle[property] !== value) {
                    if (parentStyle[property] === value) { 
                        // remove style from element let it inherit it from the parent
                        element.style[property] = "inherit";
                    } else {
                        element.style[property] = value;
                    }
                }
                // check if any ancestor overrides currently changes style and update it to inherit
                let child = element.firstElementChild;
                while (child) {
                    checkElementAndDescendants(child);
                    child = child.nextElementSibling;
                }

                //TODO: remove inline elements without styles
            }, (node, startOffset, endOffset) => {
                const parentStyle = getComputedStyle(node.parentElement);
                if (parentStyle[property] !== value) {
                    const newNode = splitTextNode(node, startOffset, endOffset);

                    const wrapper = document.createElement("span");
                    wrapper.style[property] = value;
                    node.parentElement.replaceChild(wrapper, newNode);
                    wrapper.appendChild(newNode);

                }
            });
        }
    }

    undo() {
        this.undoer.undo();
    }

    redo() {
        this.undoer.redo();
    }

}