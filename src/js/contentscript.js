"use strict";

const SSO_LOGIN_XPATH = [
    // TRAINING SET PATTERNS 
    // match any attribute or text node containing string
    "//*[(@*|text())[contains(translate(., 'SIGNWTH', 'signwth'), 'sign in with')]]",
    "//*[(@*|text())[contains(translate(., 'SIGNWTH', 'signwth'), 'signin with')]]",
    "//*[(@*|text())[contains(translate(., 'CONTINUEWH', 'continuewh'), 'continue with')]]",
    "//*[(@*|text())[contains(translate(., 'LOGINWTH', 'loginwth'), 'log in with')]]",
    "//*[(@*|text())[contains(translate(., 'LOGINWTH', 'loginwth'), 'login with')]]",
    // match strings that are typically only in text nodes
    "//*[text()[contains(translate(., 'ONEFTHSPI', 'onefthspi'), 'one of these options')]]",
    "//*[text()[contains(translate(., 'WAYSTOIGN', 'waystoign'), 'ways to sign in')]]",
    "//*[text()[contains(translate(., 'LOGINVA', 'loginva'), 'login via')]]",
    // only match buttons for the more-general strings
    "//button[text()[contains(translate(., 'SIGN', 'sign'), 'sign in')]]",
    "//span[text()[contains(translate(., 'SIGN', 'sign'), 'sign in')]]",
    "//button[text()[contains(translate(., 'SIGN', 'sign'), 'signin')]]",
    "//span[text()[contains(translate(., 'SIGN', 'sign'), 'signin')]]",

    // EXTRA PATTERNS REQUIRED FOR TESTING SET
    "//*[@data-provider]",
    "//*[text()[contains(., 'Or Use')]]",
    "//*[@*[contains(., 'login-with-')]]",
    "//*[text()[contains(translate(., 'SIGNU', 'signu'), 'sign in using')]]"
];

var processedElements = new Set(); // to keep track of processed SSO matches

// show context menu option if this is an IdP login page
showContextMenuOption();

function showContextMenuOption() {
    const url = window.location.href;
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    if (regex.test(url)) { // idp login page
        // add banner area to the top
        const divOption = newElement("option-banner");

        // make a button to open permissions dialog
        const divSpeye = newElement("speye-title", "[SPEYE]");
        divSpeye.appendChild(newElement("view-permissions", "view login permissions..."));
        divSpeye.onclick = function() {
            showIdPResult(); // call context menu option
        }
        divOption.appendChild(divSpeye);
        
        document.body.appendChild(divOption);
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.msg === "searchSSO") {
            ssoSearch();
        }
    }
);

function idpLinkSearch() {
    let regex = new RegExp(IDP_ENDPOINT_REGEX);
    for (let el of document.querySelectorAll("*")) {
        if (processedElements.has(el)) {
            continue;
        }
        // search attributes for idp match
        for (let i = 0; i < el.attributes.length; i++) {
            let val = el.attributes[i].value;
            if (regex.test(val)) {
                sendResultToPopup(val);
                processedElements.add(el);
            }
        }
    }
}

function sendResultToPopup(redirectUrl) {
    chrome.runtime.sendMessage({
        msg: 'SHOW_RESULT',
        redirectUrl: redirectUrl
    });
    console.log(redirectUrl);
}

function sendResultToBackground(url) {
    chrome.runtime.sendMessage({
        msg: 'RETRY_REQUEST',
        url: url
    });
}

function extractLink(attr) {
    const regex = /(?=')?((https?(:|%3A)(\/\/|%2F%2F))|\/)[^'")]+/;
    const link = attr.match(regex);
    return link ? link[0] : null;
}

async function makeRequestIfLinkIsFound(el) {
    // check if we have processed this element already
    if (processedElements.has(el)) {
        return Promise.resolve();
    }
    
    // mark el as processed before initiating a request
    processedElements.add(el);

    // check if element contains sso link
    if (el.hasAttribute("href")) {
        console.log(el);
        const link = el.getAttribute("href");
        return sendServerRequest(link);
    }
    // check if it's a form element
    else if (el.tagName === "FORM" || (el.hasAttribute("type") && el.getAttribute("type") === "submit")) {
        return submitServerForm(el);
    }
    // check if any of the attributes contain a link
    else {
        for (let att of el.attributes) {
            let href = extractLink(att.value);
            if (href) {
                await sendServerRequest(href);
            }
        }
    }
    return Promise.resolve();
}

/**
 * @returns string with XPath query for finding SSO elements
 */
 function getSSOSearchQuery() {
    let query = "";
    for (let xpath of SSO_LOGIN_XPATH) {
        // append xpath to query
        if (query.length > 0) { // include OR if query is non-empty
            query += "|";
        }
        query += xpath;
    }
    return query;
}

function appendChildren(el, result) {
    if (el && el.hasChildNodes() && el.tagName !== "SCRIPT") {
        for (let i = 0; i < el.children.length; i++) {
            const chld = el.children[i];
            if (chld.tagName == "DIV" || chld.tagName == "A" || chld.tagName == "BUTTON" || chld.tagName == "FORM" || chld.hasAttribute("href")) {
                result.push(chld);
            }
            if (el.children[i].hasChildNodes()) {
                appendChildren(el.children[i], result);
            }
        }
    }
}

async function rpLinkSearch() {
    // build search query using xpath and idp name lists
    const query = getSSOSearchQuery();

    // find matches and make sso requests
    const scan = async height => {
        console.log("Searching at height " + height);
        const matches = document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        // return immediately if there are no matches
        if (matches.snapshotLength < 1) {
            console.log("no matches found");
            return;
        }

        for (let i = 0; i < matches.snapshotLength; i++) {
            const match = matches.snapshotItem(i);
            if (match.tagName == "SCRIPT" || match.tagName == "TITLE") {
                // move onto next match
                continue;
            }
            console.log(match);

            // prepare root node for search tree
            let root = match;
            for (let j = 0; j < height; j++) {
                if (root.parentElement) { // increase search height
                    root = root.parentElement;
                } else { // at max height
                    console.log("search complete");
                    return;
                }
            }

            // search tree for sso links
            let children = [root];
            appendChildren(root, children);
            for (let chld of children) {
                await makeRequestIfLinkIsFound(chld);
            }
        }

        // query result status and expand search if needed
        chrome.runtime.sendMessage({
            msg: "QUERY_RESULT"
        }, function (r) {
            if(r.received_results == false) {
                scan(height + 1).then(() => console.log("loop complete"));
            }
        });
    };
    scan(1).then(() => console.log("Search complete"));
}

function ssoSearch() {
    // reset processed list
    processedElements = new Set();

    // find and send idp links in current page
    idpLinkSearch();

    // find and make requests to sso links in current page
    rpLinkSearch();
}

async function submitServerForm(el) {
    // parameters set by the current choice
    const param = el.getAttribute("name");
    const value = el.getAttribute("value");

    // find closest parent who is a form
    let form = el;
    while (form.parentElement != null && form.tagName != "FORM") {
        form = form.parentElement;
    }
    if (form === null || form.tagName === "HTML") return; // no form found
    
    // form attributes
    const method = form.getAttribute("method");
    const path = form.getAttribute("action");
    if (path === null || method === null) return;
    
    // set form values
    let formData = new FormData(form);
    if (param != null && value != null) {
        formData.append(param, value);
    }
    // add any other hidden parameters
    for (let i = 0; i < el.children.length; i++) {
        const child = el.children[i];
        if (child.tagName == "INPUT" && child.getAttribute("type") == "hidden") {
            formData.append(child.getAttribute("name"), child.getAttribute("value"));
        }
    }
    
    // submit form
    return fetch(path, {
        method: method,
        body: new URLSearchParams(formData)
    }).catch(err => {console.log(err);});
}

async function sendServerRequest(link) {

    if (typeof link === "undefined") {
        return Promise.resolve(); // nothing to do
    }

    const url = new URL(link, window.location.href);

    // check url protocol
    if (!url.protocol.startsWith("http")) {
        return Promise.resolve();
    }

    console.log("Sending request to: " + url);

    return fetch(url)
        .then(sendResultToBackground(url))
        .catch(err => {console.log(err);});
}
