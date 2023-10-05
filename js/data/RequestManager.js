export class RequestManager {

    #failTimeout = null;
    #sent;
    constructor(uid) {
        this.uid = uid;

        this.#sent = new Map();

        let storage = localStorage[this.uid];
        // if (storage != null) {
        //     let map;
        //     try {
        //         map = JSON.parse(storage);
        //     } catch (ex) {
        //         console.error(ex);
        //     }
        //     if (map instanceof Array && this.#sent.size > 0) {
        //         this.#sent = new Map(map);
        //         this.#fail();
        //     } else {
        //         this.#sent = new Map();
        //     }
        // }
    }


    send(request, onsuccess, id) {
        let obj = {request: request, onsuccess: onsuccess, failed: false, retries: 0};
        if (id == null) {
            id = crypto.randomUUID();
        }

        this.#sent.set(id, obj);
        //localStorage[this.uid] = JSON.stringify([...this.#sent]);

        request.headers.set("Request-Uuid", id);
        
        this.onwait();
        this.#trySend(id, obj);
    }

    async #trySend(uuid, obj) {
        await fetch(obj.request)
            .then(resp => {
                if (resp.ok) {
                    obj.failed = false;
                    this.#sent.delete(uuid);

                    this.#success(obj, resp);
                } else {
                    obj.failed = true;
                    obj.counter = obj.retries;
                    this.#fail(obj);

                    this.onerror();
                }
            }).catch(ex => {
                console.log(ex);

                this.#fail(obj);
            });
    }

    #fail(obj) {

        if (this.#failTimeout != null) {
            clearTimeout(this.#failTimeout);
        }

        this.#failTimeout = setTimeout(this.#resend.bind(this),1000);

        this.onfail();
    }

    async #resend() {

        let tried = [];
        for (let [uuid, obj] of this.#sent) {
            if (obj.failed) {
                obj.request = new Request(obj.request);
                obj.retries = obj.retries + 1;
                let task = this.#trySend(uuid, obj);
                tried.push(task);
            }
        }

        await Promise.all(tried);

        if (this.#sent.size > 0) {
            setTimeout(this.#resend.bind(this),2000);
        }
    }

    #success(obj) {
        try {
            obj.onsuccess(obj.response);
            this.onsuccess();
        } catch (ex) {
            console.log(ex);
            this.onerror();
        }
    }

    /**
     * Function invoked when data transfer fails
     */
    onfail = () => {};
    /**
     * Function invoked when data transfer succeds, but there is an error when handling onsuccess function
     */
    onerror = () => {};
    onsuccess = () => {};
    onwait = () => {};
}