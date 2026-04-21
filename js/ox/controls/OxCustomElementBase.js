import { signal } from "../util.js";

export class OxCustomElementBase extends HTMLElement {

    static registerCustomElement(tagName) {
        self.customElements.define(tagName, this);
    }

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

    attachShadowCss(css) {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(css);

        this.shadowRoot.adoptedStyleSheets.push(styleSheet);
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