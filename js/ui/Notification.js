import { UsefulUtils } from "../utils/UsefulUtils.js";
import {BaseElement} from "./BaseElement.js";

let style = /*CSS*/`
#notification-wrapper {
    margin: auto;
    display: flex;
    justify-content: stretch;

    /* max-width: var(--page-width); */
}

#notification-body {
    margin: 10px 0;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    max-height: 4.8em;
    line-height: 1.2;
    overflow: hidden;
    flex: 1;
}

.expanded #notification-body {
    max-height: initial;
}


#notification-wrapper>.notification-controls {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

#notification-wrapper>.notification-controls button {
    border: none;
    background: transparent;
    width: 2.4em;
    height: 2.4em;
    cursor: pointer;
}
    #notification-wrapper>.notification-controls button:hover {
        background: rgba(127,127,127,0.3)
    }
    #notification-wrapper>.notification-controls button:active {
        background: rgba(127,127,127,0.6)
    }

    
    #notification-close::before {
        content: '✕';
    }

    #notification-expand::before {
        content: '↓';
    }

    .expanded #notification-expand::before {
        content: '↑';
    }
`;

let template = /*HTML*/`
    <div id="notification-wrapper">
        <div id="notification-body">
            <slot id="content-slot">
                <!-- Notification's content -->
            </slot>
        </div>
        <div class="notification-controls">
            <button id="notification-close"></button>
            <button id="notification-expand"></button>
        </div>
    </div>
`;


export class Notification extends BaseElement {

    constructor() {
        super();

        const shadowRoot = this.attachShadow({ mode: "open",  });
        shadowRoot.innerHTML = template;


        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(style);

        shadowRoot.adoptedStyleSheets.push(styleSheet);

        this.shadowRoot.getElementById("notification-close").onclick = (event) => this.closeNotification();
        this.shadowRoot.getElementById("notification-expand").onclick = (event) => this.expandNotification();

        this.shadowRoot.getElementById("content-slot").onslotchange = (event) => this.mainSlotChange(event);

        this.resizeObserver = new ResizeObserver(this.resize.bind(this));
        this.resizeObserver.observe(this.shadowRoot.getElementById("notification-body"));
    }

    mainSlotChange(event) {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "closeable") {
            if (newValue == true) {
                this.shadowRoot.getElementById("notification-close").style.visibility = "visible";
            } else {
                this.shadowRoot.getElementById("notification-close").style.visibility = "hidden";
            }
        }
    }

    closeNotification() {
        UsefulUtils.removeElementAfterAllAnimations(this);
    }

    expandNotification() {
        this.shadowRoot.firstElementChild.classList.toggle("expanded");
    }

    resize(entries, observer) {

        const body = this.shadowRoot.getElementById("notification-body");
        if (body.scrollHeight > body.clientHeight) {
            this.shadowRoot.getElementById("notification-expand").style.visibility = "visible";
        } else {
            this.shadowRoot.getElementById("notification-expand").style.visibility = "hidden";
        }

        // const height = body.clientHeight;

        // for (const entry of entries) {
        //     if (entry.contentBoxSize[0].blockSize > height) {
        //         this.shadowRoot.getElementById("notification-expand").style.visibility = "hidden";
        //     } else {
                
        //     }
        // }
    }

}

customElements.define("ui-notification", Notification);