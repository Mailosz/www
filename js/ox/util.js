

export function signal(value) {
    let listeners = [];

    let signal = function signal() {
        return signal.value;
    }

    signal.value = value;
    signal.listen = function listen(listener) {
        listeners.push(listener);
    }
    signal.set = function set(value) {
        let oldValue = signal.value;
        signal.value = value;
        queueMicrotask(() => {
            listeners.forEach(listener => listener(value, oldValue));
        });
    }

    return signal;
}

/**
 * 
 * @param {Function} computeFn 
 * @returns 
 */
export function computed(computeFn) {
    let listeners = [];


    let scheduled = false;

    function queueMicrotaskOnce(fn) {
        if (scheduled) return;
        scheduled = true;

        queueMicrotask(() => {
            scheduled = false;
            fn();
        });
    }

    let passFn = function passFn(signal) {
        return signal();
    }

    let dependsOnFn = function dependsOnFn(signal) {
        signal.listen(() => {
            queueMicrotaskOnce(() => {
                let value = computeFn(passFn);
                listeners.forEach(listener => listener(value));
            });
        });
    }


    computeFn(dependsOnFn);

    let signal = function signal() {
        return computeFn(passFn);
    }

    signal.listen = function listen(listener) {
        listeners.push(listener);
    }


    return signal;

}