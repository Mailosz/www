import {OxControl} from "./OxControl.js";


const template = /*html*/`
    <div id="container">
        <div id="top-container">
            <div id="user-icon"></div>
            <slot name="header">Hi, please log in</slot>
        </div>
        <div id="input-container">
            <div class="message">Wrong login or password</div>
            <label for="login-input"><slot name="login-header">Login:</slot></label>
            <input id="login-input" type="text" autofocus>

            <label for="password-input"><slot name="login-header">Password:</slot></label>
            <input id="password-input" type="password">
        </div>
        <div id="footer">
        <div id="password-options">
            <div class="option"></div>
            <div class="option"></div>
            <div class="option"></div>
            <div class="option"></div>
            <div class="option"></div>
        </div>
            <button id="login-button"><slot name="login-button">Log in</slot></button>
        </div>
    </div>
`;

const style = /*css*/`
    * {
        box-sizing: border-box;
    }

    :host {
        display: flex;
        justify-content: stretch;
        flex-direction: column;
        flex: 1;
        background: linear-gradient(white, aliceblue);
    }

    #container {
        display: grid;
        height: 400px;
    }

    #top-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1em 1em 0 1em;
    }

    #user-icon {
        background: cornflowerblue;
        background: linear-gradient(#abf 0%, #89f 5%, #56c 100%);
        width: 100px;
        height: 100px;
        border-radius: 100%;
        box-shadow: 0 4px 10px rgba(127,127,127,0.5);
        position: relative;
        overflow: hidden;
    }

        #user-icon::before {
            content: ' ';
            position: absolute;
            background: #888;
            background: linear-gradient(#999, #888);
            left: 0%;
            top: 70%;
            width: 100%;
            height: 40%;
            border-radius: 100%;
        }

        #user-icon::after {
            content: ' ';
            position: absolute;
            background: #aaa;
            background: linear-gradient(#bbb, #aaa);
            left: 25%;
            top: 10%;
            width: 50%;
            height: 70%;
            border-radius: 100%;
        }

    #input-container {
        display: grid;
        flex-direction: row;
        align-items: center;
        justify-content: stretch;
        padding: 0 1em;
        gap: 0.5em;
        font-size: 20px;
    }

    #input-container input {
        grid-column: 2;
        border: 1px solid #666;
        padding: 0.25em 0.25em;
        min-width: 10px;
        font-size: 1em;
        
    }

    #login-input {
        
    }
    
    #password-input {

    }

    #footer {
        display: flex;
        flex-direction: column;
        justify-content: stretch;
        align-items: stretch;
    }

    #password-options {
        height: 64px;
        display: flex;
        padding: 10px;
        justify-content: center;
        gap: 0.5em;
    }

    #password-options>div {
        background-color: gray;
        aspect-ratio: 1 / 1;
        height: 100%;
    }

    #login-button {
        flex: 1;
        border: none;
        background: cornflowerblue;
        color: white;
        font-size: 24px;
    }

    button:hover {
        filter: brightness(1.1);
    }

    button:active {
        filter: brightness(0.9);
    }

    .message {
        visibility: hidden;
        grid-column: 1 / 3;
        text-align: center;
        border: 1px solid black;
        padding: 0.25em;
        margin: 0 -0.5em;
        font-size: 0.8em;
        background: linear-gradient(#d00, #a00);
        color: white;
        box-shadow: 4px 0 10px rgba(127,127,127,0.5);
    }

`;

export class OxLogin extends OxControl {

    static observedAttributes = [];

    constructor() {
        super();
        
        this.createShadowRoot(template, style, {"delegatesFocus": true});
        
        


    }

    connectedCallback() {
        super.connectedCallback();
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

}

window.customElements.define("ox-login", OxLogin);