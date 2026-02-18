export class AutoSizeIframe extends HTMLIFrameElement {

    constructor() {
        super();

        this.addEventListener("load", (event) => { 
            new ResizeObserver((entries) => {
                this.setSize();
            }).observe(this.contentDocument.documentElement);
        });
    }

    setSize() {
        let bounds = this.contentDocument.documentElement.getBoundingClientRect();

        const scrollbarWidth = this.contentWindow.innerWidth - this.contentWindow.document.documentElement.clientWidth;
        const scrollbarHeight = this.contentWindow.innerHeight - this.contentWindow.document.documentElement.clientHeight;
        this.height = Math.ceil(bounds.height + scrollbarHeight);
        this.width = Math.ceil(bounds.width + scrollbarWidth);
    }
}

customElements.define("auto-size", AutoSizeIframe, {extends: "iframe"});