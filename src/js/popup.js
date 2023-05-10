"use strict";

var processed_idps = [];

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // script search for SSO logins
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
    
    if (processed_idps.includes(idp) || !regex.test(url)) {
        // already handled or url is not idp
        return;
    }
    processed_idps.push(idp);

    const card = newElement("card");

    // card title
    const title = newElement("card-header", idp);
    card.appendChild(title);

    // main content
    const content = newElement("card-content");
    addContentHeader(content); // header to indicate the RP name
    addContent(url, content); // show list of permissions
    card.appendChild(content);

    const column = newElement("column");
    column.appendChild(card);

    // show card on popup window
    document.getElementById("login-options").appendChild(column);
}

