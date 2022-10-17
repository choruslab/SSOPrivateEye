"use strict";

chrome.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.msg === "SHOW_PERMISSIONS") {
            showIdPResult();
        }
    }
);

function showIdPResult() {

    // overlay mask in the background
    const overlay = newElement("overlay");
    overlay.style.display = "block";
    document.body.appendChild(overlay);

    const card = newElement("card");
    // const p = document.createElement("p");
    // //TODO add a header indicating this is from SPEYE tool (same cue in right-click option icon)
    // p.textContent = "If you continue login, the following will be requested.";
    // card.appendChild(p);

    // add a title to the card
    const url = window.location.href;
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
    column.style.zIndex = "10";
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

