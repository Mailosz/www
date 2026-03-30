import { signal } from "../../utils/Reactive.js";

export class OxCustomElementBase extends HTMLElement {

    static customAttributes = {};

    constructor() {
      super();

      let self = this;
      this.customAttributes = {};
      while (self) {

        if ("observedAttributes" in self.constructor) {
            for (let attr of self.constructor.observedAttributes) {
                this.customAttributes[attr] = signal();
            }
        }

        self = Object.getPrototypeOf(self);
      }


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
        if (name in this.customAttributes) {
            if (oldValue !== newValue) {
                this.customAttributes[name].set(newValue);
            }
        }
    }

}