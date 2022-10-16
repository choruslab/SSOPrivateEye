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
        text += " wishes to retrieve your ...";
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

function addOptoutNote(content) {
    const el = document.createElement("i");
    el.textContent = "Items marked (required) cannot be opted-out";
    content.appendChild(el);
}

function addContent(url, content) {
    const idp = getIdPName(url);
    const scope_values = extractScopeFromUrl(url);

    // heading for the content area
    content.appendChild(newElement("hr-after-basic-scopes"));
 
    // basic info
    const divBasic = newElement("basic-block");
    if (idp === "Google" || idp === "Facebook" || (idp === "Apple" && scope_values.includes("name"))) {
        // (basic info is optional for Sign in with Apple)
        const basic_info = IDP_SCOPE_DESC[idp]["basic_info"];
        let title = newElement("scope-title", basic_info.title);
        if (basic_info.hasOwnProperty("title_label")) {
            // label to indicated required fields
            title.appendChild(newElement("scope-title-required", basic_info.title_label));
        }
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
    content.appendChild(divNonbasic);
}
