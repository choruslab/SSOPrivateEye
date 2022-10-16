"use strict";

var processed_idps = [];

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // ask script to search for SSO logins
    chrome.tabs.sendMessage(tabs[0].id, {msg: "searchSSO"});
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "SHOW_RESULT") {
            showResult(request.redirectUrl);
        }
        if (request.msg === "QUERY_RESULT") {
            const status = processed_idps.length > 0 ? true : false;
            sendResponse({received_results: status});
        }
    }
);

function showResult(url) {
    const idp = getIdPName(url);
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    
    // skip if idp has already been processed or if url is not idp
    if (processed_idps.includes(idp) || !regex.test(url)) {
        return;
    }
    processed_idps.push(idp);

    const card = newElement("card");
    const p = document.createElement("p");
    //TODO add a header indicating this is from SPEYE tool (same cue in right-click option icon)
    p.textContent = "If you continue with Facebook, the following will be requested.";
    card.appendChild(p);

    // add a title to the card
    const title = newElement("card-header", idp);
    card.appendChild(title);

    // main content of the card
    const content = newElement("card-content");
    addContentHeader(content); // header to indicate the RP name
    addContent(url, content); // show list of permissions
    addOptoutNote(content); // footer note about permission opt-outs
    card.appendChild(content);

    const column = newElement("column");
    column.appendChild(card);

    // show card on popup window
    document.getElementById("login-options").appendChild(column);
}

