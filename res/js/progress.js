import { byId, show } from "./doc_utils.js";

export function progress(idOrEl) {
    const e = byId(idOrEl);
    return {
        showProgress: function(showBl) {
            show(e, showBl);
        },
        setProgress: function(num) {
            e.value = num;
        }
    };
}
