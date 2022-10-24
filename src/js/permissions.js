"use strict";

function newElement(classname, text=undefined) {
    const el = document.createElement("div");
    el.classList.add(classname);
    // (optional) add text to element
    if (typeof text !== 'undefined') {
        el.append(text);
    }
    return el;
}

function showIdPResult() {
    const url = window.location.href;
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    if (!regex.test(url)) { // nothing to do
        return;
    }

    // overlay mask in the background
    const overlay = newElement("overlay");
    overlay.style.display = "block";
    document.body.appendChild(overlay);

    const card = newElement("card");

    // add a title to the card
    const title = newElement("card-header", getIdPName(url));
    title.appendChild(newElement("card-header-speye", "[SPEYE]"));
    card.appendChild(title);

    // main content of the card
    const content = newElement("card-content");
    addContentHeader(content); // header to indicate the RP name
    addContent(url, content); // show list of permissions
    card.appendChild(content);

    // add close option
    const close = newElement("close-x", "x");
    const cardWithClose = newElement("full-card");

    cardWithClose.appendChild(close);
    cardWithClose.appendChild(card);

    const column = newElement("column");
    column.appendChild(cardWithClose);

    column.style.position = "sticky";
    column.style.bottom = "5px";
    column.style.zIndex = "10003";
    document.body.appendChild(column);

    // listeners for close event
    close.onclick = function() {
        overlay.style.display = "none";
        column.style.display = "none";
    }
    overlay.onclick = function() {
        overlay.style.display = "none";
        column.style.display = "none";
    }
}

function addContentHeader(content) {
    const header = newElement("card-content-header");

    function fill(url) {
        let text = "";
        const regex = new RegExp(IDP_ENDPOINT_REGEX);
        if (regex.test(url)) {
            text = getRPFromRedirectParam();
        } else {
            text = new URL(url).hostname;
        }
        text += " would request ...";
        header.append(text);
    }
    
    if (location.hash == "#popup") {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            fill(tabs[0].url);
        });
    } else {
        fill(window.location.href);
    }
    content.appendChild(header);
}

function addReqNote(idp, content) {
    let note = "... the following as required data:";
    let div = newElement("note-required", note);
    
    if (idp === "Apple") {
        note = "... the following data that could be anonymized during login:";
        div = newElement("note-apple", note);
    }
    
    content.appendChild(div);
}

function addToggleButton(el, greyedout=false) {
    let enabled = true; // default is on
    const btn = newElement("toggle-button");
    const tgl = newElement("toggle");
    if (greyedout) { // cannot toggle
        btn.style.background = "#d19999";
        tgl.style.background = "#d19999";
        btn.style.border = "1px black solid";
    } else {
        btn.onclick = function() {
            if (enabled) { // turn off
                btn.style.background = "grey";
                tgl.style.background = "white";
                tgl.style.transform = "translateX(0%)";
                enabled = false;
            } else { // turn on
                btn.style.background = "";
                tgl.style.background = "";
                tgl.style.transform = "translateX(100%)";
                enabled = true;
            }
        };
    }
    btn.appendChild(tgl);
    el.appendChild(btn);
}

function addContent(url, content) {
    const idp = getIdPName(url);
    const scope_values = extractScopeFromUrl(url);

    // heading for the content area
    content.appendChild(newElement("hr-after-basic-scopes"));

    // add note about required permissions
    addReqNote(idp, content);
 
    // basic info
    let divBasic = newElement("basic-block");
    if (idp === "Apple") {
        divBasic = newElement("basic-block-apple");
    }
    if (idp === "Google" || idp === "Facebook" || (idp === "Apple" && scope_values.includes("name"))) {
        const basic_info = IDP_SCOPE_DESC[idp]["basic_info"];
        let title = newElement("scope-title", basic_info.title);
        // add opt-out toggle (greyedout)
        addToggleButton(title, true);
        divBasic.appendChild(title);
        // individual attributes
        basic_info.attributes.forEach(attr => {
            divBasic.appendChild(newElement("scope-desc", attr));
        });
        divBasic.appendChild(newElement("hr-after-basic-scopes"));
    }
    content.appendChild(divBasic);

    // non-basic info
    let counter = 1;
    const divNonbasic = newElement("nonbasic-block");
    for (var key of Object.keys(IDP_SCOPE_DESC[idp]["non_basic_scopes"])) {
        if (scope_values.length > 0 && scope_values.includes(key)) {
            const val = IDP_SCOPE_DESC[idp]["non_basic_scopes"][key];
            let title = newElement("scope-title", val.title);
            // add opt-out toggle
            addToggleButton(title);
            divNonbasic.appendChild(title);

            if (val.hasOwnProperty("desc")) { // optional description
                divNonbasic.appendChild(newElement("scope-desc", val.desc));
            }
            
            if (counter < scope_values.length) {
                divNonbasic.appendChild(newElement("hr-after-basic-scopes"));
            }
            counter++;
        }
    }

    // check if any scope is remaining to be added (i.e., not in known list)
    const basic = IDP_SCOPE_DESC[idp]["basic_scopes"];
    const non_basic = Object.keys(IDP_SCOPE_DESC[idp]["non_basic_scopes"]);
    for (var i = 0; i < scope_values.length; i++) {
        const val = scope_values[i];
        if (basic.includes(val)) {
            continue;
        }
        if (!non_basic.includes(val)) {
            divNonbasic.appendChild(newElement("scope-title", val));
        }
    }

    if (counter > 1) {
        // add note about optional permissions
        const optNote = "and the following data that could be opted-out:";
        const divOptNote = newElement("note-optional", optNote);
        content.appendChild(divOptNote);

        // add non-basic permissions
        content.appendChild(divNonbasic);
    }
}

