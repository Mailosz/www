import { signal } from "./Reactive.js";

export class Builder {

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
     * Invokes arbitrary function on the builder
     * @param {Function(Builder)} func 
     * @returns {Builder} itself
     */
    with(func) {
        func(this);
        return this;
    }

    /**
     * Creates new Builder
     * @param {Document?} document 
     */
    static new(document) {
        return new Builder(document);
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

    /**
     * Appends children to the end of the document
     * @param  {...TagBuilder|Node} children 
     * @returns {Builder} itself
     */
    children(...children) {
        forEveryTag(children, (child) => {
            if (child.getElement) {
                this.#doc.body.appendChild(child.getElement());
            } else {
                this.#doc.body.appendChild(child);
            }
        }); 
        return this;
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
        if (typeof(style) === "string") {
            this.#tag.setAttribute("style", style);
        } else if (typeof(style) === "object") {

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
     * @param {string} html 
     * @returns {TagBuilder} itself
     */
    innerHTML(html) {
        this.#tag.innerHTML = html;
        return this;
    }

    /**
     * Sets the innerText
     * @param {string} text 
     * @returns {TagBuilder} itself
     */
    innerText(text) {
        this.#tag.innerText = text;
        return this;
    }

    /**
     * Sets the textContent
     * @param {string} text 
     * @returns {TagBuilder} itself
     */
    textContent(text) {
        this.#tag.textContent = text;
        return this;
    }

    /**
     * Appends children to the end of element
     * @param {...TagBuilder|Node} children 
     * @returns {TagBuilder} itself
     */
    children(...children) {
        forEveryTag(children, (child) => {
            if (child.getElement) {
                this.#tag.append(child.getElement());
            } else {
                this.#tag.append(child);
            }
        });

        return this;
    }

    /**
     * Adds event listener to the tag
     * @param {Function} children 
     * @returns {TagBuilder} itself
     */
    on(name, listener, options) {
        this.#tag.addEventListener(name, listener, options);
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
    edit(func) {

        func(this.#tag);

        return this;
    }

    /**
     * Invokes arbitrary function on the tag (alias for "edit")
     * @param {Function} func  funtion to invoke taking one parameter: the element itself
     * @returns {TagBuilder}
     */
    forThis(func) {
        func(this.#tag);
        return this;
    }

    /**
     * Invokes arbitrary function on the tag conditionally (alias for "edit")
     * @param {boolean} condition  the condition
     * @param {Function} thenFunction  funtion to invoke when the condition is true, takes one parameter: the tag builder itself
     * @param {Function} elseFunction  funtion to invoke when the condition is false, takes one parameter: the tag builder itself
     * @returns {TagBuilder}
     */
    if(condition, thenFunction, elseFunction) {
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
     * Sets a property of the tag
     * @param {string} name 
     * @param {any} value 
     * @returns {TagBuilder} itself
     */
    property(name, value) {
        this.#tag[name] = value;
        return this;
    }

    /**
     * Binds a signal to the property of the tag one way. Whenever the signal changes, the property will be updated with the signal's value
     * @param {string} property the name of the property to bind
     * @param {Function} signal the signal to bind
     * @return {TagBuilder} itself
     */
    bindProperty(property, signal, options = { toProperty: true, toSignal: true }) {
        let desc = this.#tag;
        while (desc && !Object.getOwnPropertyDescriptor(desc, property)) {
            desc = Object.getPrototypeOf(desc);
        }
        desc = desc && Object.getOwnPropertyDescriptor(desc, property);

        if (!desc) {
            throw new Error(`Property "${property}" not found`);
        }

        if (options.toSignal) {
            let internalValue = desc.value;
            Object.defineProperty(this.#tag, property, {
                get: desc.get ? desc.get : function () {
                    return internalValue;
                },
                set: desc.set ? function (value) {
                    desc.set.call(this, value);
                    signal.set(value);
                } : function (value) {
                    internalValue = value;
                    signal.set(value);
                }
            });
        }


        signal.listen(value => {
            if (options.toProperty) {
                if (desc.set) {
                    desc.set.call(this.#tag, value);
                } else {
                    internalValue = value;
                }
            }
        });

        return this;
    }

    observer = undefined;
    observedAttributes = {};

    /**
     * Binds a signal to the attributeof the tag two way. Whenever the signal changes, the attribute will be updated with the signal's value
     * @param {string} attribute the name of the attribute to bind
     * @param {Function} signal the signal to bind
     * @return {TagBuilder} itself
     */
    bindAttribute(attribute, signal, options = { toProperty: true, toSignal: true }) {

        if (!this.observer) {
            this.observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type === "attributes") {
                        const attrFunc = this.observedAttributes[mutation.attributeName];
                        if (attrFunc) {
                            let value = mutation.target.getAttribute(mutation.attributeName);
                            attrFunc(value);
                        }
                    }
                }            
            });
            this.observer.observe(this.#tag, { attributes: true });
        }

        let attrFunc = function(value) {
            signal.set(value);
        }

        this.observedAttributes[attribute] = attrFunc;

        
        signal.listen(value => {
            this.observedAttributes[attribute] = null;
            this.observer.disconnect();
            this.#tag.setAttribute(attribute, value);
            this.observer.observe(this.#tag, { attributes: true });
            this.observedAttributes[attribute] = attrFunc;
        });
        return this;
    }

    /**
     * Get the built HTML element
     * @type {Element}
     */
    done() {
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
        if (tag.getElement) {
            elem = tag.getElement();
        } else {
            elem = tag;
        }
        func(elem);
    }
}