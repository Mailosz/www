export class AutoSizeIframe extends HTMLIFrameElement {

    constructor() {
        super();

        this.addEventListener("load", (event) => { 
            new ResizeObserver((entries) => {
                this.setSize();
            }).observe(this.contentDocument.body);
        });
    }

    setSize() {
        let bounds = this.contentDocument.documentElement.getBoundingClientRect();

        this.height = Math.ceil(bounds.height - bounds.y);
        this.width = Math.ceil(bounds.width - bounds.x);
    }
}

customElements.define("auto-size", AutoSizeIframe, {extends: "iframe"});