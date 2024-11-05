import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <label id="input-panel">
        <input type="file" id="upload-input">
        <slot>Upload file</slot>
    </label>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        border: 1px gray dashed;
        min-width: 1em;
        min-height: 1em;
        cursor: pointer;
    }

    #upload-input {
        display: none;
    }

    #input-panel {
        cursor: pointer;
    }


`;

export class OxUpload extends OxControl {

    static observedAttributes = ["multiple"];

    constructor() {
        super();
        
        this.createShadowRoot(template, style);
        
        
        // const wrapper = this.shadowRoot.getElementById("control-wrapper");
        this.input = this.shadowRoot.getElementById("upload-input");


        this.ondragover = (event) => {
            this.classList.add("dragover");
            event.dataTransfer.dropEffect = "copy";
            event.preventDefault();
        }

        this.ondragleave = (event) => {
            this.classList.remove("dragover");
        }

        this.ondrop = (event) => {
            event.preventDefault();

            this.input.files = event.dataTransfer.files;
            [...event.dataTransfer.files].forEach( (file, i) => {
                this.uploadFile(file, "drop");
            });

            this.classList.remove("dragover");
        }

        this.input.oninput = (event) => {
            [...event.target.files].forEach( (file, i) => {
                this.uploadFile(file, "input");
            });
        }

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "multiple") {
            this.input.multiple = true;
        }
    }

    get multiple() {
        return this.input.multiple;
    }

    set multiple(value) {
        this.input.multiple = value;
    }

    get files() {
        return this.input.files;
    }

    set files(files) {
        this.input.files = files;
    }

    /**
     * 
     * @param {File} file 
     */
    uploadFile(file, how) {
        this.shadowRoot.host.dispatchEvent(new FileEvent("upload", file, how));
    }

}

class FileEvent extends Event {
    /**
     * 
     * @param {File} file 
     */
    constructor (name, file, how) {
        super(name)
        this.file = file;
        this.how = how;
    }

}

window.customElements.define("ox-upload", OxUpload);