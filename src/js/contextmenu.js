"use strict";

chrome.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.msg === "SHOW_PERMISSIONS") {
            showIdPResult();
        }
    }
);

function showIdPResult() {
    const card = newElement("card");
    const p = document.createElement("p");
    //TODO add a header indicating this is from SPEYE tool (same cue in right-click option icon)
    p.textContent = "If you continue login, the following will be requested.";
    card.appendChild(p);

    // add a title to the card
    const url = window.location.href;
    const title = newElement("card-header", getIdPName(url));
    card.appendChild(title);

    // main content of the card
    const content = newElement("card-content");
    addContentHeader(content); // header to indicate the RP name
    addContent(url, content); // show list of permissions
    card.appendChild(content);

    const column = newElement("column");
    column.appendChild(card);

    column.style.position = "relative";
    document.body.appendChild(column);
}

