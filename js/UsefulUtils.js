export class UsefulUtils {

    static removeElementAfterAllAnimations(element) {

        Promise.all(element.getAnimations().map((animation) => animation.finished)).then(()=>{
            if (element.parentNode != null) {
                element.parentNode.removeChild(element);
            }
        }).catch((reason) => {
            console.log(reason);
            if (element.parentNode != null) {
                element.parentNode.removeChild(element);
            }
        });
    }        

    /**
     * 
     * @param {Node} element 
     * @param {boolean} preventDefaultOrFunc true to also preventDefault
     */
    static stopPointerEventsBubbling(element, preventDefault) {

        let stopBubbling;
        if (preventDefault === true) {
           stopBubbling = (event) => {event.stopPropagation(); event.preventDefault(); };
        } else {
            stopBubbling = (event) => {event.stopPropagation(); };
        }

        // mouse events
        element.addEventListener("click", stopBubbling);
        element.addEventListener("dblclick", stopBubbling);
        element.addEventListener("auxclick", stopBubbling);
        element.addEventListener("mousedown", stopBubbling);
        element.addEventListener("mouseup", stopBubbling);
        element.addEventListener("mouseover", stopBubbling);
        element.addEventListener("mouseenter", stopBubbling);
        element.addEventListener("mouseleave", stopBubbling);
        element.addEventListener("mousemove", stopBubbling);
        element.addEventListener("mousewheel", stopBubbling);

        // pointer events
        element.addEventListener("pointercancel", stopBubbling);
        element.addEventListener("pointerdown", stopBubbling);
        element.addEventListener("pointerenter", stopBubbling);
        element.addEventListener("pointerleave", stopBubbling);
        element.addEventListener("pointermove", stopBubbling);
        element.addEventListener("pointerout", stopBubbling);
        element.addEventListener("pointerover", stopBubbling);
        element.addEventListener("pointerout", stopBubbling);
        element.addEventListener("wheel", stopBubbling);

        //touch events
        element.addEventListener("touchstart", stopBubbling);
        element.addEventListener("touchmove", stopBubbling);
        element.addEventListener("touchend", stopBubbling);
        element.addEventListener("touchcancel", stopBubbling);

    }
}