"use strict";

var optOutUrl = window.location.href;

function newElement(classname, text=undefined) {
    const el = document.createElement("div");
    el.classList.add(classname);
    if (typeof text !== 'undefined') { // optional
        el.append(text);
    }
    return el;
}

function isPopup() {
    return location.hash == "#popup";
}

function showIdPResult() {
    const url = window.location.href;
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    if (!regex.test(url)) { // nothing to do
        return;
    }

    // mask the background
    const overlay = newElement("overlay");
    overlay.style.display = "block";
    document.body.appendChild(overlay);

    const card = newElement("card");

    // card title
    const title = newElement("card-header", getIdPName(url));
    title.appendChild(newElement("card-header-speye", "[SPEYE]"));
    card.appendChild(title);

    // main content
    const content = newElement("card-content");
    addContentHeader(content); // header with RP name
    addContent(url, content); // permissions list
    card.appendChild(content);

    // close option
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

    // close events
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

    if (isPopup()) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            fill(tabs[0].url);
        });
    } else {
        fill(window.location.href);
    }
    content.appendChild(header);
}

function addNote(idp, content, required) {
    
    function highlight(word) {
        const t = newElement("span", word);
        t.style.textDecoration = "underline";
        t.style.fontWeight = "bold";
        t.style.display = "inline-block";
        return t;
    }

    let div = null;
    if (idp === "Apple") {
        // Apple permissions can always be anonymized
        div = newElement("note-apple");
        div.append("... the following data that could be ");
        div.append(highlight("anonymized"));
        div.append(" during login:");
    } else if (required === true) {
        // note about required permissions
        div = newElement("note-required");
        div.append("... the following as ");
        div.append(highlight("required"));
        div.append(" data:");
    } else {
        // note about opt-outable permissions
        div = newElement("note-optional");
        div.append("and the following data that could be ");
        div.append(highlight("opted-out"));
        if (!isPopup()) {
            div.append(" (use toggle below)");
        }
        div.append(":");
    }
    content.appendChild(div);
}

// TODO WIP
function getUrlAfterOptOut(paramToRemove) {
    let decoded_url = new URL(decodeURI(optOutUrl));
    let cur_params = decoded_url.searchParams;
    let cur_next = cur_params.get("next");
    console.log(cur_next);
    if (cur_next) {
        let next_url = new URL(cur_next);
        let next_params = next_url.searchParams;
        let cur_scope = next_params.get("scope");
        console.log(cur_scope);
        let new_scope = cur_scope.split(",").filter(e => e !== paramToRemove).join(",");
        console.log(new_scope);
        next_url.searchParams.set("scope", new_scope);
        decoded_url.searchParams.set("next", next_url.toString());
    }
    optOutUrl = decoded_url.toString();
    window.location.href = optOutUrl;
}

function addToggleButton(el, scope_param, greyedout=false) {
    if (isPopup()) {
        // show toggle only in idp page
        return;
    }
    let enabled = true; // default is on
    const btn = newElement("toggle-button");
    const tgl = newElement("toggle", "ON");
    
    if (greyedout) { // disable toggle option
        btn.style.opacity = "0.55";
        btn.style.cursor = "default";
    } else {
        btn.onclick = function() {
            if (enabled) { // turn off
                btn.style.background = "grey";
                tgl.style.transform = "translateX(0%)";
                tgl.style.color = "grey";
                tgl.innerText = "OFF";
                enabled = false;
                //getUrlAfterOptOut(scope_param);
            } else { // turn on
                btn.style.background = "";
                tgl.style.transform = "translateX(100%)";
                tgl.style.color = "";
                tgl.innerText = "ON";
                enabled = true;
            }
        };
    }
    btn.appendChild(tgl);
    el.appendChild(btn);
}

// TODO refactor
function addContent(url, content) {
    const idp = getIdPName(url);
    const scope_values = extractScopeFromUrl(url);

    // heading for the content area
    content.appendChild(newElement("hr-after-basic-scopes"));

    // add note about required permissions
    addNote(idp, content, true);
 
    // basic info
    let divBasic = newElement("basic-block");
    if (idp === "Apple") {
        divBasic = newElement("basic-block-apple");
    }
    if (idp === "Google" || idp === "Facebook" || (idp === "Apple" && scope_values.includes("name"))) {
        const basic_info = IDP_SCOPE_DESC[idp]["basic_info"];
        let title = newElement("scope-title", basic_info.title);
        // add opt-out toggle (greyedout)
        addToggleButton(title, "basic_info", true);
        divBasic.appendChild(title);
        // individual attributes
        basic_info.attributes.forEach(attr => {
            divBasic.appendChild(newElement("scope-desc", attr));
        });
        //divBasic.appendChild(newElement("hr-after-basic-scopes"));
    }
    if (idp === "Google") {
        for (var key of Object.keys(IDP_SCOPE_DESC[idp]["required_scopes"])) {
            if (scope_values.length > 0 && scope_values.includes(key)) {
                const val = IDP_SCOPE_DESC[idp]["required_scopes"][key];
                let title = newElement("scope-title", val.title);
                // add opt-out toggle
                addToggleButton(title, key, true);
                divBasic.appendChild(title);
    
                if (val.hasOwnProperty("desc")) { // optional description
                    divBasic.appendChild(newElement("scope-desc", val.desc));
                }
            }
        }
    }
    content.appendChild(divBasic);
    if (idp === "Google") {
        return;
    }
    //content.appendChild(newElement("hr-after-basic-scopes"));

    // non-basic info
    let counter = 1;
    const divNonbasic = newElement("nonbasic-block");
    for (var key of Object.keys(IDP_SCOPE_DESC[idp]["non_basic_scopes"])) {
        if (scope_values.length > 0 && scope_values.includes(key)) {
            const val = IDP_SCOPE_DESC[idp]["non_basic_scopes"][key];
            let title = newElement("scope-title", val.title);
            // add opt-out toggle
            addToggleButton(title, key, false);
            divNonbasic.appendChild(title);

            if (val.hasOwnProperty("desc")) { // optional description
                divNonbasic.appendChild(newElement("scope-desc", val.desc));
            }
            
            // if (counter < scope_values.length) {
            //     divNonbasic.appendChild(newElement("hr-after-basic-scopes"));
            // }
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
        addNote(idp, content, false);

        // add non-basic permissions
        content.appendChild(divNonbasic);
    }
}

