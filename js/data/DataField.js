import { DocBuilder } from "../utils/DocBuilder.js";


export class DataField extends HTMLElement {
    
    container;
    editbox;
    prebox;
    postbox;
    
    constructor() {
        // Always call super first in constructor
        super();

        this.attachShadow({ mode: "open", delegatesFocus: true });
        
        let builder = new DocBuilder();
        
        this.container = builder.tag("div").class("data-field-container")
        .children(
            this.editbox = builder.tag("div").class("data-field-editbox")
            .attr("contenteditable", "true")
            .attr("tabindex", "1")
            .event("input", this.inputChanged.bind(this))
            .children(
                builder.tag("div").attr("contenteditable", "false").class("data-field-listitem").innerHTML("<a>TEST<a>"),
                builder.tag("div").attr("contenteditable", "false").class("data-field-listitem").innerHTML("VALUE2"),
                builder.tag("div").attr("contenteditable", "false").class("data-field-listitem").innerHTML("XYZ")
            ).getTag(),
            this.postbox = builder.tag("div").class("data-field-postbox").children(
                builder.tag("button").innerHTML("X"),
                builder.tag("button").innerHTML("X"),
                builder.tag("button").innerHTML("X")
            ).getTag(),
            this.preline = builder.tag("div").class("data-field-footer")
            .children(
                
            ).getTag(),
            this.preline = builder.tag("div").class("data-field-header")
            .children(
                
            ).getTag(),
            this.prebox = builder.tag("div").class("data-field-prebox")
            .children(
                builder.tag("button").innerHTML("X")
            ).getTag(),
        ).getTag();
            
        this.shadowRoot.append(builder.tag("style").innerHTML(/*CSS*/`

            * {
                box-sizing: border-box;
            }

            .data-field-container {
                display: flex;
                gap: 2px;
                flex-wrap: wrap;
                display: grid;
                grid-template-columns: min-content 1fr auto;
            }

            .data-field-header {
                flex-basis: 100%;
                order: -2;
                grid-column: 1 / 4;
                grid-row: 1;
            }

            .data-field-footer {
                flex-basis: 100%;
                grid-column: 1 / 4;
                grid-row: 3;
            }

            .data-field-prebox {
                order: -1;
                grid-column: 1;
                grid-row: 2;
            }

            .data-field-postbox {
                grid-column: 3;
                grid-row: 2;
            }

            .data-field-editbox {
                flex: 1;background: lightblue;
                outline: none;
                overflow: hidden;
                display: block;
                flex-wrap: wrap;
                padding: 0;
                line-height: 1.2;
                grid-column: 2;
                grid-row: 2;
            }



            *:focus {
               
            }


            .data-field-listitem {
                display: inline-block;
                border: 1px solid green;
                border-radius: 2px;
                color: green;
                user-select: all;
                margin: 0px 2px;
                cursor: default;
                line-height: 1;
                transition: background-color 200ms, box-shadow 200ms;
            }

            .data-field-listitem::before {
                content: '\\00A0';
                user-select: all;
            }
            .data-field-listitem::after {
                content: '\\00A0';
            }

            .data-field-listitem ::selection {
                background: red;
            }

            .data-field-listitem:has( ::selection) {
                background: blue;
            }


            .data-field-listitem:hover {
                background-color: lightgreen;
                box-shadow: 0 0 10px rgba(127,127,127, 0.5);
            }

            
        `).getTag());
        this.shadowRoot.append(this.container);
            
    }
        
    /**
     * 
     * @param {InputEvent} event 
    */
    inputChanged(event) {
        console.log("changed")
    }
}

customElements.define("data-field", DataField);