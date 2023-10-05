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
     * Creates new tag builder
     * @returns {TagBuilder}
     */
    tag(tagname, options) {
        return new TagBuilder(this.#doc.createElement(tagname, options));
    }

    /**
     * Creates new text node
     * @returns {TagBuilder}
     */
    text(text) {
        return this.#doc.createTextNode(text);
    }


    getBody() {
        return new TagBuilder(this.#doc.body);
    }

    getDocument() {
        return this.#doc;
    }

}





class TagBuilder {

    /**
     * @type {Element}
     */
    #tag = null;

    constructor(tag) {
        this.#tag = tag;
    }

    /**
     * Sets te id
     * @param {*} id 
     */
    id(id) {
        this.#tag.id = id;

        return this;
    }

    /**
     * Appends CSS className
     * @param {*} className 
     * @returns 
     */
    class(className) {
        this.#tag.classList.add(className);

        return this;
    }

    /**
     * Sets the classname
     * @param {*} className 
     * @returns 
     */
    className(className) {
        this.#tag.className = className;

        return this;
    }

    /**
     * Sets the given attribute
     * @param {string} name 
     * @param {*} value 
     */
    attr(name, value) {
        this.#tag.setAttribute(name, value);

        return this;
    }

    /**
     * Sets the innerHTML
     * @param {*} html 
     */
    innerHTML(html) {
        this.#tag.innerHTML = html;

        return this;
    }

    /**
     * Sets the innerText
     * @param {*} html 
     */
    innerText(text) {
        this.#tag.innerText = text;

        return this;
    }

    /**
     * Appends children to the end of element
     * @param {...Node} children 
     */
    children(...children) {

        forEveryTag(children, (child) => this.#tag.append(child));

        return this;
    }

    /**
     * Adds event listener to the tag
     * @param {Function} children 
     */
    event(name, listener, options) {

        this.#tag.addEventListener(name, listener, options);

        return this;
    }

    /**
     * Invokes arbitrary function on the tag
     * @param {Function} func 
     */
    invoke(func) {

        func(this.#tag);

        return this;
    }

     /**
     * Invokes arbitrary function for every child of the tag
     * @param {Function} func 
     */
    forEveryChild(func) {

        let child = this.#tag.firstChild;
        while (child != null) {
            func(child);
            child = child.nextSibling;
        }

        return this;
    }


    getTag() {
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