export class OxControl extends HTMLElement {
    constructor() {
      super();
    }

    /**
     * 
     * @param {String} html 
     * @param {String} css 
     * @param {ShadowRootInit} options 
     */
    createShadowRoot(html, css, options) {
        options = {...{ mode: "open"}, ...options};

        const shadowRoot = this.attachShadow(options);
        if (html) {
            shadowRoot.innerHTML = html;
        }
    
    
        if (css) {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replaceSync(css);
        
            shadowRoot.adoptedStyleSheets.push(styleSheet);
        }
        return shadowRoot;
    }

    connectedCallback() {
        console.log(`Custom element added (${this.constructor.name})`);
    }

    disconnectedCallback() {
        console.log(`Custom element removed (${this.constructor.name})`);
    }

    adoptedCallback() {
        console.log(`Custom element moved to new document (${this.constructor.name})`);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} has changed from "${oldValue}" to "${newValue}".`);
    }

}