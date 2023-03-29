export class PopupMenu {
    #pointerOverTimeout = null;
    /**
     * 
     * @param {*} items List of menu items
     * @param {*} options 
     */
    constructor(items, options) {
        this.items = items;

        let defaultOptions = {
            menuClassName: "popup-menu",
            backdropClassName: "popup-menu-backdrop",
            pointerOverTimeout: 500
        }

        // no need to check for nulls
        this.options = {...defaultOptions, ...options};
        // this.aa = 0; //debug
        this.fosuoutDismissAllowed = true;
        this.radiogroups = {}
    }

    #repositionIfOverflows(element, x, y) {

        if (element.offsetLeft + element.offsetWidth > this.backdrop.offsetWidth) {
            element.style.left = Math.max(0, x - element.offsetWidth) + "px";
        }

        if (element.offsetTop + element.offsetHeight > this.backdrop.offsetHeight) {
            element.style.top = Math.max(0, y - element.offsetHeight) + "px";
        }
    }

    #closeOtherSubmenus(parentMenu) {

        let menus = this.backdrop.getElementsByClassName(this.options.menuClassName);

        for (let i = 0; i < menus.length; ) {
            let menu = menus.item(i);
            let parent = parentMenu;
            while (true) {
                if (menu == parent) {
                    i++;
                    break;
                }
                parent = parent.parentMenu;
                if (parent == null) {

                    // extracting focus out of the closed menu
                    if (menu.contains(document.activeElement)){
                        let pm = menu.parentMenu
                        while (pm != null) {
                            if (this.backdrop.contains(pm)){
                                pm.focus();
                                break;
                            }
                            pm = pm.parentMenu;
                        }
                    } 

                    this.backdrop.removeChild(menu);
                    break;
                }
            }
        }

    }

    #elementOrAnyParent(element, test) {
        let parent = element;
        while (parent != null) {
            if (test(parent)) {
                return true;
            } else {
                parent = parent.parentElement;
            }
        }
        return false;
    }

    #updateCheckedIndicator(element, checked) {

        const icons = element.getElementsByClassName("popup-menu-icon");
        for (const icon of icons) {
            if (checked) {
                icon.classList.add("checked");
            } else {
                icon.classList.remove("checked");
            }
        }
    }

    #elementClick(element, item, event) {

        //clear timeout
        if (this.#pointerOverTimeout != null) {
            clearTimeout(this.#pointerOverTimeout);
            this.#pointerOverTimeout = null;
        }

        if (!item.disabled) {
            if (item.type == "checkbox") {
                item.checked = !item.checked;

                if (item.radiogroup != null) {
                    for (let radio of this.radiogroups[item.radiogroup]) {
                        if (radio != element) {
                            radio.item.checked = false;
                            this.#updateCheckedIndicator(radio, radio.item.checked);
                        }
                    }
                }

                this.#updateCheckedIndicator(element, item.checked);
            }

            if (item.command != null) {
                try{
                    item.command();
                } catch (ex) {
                    console.log("Error on command execution in context menu");
                    console.error(ex);
                }
            } else {
                console.log("No command");
            }
            if (!item.keepOpen) {
                this.hide();
            }
        }
    }

    /**
     * 
     * @param {HTMLElement} element 
     * @param {*} item 
     * @param {PointerEvent} event 
     */
    #pointerOverElement(element, item, cm, event) {

        //clear timeout
        if (this.#pointerOverTimeout != null) {
            clearTimeout(this.#pointerOverTimeout);
            this.#pointerOverTimeout = null;
        }

        this.#pointerOverTimeout = setTimeout(() => {
            if (item.submenu != null) {
                element.click();
            } else {
                this.#closeOtherSubmenus(cm);
            }
        }, this.options.pointerOverTimeout);
    }

    /**
     * Constructs menu
     * @param {*} items 
     */
    #constructMenu(items) {
        let cm = document.createElement("div");
        cm.tabIndex = 0;
        cm.classList.add(this.options.menuClassName);
        // cm.aaa = this.aa++;

        let readIcon = (item) => {

            if (item.icon != null) {
                let img = document.createElement("img");
                img.src = item.icon;
                return img;
            }
            return null;

        }

        for (let item of items) {
            if (item === "separator" || item.type == "separator") {
                let separator = document.createElement("div");
                separator.classList.add("popup-menu-separator");
                cm.appendChild(separator);
            } else if (Array.isArray(item)) { 
                // list
                let list = document.createElement("div");
                list.classList.add("popup-menu-list");
                list.item = item; //binding
                list.tabIndex = 0;
                list.addEventListener('pointerover', (event) => this.#pointerOverElement(list, item, cm, event));

                for (let listitem of item) {
                    let element = document.createElement("div");
                    element.classList.add("popup-menu-element");
                    element.item = listitem; //binding
                    element.tabIndex = 0;
                    
                    if (listitem.icon != null) {
                        let icon = readIcon(listitem);
                        element.appendChild(icon);
                    } else {
                        element.innerHTML = listitem.content;
                    }

                    if (listitem.tooltip) {
                        element.title = listitem.tooltip;
                    } else if (listitem.label) {
                        element.title = listitem.label;
                    }

                    if (listitem.disabled) {
                        element.classList.add("disabled");
                    }

                    element.addEventListener("click", (event) => this.#elementClick(element, listitem, event));

                    list.appendChild(element);
                }
                cm.appendChild(list);

            } else { // menuitem
                let element = document.createElement("div");
                element.classList.add("popup-menu-element");
                element.item = item; //binding
                element.tabIndex = 0;
                element.addEventListener('pointerover', (event) => this.#pointerOverElement(element, item, cm, event));
                
                
                let icon = document.createElement("div");
                icon.classList.add("popup-menu-icon");

                let img = readIcon(item);
                if (img != null) {
                    icon.appendChild(img);
                }
                element.appendChild(icon);

                if (item.checked != null || item.type == "checkbox") {
                    item.type = "checkbox"; // if "checked" parameter is present the element automatically is considered checkbox
                    //let checkbox = document.createElement("div");
                    //checkbox.classList.add("popup-menu-icon");
                    if (item.checked) {
                        icon.classList.add("checked")
                    } 
                    //element.appendChild(checkbox);
                } 

                if (item.radiogroup != null) {
                    item.type = "checkbox"; // if "radiogroup" parameter is present the element automatically is considered checkbox
                    if (this.radiogroups[item.radiogroup] == null) {
                        this.radiogroups[item.radiogroup] = [];
                    }
                    this.radiogroups[item.radiogroup].push(element);
                }

                if (item.content) {
                    let content = document.createElement("div");
                    content.classList.add("popup-menu-content");
                    content.innerHTML = item.content;
                    element.appendChild(content);
                } else {
                    let content = document.createElement("div");
                    content.classList.add("popup-menu-content");
                    if (item.label) content.innerText = item.label;
                    element.appendChild(content);
                }

                if (item.shortcut) {
                    let shortcut = document.createElement("div");
                    shortcut.classList.add("popup-menu-shortcut");
                    shortcut.innerText = item.shortcut;
                    element.appendChild(shortcut);
                }

                if (item.tooltip) {
                    element.title = item.tooltip;
                }

                if (item.disabled) {
                    element.classList.add("disabled");
                }


                if (item.submenu && item.submenu.length > 0) { // submenu
                    let chevron = document.createElement("div");
                    chevron.classList.add("popup-menu-submenu");

                    element.addEventListener("click", (event) => {

                        if (!item.disabled){

                            // check if the submenu isn't already opened
                            let menus = this.backdrop.getElementsByClassName(this.options.menuClassName);
                            for (let menu of menus) {
                                if (menu.parentItem == element) {
                                    // this means that the submenu is already opened - do nothing
                                    return;
                                }
                            }

                            this.#closeOtherSubmenus(cm);
                            
                            let submenu = this.#constructMenu(item.submenu);
                            submenu.style.position = "absolute";

                            let x = (cm.offsetLeft + element.offsetLeft + element.offsetWidth);
                            let y = (cm.offsetTop + element.offsetTop - cm.scrollTop);
                            submenu.style.top = y + "px";
                            submenu.style.left = x + "px";

                            submenu.parentItem = element;
                            submenu.parentMenu = cm;
                            this.backdrop.appendChild(submenu);

                            this.#repositionIfOverflows(submenu, x - cm.offsetWidth, y + element.offsetHeight);

                            setTimeout(()=>submenu.focus(), 1); //without timeout focus doesn't work
                        }
                    });

                    element.appendChild(chevron);
                } else {
                    element.addEventListener("click", (event) => this.#elementClick(element, item, event));
                }

                cm.appendChild(element);
            } 
        }

        return cm;
    }

    /**
     * 
     * @param {KeyboardEvent} event 
     */
    #keydown(event) {
        let activeElement = document.activeElement;

        if (activeElement == null) {
            activeElement = this.popupMenu;
        } else { //checking if activeElement is out of the context menu scope
            let parent = activeElement.parentElement;
            while (true) {
                if (parent == this.backdrop) {
                    break;
                } 
                if (parent == null) {
                    activeElement = this.popupMenu;
                }
                parent = parent.parentElement;
            }
        }

        switch (event.key){
            case "ArrowDown":
                event.preventDefault();
                if (activeElement.classList.contains(this.options.menuClassName)) {
                    activeElement = activeElement.querySelector(".popup-menu-element");
                } else {
                    if (activeElement.parentElement.classList.contains("popup-menu-list")) {
                        activeElement = activeElement.parentElement;
                    } else {
                        activeElement = activeElement;
                    }
                    let next = activeElement;
                    let counter = activeElement.parentElement.childElementCount;
                    do {
                        next = next.nextSibling;
                        if (next == null) {
                            next = activeElement.parentElement.firstElementChild;
                        }
                        if (next.classList.contains("popup-menu-list")) { // this is a list - select first element
                            next = next.querySelector(".popup-menu-element")
                            break;
                        }
                    } while ((counter--) > 0 && (!next.classList.contains("popup-menu-element") || next.classList.contains("disabled")));
                    activeElement = next;
                }
                if (activeElement != null) activeElement.focus();
                break;
            case "ArrowUp":
                event.preventDefault();
                if (activeElement.classList.contains(this.options.menuClassName)) {
                    activeElement = activeElement.querySelector(".popup-menu-element");
                } 
                // no else here to overflow
                if (activeElement.parentElement.classList.contains("popup-menu-list")) {
                    activeElement = activeElement.parentElement;
                } else {
                    activeElement = activeElement;
                }
                let prev = activeElement;
                let counter = activeElement.parentElement.childElementCount;
                do {
                    prev = prev.previousSibling;
                    if (prev == null) {
                        prev = activeElement.parentElement.lastElementChild;
                    }
                    if (prev.classList.contains("popup-menu-list")) { // this is a list - select first element
                        prev = prev.querySelector(".popup-menu-element")
                        break;
                    }
                } while ((counter--) > 0 && (!prev.classList.contains("popup-menu-element") || prev.classList.contains("disabled")));
                activeElement = prev;

                if (activeElement != null) activeElement.focus();
                break;
            case "ArrowLeft":
                event.preventDefault();
                if (activeElement.classList.contains(this.options.menuClassName)) {
                    activeElement = activeElement.querySelector(".popup-menu-element");
                }
                if (activeElement.parentElement.classList.contains("popup-menu-list")) {
                    let prev = activeElement;
                    let counter = activeElement.parentElement.childElementCount;
                    do {
                        prev = prev.previousSibling;
                        if (prev == null) {
                            if (activeElement.parentElement.parentElement.parentMenu != null) {
                                activeElement.parentElement.parentElement.parentItem.focus();
                                this.backdrop.removeChild(activeElement.parentElement.parentElement);
                                break;
                            } else {
                                prev = activeElement.parentElement.lastElementChild;
                            }
                        }
                    } while ((counter--) > 0 && (!prev.classList.contains("popup-menu-element") || prev.classList.contains("disabled")));
                    activeElement = prev;
                    if (activeElement != null) activeElement.focus();
                } else if (activeElement.parentElement.parentMenu != null) {
                    activeElement.parentElement.parentItem.focus();
                    this.backdrop.removeChild(activeElement.parentElement);
                }
                break;
            case "ArrowRight":
                event.preventDefault();
                if (activeElement.classList.contains(this.options.menuClassName)) {
                    activeElement = activeElement.querySelector(".popup-menu-element");
                    activeElement.focus();
                } else {
                    if (activeElement.parentElement.classList.contains("popup-menu-list")) {
                        let next = activeElement;
                        let counter = activeElement.parentElement.childElementCount;
                        do {
                            next = next.nextSibling;
                            if (next == null) {
                                next = activeElement.parentElement.firstElementChild;
                            }
                        } while ((counter--) > 0 && (!next.classList.contains("popup-menu-element") || next.classList.contains("disabled")));
                        activeElement = next;
                        activeElement.focus();

                        break;
                    } 
                } 

                if (activeElement.item != null && activeElement.item.submenu != null) {
                    activeElement.click();
                }
                break;
            case "Escape":
                if (this.#elementOrAnyParent(activeElement, (el) => el == this.popupMenu)) {
                    this.hide();
                } else {
                    this.#elementOrAnyParent(activeElement, (el) => {
                        if (el.parentMenu != null) {
                            el.parentItem.focus();
                            this.backdrop.removeChild(el);

                            return true;
                        } else {
                            return false;
                        }
                    });
                } 
                break;
            case "Enter":
                activeElement.click();
                break;
            case "F9":
                this.fosuoutDismissAllowed = !this.fosuoutDismissAllowed;
                console.log("fosuoutDismissAllowed: " + this.fosuoutDismissAllowed);
            default:
                // search
                /*if (this.searchinput == null) {
                    this.searchinput = document.createElement("input");
                    this.searchinput.type = "text";
                    this.searchinput.classList.add("popup-menu-search");
                    if (this.popupMenu.firstChild == null) {
                        this.popupMenu.appendChild(this.searchinput);
                    } else {
                        this.popupMenu.insertBefore(this.searchinput, this.popupMenu.firstChild);
                    }
                    
                    this.searchinput.oninput = (event) => {
                        if (this.searchinput.value == "") {
                            this.popupMenu.removeChild(this.searchinput);
                            this.searchinput = null;
                        }
                    }
                    
                }
                this.searchinput.focus();*/
                console.log(event.key);
                break;
        }
    }


    /**
     * Opens the popupmenu at specified location
     * @param {MouseEvent|Number} x Horizontal position or a MouseEvent
     * @param {Number} [y] Vertical position
     */
    show(x,y) {

        if (x instanceof MouseEvent) { /** autoplacement */
            y = x.pageY;
            x = x.pageX;
        }

        this.backdrop = document.createElement("div");
        this.backdrop.classList.add(this.options.backdropClassName);
        this.backdrop.addEventListener("contextmenu", (event)=> event.preventDefault());
        this.backdrop.addEventListener("pointerdown", (event)=> {
            if (event.target == this.backdrop) {
                event.preventDefault();
                this.hide();
            }
        });
        this.backdrop.addEventListener("focusout", (event) => { // auto closing context menu when focus moves somewhere else
            if (event.relatedTarget == null || !this.#elementOrAnyParent(event.relatedTarget, (el) => el == this.backdrop)) {
                if (this.fosuoutDismissAllowed)
                    this.hide();
            }
        });
        this.backdrop.tabIndex = -1;
        this.backdrop.addEventListener("keydown", this.#keydown.bind(this));



        //create the menu with items
        this.popupMenu = this.#constructMenu(this.items);

        this.popupMenu.style.position = "fixed";
        this.popupMenu.style.top = y + "px";
        this.popupMenu.style.left = x + "px";


        
        this.backdrop.appendChild(this.popupMenu);
        document.body.appendChild(this.backdrop);
        this.popupMenu.focus({"focusVisible": false});

        // repositioning if exceeds space
        this.#repositionIfOverflows(this.popupMenu, x, y)
    }

    hide() {
        this.backdrop.style.pointerEvents = "none";

        this.backdrop.onanimationend = (event) => {
            document.body.removeChild(this.backdrop);
        }
        this.backdrop.classList.add("hiding");
    }
}