export function MakeSamples() {
    document.addEventListener("DOMContentLoaded", (event) => {
        const samples = document.querySelectorAll(".sample");

        for (let sample of samples) {
            /**@type {HTMLElement} sample*/
            // let sample = sample;
            let code;
            let showViewer = false;
            let showCode = false;
            let editable = false;
            if (sample.tagName == "CODE") { // make sample from code
                code = sample.innerText;
                showCode = true;
            } else { // make sample from objects
                code = sample.innerHTML;
                showViewer = true;
            }

            //const container = document.createElement("div");
            //container.classList.add("fullrow");
            //sample.parentElement.replaceChild(container, sample);

            let container = sample;

            if (sample.dataset.viewer == "true") {
                showViewer = true;
            } else if (sample.dataset.viewer == "false") {
                showViewer = false;
            }

            if (sample.dataset.code == "true") {
                showCode = true;
            } else if (sample.dataset.code == "false") {
                showCode = false;
            }

            if (sample.contentEditable) {
                sample.contentEditable = false;
                editable = true;
            }

            sample.innerHTML = "";

            let codebox;
            if (showCode) {
                codebox = document.createElement("code-box");
                if (editable) codebox.contentEditable = true;
                codebox.classList.add("sample-codebox");
                codebox.code = code;
                container.appendChild(codebox);
            }
            
            let viewer;
            if (showViewer) {
                viewer = document.createElement("iframe");
                viewer.classList.add("sample-viewer")
                viewer.srcdoc = code;
            }

            if (showCode && showViewer) {
                let sampleMenu = document.createElement("div");
                sampleMenu.classList.add("sample-menu");
                container.appendChild(sampleMenu);
                // populating menu
                if (editable) {
                    let bt = document.createElement("button");
                    bt.classList.add("sample-run-button");
                    bt.title = "Run";
                    bt.onclick = (event) => {viewer.srcdoc = codebox.getCode();}
                    sampleMenu.appendChild(bt);
                }

                let spacer = document.createElement("div");
                spacer.classList.add("spacer");
                sampleMenu.appendChild(spacer);

                {
                    let bt = document.createElement("button");
                    bt.classList.add("sample-orientation-button");
                    bt.title = "Change orientation";
                    bt.onclick = (event) => {sample.classList.toggle("horizontal");}
                    sampleMenu.appendChild(bt);
                }
    
                {
                    let bt = document.createElement("button");
                    bt.classList.add("sample-fullscreen-button");
                    bt.title = "Fullscreen";
                    bt.onclick = (event) => {sample.classList.toggle("fullscreen");}
                    sampleMenu.appendChild(bt);
                }
            }


            if (showViewer) {
                container.appendChild(viewer);
            }

        }
    });
}