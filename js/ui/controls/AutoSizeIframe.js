
export class AutoSizeIframe extends HTMLIFrameElement {


    constructor() {
        super();

        this.addEventListener("load", (event) => {
            new ResizeObserver((entries) => {
                this.height = this.contentDocument.documentElement.scrollHeight;
                this.width = this.contentDocument.documentElement.scrollWidth;
            }).observe(this.contentDocument.body);
        });
    }
    
    connectedCallback() {

    }


}



customElements.define("auto-size", AutoSizeIframe, {extends: "iframe"});