let doc = window.document;
let last = null;
export class Builder {

    /**
     * @returns {TagBuilder} Returns last created tag builder
     */
    get last() {
        return last;
    }

    /**
     * Change the currently used document or reset it to window.document (if null is passed)
     * @param {Document?} document 
     */
    static set(document) {
        doc = document ?? window.document;
    }

    /**
     * Creates new tag builder
     * @returns {TagBuilder}
     */
    static tag(tagname, options) {
        last = new TagBuilder(doc.createElement(tagname, options));
        return last;
    }

    /**
     * Creates new text node
     * @returns {Text}
     */
    static text(text) {
        return doc.createTextNode(text);
    }

    /**
     * Creates new DIV tag builder
     * Shortcut for .tag("div")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    static div(options) {
        return Builder.tag("div", options);
    }

    /**
     * Creates new SPAN tag builder
     * Shortcut for .tag("span")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    static span(options) {
        return Builder.tag("span", options);
    }

    /**
     * Creates new BUTTON tag builder
     * Shortcut for .tag("button")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    static button(options) {
        return Builder.tag("button", options);
    }

    /**
     * Creates new INPUT tag builder
     * Shortcut for .tag("input")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    static input(options) {
        return Builder.tag("input", options);
    }

    /**
     * Creates new A tag builder
     * Shortcut for .tag("a")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    static a(options) {
        return Builder.tag("a", options);
    }
}


export class DocBuilder {

    /**
     * @type {Document} 
     */
    #doc = null;

    /**
     * 
     * @param {Document} document 
     */
    constructor(doc) {
        if (doc == null) {
            doc = window.document;
        }
        this.#doc = doc;
    }

    /**
     * Creates new DocBuilder
     * @param {Document?} document 
     */
    static new(document) {
        return new DocBuilder(document);
    }

    /**
     * Creates new tag builder
     * @returns {TagBuilder}
     */
    tag(tagname, options) {
        return new TagBuilder(this.#doc.createElement(tagname, options));
    }

    /**
     * Creates new text node
     * @returns {Text}
     */
    text(text) {
        return this.#doc.createTextNode(text);
    }

    /**
     * Creates new DIV tag builder
     * Shortcut for .tag("div")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    div(options) {
        return this.tag("div", options);
    }

    /**
     * Creates new SPAN tag builder
     * Shortcut for .tag("span")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    span(options) {
        return this.tag("span", options);
    }

    /**
     * Creates new BUTTON tag builder
     * Shortcut for .tag("button")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    button(options) {
        return this.tag("button", options);
    }

    /**
     * Creates new INPUT tag builder
     * Shortcut for .tag("input")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    input(options) {
        return this.tag("input", options);
    }

    /**
     * Creates new A tag builder
     * Shortcut for .tag("a")
     * @param {ElementCreationOptions?} options document.createElement(name, options) options
     * @returns 
     */
    a(options) {
        return this.tag("a", options);
    }



    getBody() {
        return new TagBuilder(this.#doc.body);
    }

    getDocument() {
        return this.#doc;
    }

}





export class TagBuilder {

    /**
     * @type {Element}
     */
    #tag = null;

    constructor(tag) {
        this.#tag = tag;
    }

    /**
     * Sets the tag's id
     * @param {string} id 
     * @returns {TagBuilder} itself
     */
    id(id) {
        this.#tag.id = id;

        return this;
    }

    /**
     * Appends CSS class name(s)
     * @param {...string} classNames 
     * @returns {TagBuilder} itself
     */
    class(...classNames) {
        this.#tag.classList.add(...classNames);

        return this;
    }

    /**
     * Sets the classname
     * @param {string} className 
     * @returns {TagBuilder} itself
     */
    className(className) {
        this.#tag.className = className;

        return this;
    }

    /**
     * Sets the given attribute
     * @param {string} name 
     * @param {string} value 
     * @returns {TagBuilder} itself
     */
    attr(name, value) {
        this.#tag.setAttribute(name, value);
        return this;
    }

    /**
     * Sets the style attribute
     * 
     * @param {string|object} style Properties to set
     * @returns {TagBuilder} itself
     */
    style(style) {
        if (typeof(style) == "string") {
            this.#tag.setAttribute("style", style);
        } else if (typeof(style) == "object") {

            for (const property in style) {
                this.#tag.style.setProperty(property, style[property]);
            }
        } else {
            throw "Wrong type of argument 'style'";
        }

        return this;
    }

    /**
     * Sets the value attribute
     * @param {string} value 
     * @returns {TagBuilder} itself
     */
    value(value) {
        this.#tag.setAttribute("value", value);
        return this;
    }

    /**
     * Sets the name attribute
     * @param {string} name 
     * @returns {TagBuilder} itself
     */
    name(name) {
        this.#tag.setAttribute("name", name);
        return this;
    }

    /**
     * Sets the innerHTML
     * @param {*} html 
     * @returns {TagBuilder} itself
     */
    innerHTML(html) {
        this.#tag.innerHTML = html;
        return this;
    }

    /**
     * Sets the innerText
     * @param {*} html 
     * @returns {TagBuilder} itself
     */
    innerText(text) {
        this.#tag.innerText = text;
        return this;
    }

    /**
     * Sets the textContent
     * @param {*} html 
     * @returns {TagBuilder} itself
     */
    textContent(text) {
        this.#tag.textContent = text;
        return this;
    }

    /**
     * Appends children to the end of element
     * @param {...Node} children 
     * @returns {TagBuilder} itself
     */
    children(...children) {

        forEveryTag(children, (child) => this.#tag.append(child));

        return this;
    }

    /**
     * Adds event listener to the tag
     * @param {Function} children 
     * @returns {TagBuilder} itself
     */
    event(name, listener, options) {

        this.#tag.addEventListener(name, listener, options);

        return this;
    }

    /**
     * Invokes arbitrary function on the tag
     * @param {Function} func  funtion to invoke taking one parameter: the element itself
     * @returns {TagBuilder}
     */
    invoke(func) {

        func(this.#tag);

        return this;
    }

    /**
     * Invokes arbitrary function on the tag (alias for "invoke")
     * @param {Function} func  funtion to invoke taking one parameter: the element itself
     * @returns {TagBuilder}
     */
    forThis(func) {
        func(this.#tag);
        return this;
    }

    /**
     * Invokes arbitrary function on the tag conditionally (alias for "invoke")
     * @param {boolean} condition  the condition
     * @param {Function} thenFunction  funtion to invoke when the condition is true, takes one parameter: the tag builder itself
     * @param {Function} elseFunction  funtion to invoke when the condition is false, takes one parameter: the tag builder itself
     * @returns {TagBuilder}
     */
    if(condition,thenFunction,elseFunction) {
        if (condition) {
            thenFunction(this);
        } else {
            elseFunction(this);
        }
        return this;
    }

     /**
     * Invokes arbitrary function for every child of the tag
     * @param {Function} func  funtion to invoke taking one parameter: the element itself
     * @returns {TagBuilder} itself
     */
    forEveryChild(func) {

        let child = this.#tag.firstChild;
        while (child != null) {
            func(child);
            child = child.nextSibling;
        }

        return this;
    }

    /**
     * Get the built HTML element
     * @type {Element}
     */
    getTag() {
        return this.#tag;
    }
    /**
     * Get the built HTML element
     * @type {Element}
     */
    get() {
        return this.#tag;
    }
    /**
     * Get the built HTML element
     * @type {Element}
     */
    getElement() {
        return this.#tag;
    }

    /**
     * Get the built HTML element
     * @type {Element}
     */
    get tag() {
        return this.#tag;
    }

    /**
     * Get the built HTML element
     * @type {Element}
     */
    get element() {
        return this.#tag;
    }
}

/**
 * Executes function for every tag; if tag is a tagbuilder then it builds it (executes getTag)
 * @param {*} tags 
 * @param {*} func 
 */
function forEveryTag(tags, func) {
    for (const tag of tags) {
        let elem = null;
        if (tag instanceof TagBuilder) {
            elem = tag.getTag();
        } else {
            elem = tag;
        }
        func(elem);
    }
}