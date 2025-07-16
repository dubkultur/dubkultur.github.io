export function byId(idOrEl) {
    if (typeof idOrEl === 'string') {
        const e = document.getElementById(idOrEl);
        if (!e) {
            debugger;
            throw `Cannot \`getElementById("${idOrEl}"\`)`;
        }
        return e;
    }
    return idOrEl;
}

export function show(idOrEl, show) {
    byId(idOrEl).style = "visibility: " + (show ? "visible" : "hidden");
}

export function enable(what, really) {
    if (really) {
        byId(what).removeAttribute("disabled");
    } else {
        byId(what).setAttribute("disabled", "disabled");
    }
}

function attach(idOrEl, what, handler) {
    byId(idOrEl).addEventListener(what, handler);
}

export function attachClick(idOrEl, handler) {
    attach(idOrEl, 'click', handler);
}

export function sanitize(str) {
    return str.replaceAll(/[^a-z0-9_\.\/]/gi, '');
}