"use strict";

chrome.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.msg === "SHOW_PERMISSIONS") {
            showIdPResult();
        }
    }
);

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

