export class LoremIpsum extends HTMLElement {

    /**
     * Register this element to use
     * @param {*} tagName optional tag name (defaults to "lorem ipsum")
     */
    static registerCustomElement(tagName) {

        if (!tagName) {
            tagName = "lorem-ipsum";
        }

        customElements.define(tagName, LoremIpsum);
    }


    constructor() {
        super();
    
        this.attachShadow({ mode: "open" });

        this.wrapper = document.createElement("div");
        this.wrapper.innerText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vel leo sed tellus feugiat sodales sit amet a arcu. Praesent porta diam ac congue tincidunt. Suspendisse potenti. Sed orci augue, euismod non ligula eu, interdum porta sem. Vestibulum nibh metus, mollis at dignissim sit amet, elementum id massa. Suspendisse varius ligula vitae magna sagittis sodales. Nulla consectetur eu elit fringilla volutpat. Etiam dictum congue magna, quis gravida nisi rutrum et. Maecenas molestie, urna at venenatis gravida, mi urna iaculis eros, quis faucibus risus magna ut sem. Duis accumsan mollis dolor at euismod. Aenean vulputate ullamcorper facilisis. Donec eget risus purus. Cras laoreet rutrum fringilla.";


        this.shadowRoot.append(this.wrapper);
        
      }
}