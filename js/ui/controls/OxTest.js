import { OxCustomElementBase } from "./OxCustomElementBase.js";
import { Builder } from "../../utils/DocBuilder.js";

export class OxTest extends OxCustomElementBase {

    static observedAttributes = ["test", "memo", "other"];

    constructor() {
        super();    


        this.customAttributes.test.listen((value) => {
            console.log(`test changed to ${value}`);
        });

        this.customAttributes.memo.listen((value) => {
            console.log(`memo changed to ${value}`);
        }); 

        this.customAttributes.other.listen((value) => {
            console.log(`other changed to ${value}`);
        });
    }

    connectedCallback() {
        this.attachShadow({ mode: "open" });

        let builder = new Builder(this.shadowRoot.ownerDocument);

        this.shadowRoot.appendChild(
            builder.tag("div").children(
                builder.tag("input").bindAttribute("value", this.customAttributes.test).on("input", (event) => { this.setAttribute("other", event.target.value);}),
                builder.tag("input").bindAttribute("value", this.customAttributes.other),
                builder.tag("input").bindAttribute("value", this.customAttributes.memo)
            ).getElement());

    }

}

window.customElements.define("ox-test", OxTest);