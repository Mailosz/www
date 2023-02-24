export class CodeBox extends HTMLElement {

     /**
     * Registers this element to use
     * @param {*} tagName optional tag name (defaults to "code-box")
     */
        static registerCustomElement(tagName) {

            if (!tagName) {
                tagName = "code-box";
            }
    
            customElements.define(tagName, CodeBox);
        }

    constructor() {
        // Always call super first in constructor
        super();

        this.attachShadow({ mode: "open" });

        // creating template
        this.rootContainer = document.createElement("div");
        this.rootContainer.classList.add("codebox");
        this.rootContainer.spellcheck = false;

        this.rootContainer.addEventListener("input", (event) => {
            let count = this.rootContainer.childElementCount;
            this.rootContainer.style.setProperty("--counter-width", (Math.max(count.toString().length, 2) * 0.75) + "em");
            let val = this.rootContainer.style.getPropertyValue("--counter-width");
            console.log(val);
        })


        //line counters auto resizing
        /*this.lineResizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries){
                entry.target.lineNum.style.minHeight = entry.contentRect.height + "px";
            }
        });*/


        //styles
        const style = document.createElement("style");

        
        style.textContent = /*css*/`
        :host {  }
        :host([hidden]) { display: none }

        .codebox {
            display: flex;
            flex-direction: column;
            font-family: monospace;
            counter-reset: lines-counter;
            position: relative;
            min-width: max-content;
            --counter-width: 1.5em;
            --vertical-padding: 0.5em;
            --line-margin: 0.5em;
            box-sizing: border-box;
            height: 100%;

            padding-top: var(--vertical-padding);
            padding-bottom: var(--vertical-padding);
        }

        .codebox::before {
            content: " ";
            display: block;
            position: absolute;
            left: 0px;
            top: 0px;
            width: var(--counter-width);
            height: 100%;
            padding-right: 4px;
            border-right: 2px solid #333;
            background-color: #ddd;

        }

           /** .codebox::after {
                content: " ) ";
                background-color: red;
                flex: 1;
            }**/

            .codebox:focus {
                outline: none;
            }
        
            .codebox>* {
                counter-increment: lines-counter;
        
                display: flex;
                flex-direction: row;
                justify-content: stretch;
                align-items: stretch;
                white-space: pre;
            }
                .codebox>*:hover {
                    background-color: rgba(127,127,127,0.1);
                }
            
            .codebox>*::before {
                content: counter(lines-counter);
        
                flex: 0;
                text-align: right;
                min-width: var(--counter-width);
                white-space: nowrap;
                margin-right: var(--line-margin);
                padding-right: 2px;
                position: sticky;
                color: black;
                text-decoration: none;
                left: 0px;
            }

            
            .codebox>*:hover::before {
                background-color: #ccc;
            }
        `;


        this.shadowRoot.append(style, this.rootContainer);

    }

    static get observedAttributes() { return ['contenteditable','code']; }


    connectedCallback() {
        this.#makeCodeBox(this.code);
    }

    disconnectedCallback() {
        console.log('Custom square element removed from page.');
    }
    
    adoptedCallback() {
        console.log('Custom square element moved to new page.');
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "contenteditable") {
            this.rootContainer.contentEditable = newValue;
        } else if (name === "code") {
            this.#makeCodeBox(newValue);
        }
    }
      
        /*let getSatisfyingElement = (elem, test) => {
            if (elem.nodeType != Node.ELEMENT_NODE) {
                elem = elem.parentElement;
            }
            while (!test(elem)) elem = elem.parentElement;
        }

        let splitNode = (node, pos) => {

        }


        

        console.log(event.inputType);
        if (event.inputType === "insertParagraph") {

            let sel = window.getSelection();
            sel.removeAllRanges();
            let ranges = event.getTargetRanges();

            for (let range of ranges) {


                

                if (range.collapsed) {
                    if (range.startOffset > 0) {
                        let node = range.startContainer;
                        let nnode = document.createTextNode(node.innerText.substring(0, range.startOffset));
                        node.innerText = node.innerText.substring(range.startOffset);
                        node.parentNode.insertBefore(nnode, node);

                        let nspan = document.createElement("span");

                        while (node != null) {
                            let next = node.nextSibling;
                            node.parentNode.removeChild(node);

                            ncontainer.appendChild(node);

                            node = next;
                        }

                        let nline

                    }
                } else {
                    if (range.startOffset > 0) {
                       
                    }
                }

                //insert newline at the end
                let endLine = getSatisfyingElement(range.endContainer, (elem) => elem.classList.contains("codebox-line"));
                let insertedLine = this.#insertLine("", endLine.nextSibling);

                let newrange = document.createRange();
                newrange.setStart(insertedLine, 0);
                sel.addRange(newrange);

                break;
            }
            event.preventDefault();
            
        }*/


    #insertLine(text, beforeLine) {

        const lineCode = document.createElement("div");
        //lineCode.classList.add("codebox-line");
        //lineCode.lineNum = num;
        lineCode.innerText = text;
        //num.lineCode = lineCode;

        // const span = document.createElement("span");
        // lineCode.appendChild(span);

        this.insertBefore(lineCode, beforeLine);
        //this.lineResizeObserver.observe(lineCode);
        return lineCode;
    }

    #makeCodeBox(code) {

        if (typeof(code) === "undefined") {code = "";}

        for (const line of code.split('\n')){
            
            const lineCode = document.createElement("div");
            lineCode.innerText = line;
            this.rootContainer.appendChild(lineCode);
        }
    }

    getCode() {
        return this.rootContainer.innerText;
    }

}



  