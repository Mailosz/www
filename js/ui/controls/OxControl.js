export class OxControl extends HTMLElement {
    constructor() {
      super();
    }

    createShadowRoot(html, css) {
        const shadowRoot = this.attachShadow({ mode: "open"});
        if (html) {
            shadowRoot.innerHTML = html;
        }
    
    
        if (css) {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replaceSync(css);
        
            shadowRoot.adoptedStyleSheets.push(styleSheet);
        }
    }

    connectedCallback() {
        console.log("Custom element added to page.");
    }

    disconnectedCallback() {
        console.log("Custom element removed from page.");
    }

    adoptedCallback() {
        console.log("Custom element moved to new page.");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} has changed.`);
    }

}