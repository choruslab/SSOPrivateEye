"use strict";

const SSO_LOGIN_XPATH = [
    // training set (21 sites)
    "//*[(@*|text())[contains(translate(., 'SIGNWTH', 'signwth'), 'sign in with')]]",
    "//button[text()[contains(translate(., 'SIGN', 'sign'), 'sign in')]]",
    "//*[(@*|text())[contains(translate(., 'CONTIUEWH', 'contiuewh'), 'continue with')]]",
    "//*[(@*|text())[contains(translate(., 'LOGINWTH', 'loginwth'), 'log in with')]]",
    "//*[(@*|text())[contains(translate(., 'LOGINWTH', 'loginwth'), 'login with')]]",
    "//*[(@*|text())[contains(translate(., 'LOGINVA', 'loginva'), 'login via')]]",
    "//*[(@*|text())[contains(translate(., 'CONETUSIG', 'conetusig'), 'connect using')]]",
    "//*[(@*|text())[contains(translate(., 'ORUSE', 'oruse'), 'or use')]]",


    // variations of the above strings
    "//*[(@*|text())[contains(translate(., 'SIGNWTH', 'signwth'), 'sign in with')]]",
    "//*[(@*|text())[contains(translate(., 'SIGNWTH', 'signwth'), 'signin with')]]",
    "//*[(@*|text())[contains(translate(., 'SIGNU', 'signu'), 'sign in using')]]",
    "//*[(@*|text())[contains(translate(., 'SIGNU', 'signu'), 'signin using')]]",

    "//*[(@*|text())[contains(translate(., 'LOGINUS', 'loginus'), 'log in using')]]",
    "//*[(@*|text())[contains(translate(., 'LOGINUS', 'loginus'), 'login using')]]",

    "//*[(@*|text())[contains(translate(., 'CONTIUESG', 'contiuesg'), 'continue using')]]",
    "//*[(@*|text())[contains(translate(., 'CONTIUEVA', 'contiueva'), 'continue via')]]",


    // less popular strings
    "//*[(@*|text())[contains(translate(., 'CONETWIH', 'conetwih'), 'connect with')]]",
    "//*[(@*|text())[contains(translate(., 'CONETHRUG', 'conethrug'), 'connect through')]]",

    "//*[(@*|text())[contains(translate(., 'ACESWITH', 'aceswith'), 'access with')]]",
    "//*[(@*|text())[contains(translate(., 'ACESUING', 'acesuing'), 'access using')]]",
    "//*[(@*|text())[contains(translate(., 'ACESTHROUG', 'acesthroug'), 'access through')]]",

    "//*[(@*|text())[contains(translate(., 'AUTHENICW', 'authenicw'), 'authenticate with')]]",
    "//*[(@*|text())[contains(translate(., 'AUTHENICSG', 'authenicsg'), 'authenticate using')]]",
    "//*[(@*|text())[contains(translate(., 'AUTHENICROG', 'authenicrog'), 'authenticate through')]]",

    "//*[(@*|text())[contains(translate(., 'IDENTFYWH', 'identfywh'), 'identify with')]]",
    "//*[(@*|text())[contains(translate(., 'IDENTFYUSG', 'identfyusg'), 'identify using')]]",
    "//*[(@*|text())[contains(translate(., 'IDENTFYHROUG', 'identfyhroug'), 'identify through')]]",

    "//*[(@*|text())[contains(translate(., 'JOINWTH', 'joinwth'), 'join with')]]",
    "//*[(@*|text())[contains(translate(., 'JOINUSG', 'joinusg'), 'join using')]]",
    "//*[(@*|text())[contains(translate(., 'JOINTHRUG', 'jointhrug'), 'join through')]]",

    "//*[(@*|text())[contains(translate(., 'ENTRWIH', 'entrwih'), 'enter with')]]",
    "//*[(@*|text())[contains(translate(., 'ENTRUSIG', 'entrusig'), 'enter using')]]",
    "//*[(@*|text())[contains(translate(., 'ACESOUNTWIH', 'acesountwih'), 'access account with')]]",
    "//*[(@*|text())[contains(translate(., 'ACESOUNTIG', 'acesountig'), 'access account using')]]",
    "//*[(@*|text())[contains(translate(., 'CHEKINWTH', 'chekinwth'), 'check in with')]]",
    "//*[(@*|text())[contains(translate(., 'CHEKINUSG', 'chekinusg'), 'check in using')]]",
    "//*[(@*|text())[contains(translate(., 'GAINETRYWH', 'gainetrywh'), 'gain entry with')]]",
    "//*[(@*|text())[contains(translate(., 'GAINETRYUS', 'gainetryus'), 'gain entry using')]]",
    "//*[(@*|text())[contains(translate(., 'LINKWTH', 'linkwth'), 'link with')]]",


    // general strings but more specific selectors (less false positives and also improves performance)
    "//span[text()[contains(translate(., 'SIGN', 'sign'), 'sign in')]]",
    "//button[text()[contains(translate(., 'SIGN', 'sign'), 'signin')]]",
    "//span[text()[contains(translate(., 'SIGN', 'sign'), 'signin')]]",

    "//button[text()[contains(translate(., 'LOGIN', 'login'), 'login')]]",
    "//span[text()[contains(translate(., 'LOGIN', 'login'), 'login')]]",
    "//button[text()[contains(translate(., 'LOGIN', 'login'), 'log in')]]",
    "//span[text()[contains(translate(., 'LOGIN', 'login'), 'log in')]]",
    "//button[text()[contains(translate(., 'LOGN', 'logn'), 'log on')]]",
    "//span[text()[contains(translate(., 'LOGN', 'logn'), 'log on')]]",
    "//button[text()[contains(translate(., 'LOGN', 'logn'), 'logon')]]",
    "//span[text()[contains(translate(., 'LOGN', 'logn'), 'logon')]]",


    // SET2
    //"//*[@data-provider]",
    //"//*[@*[contains(., 'login-with-')]]"
    //"//*[text()[contains(translate(., 'SIGNU', 'signu'), 'sign in using')]]"
    //"//*[(@*|text())[contains(translate(., 'ONEFTHSPI', 'onefthspi'), 'one of these options')]]",
    //"//*[(@*|text())[contains(translate(., 'WAYSTOIGN', 'waystoign'), 'ways to sign in')]]",

];

var processedElements = new Set();

showContextMenuOption();

let start = performance.now();

function showContextMenuOption() {
    const url = window.location.href;
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    if (regex.test(url)) { // idp login page
        const divOption = newElement("option-banner");
        const divSpeye = newElement("speye-title", "[SPEYE]");
        divSpeye.appendChild(newElement("view-permissions", " view & opt-out login permissions..."));
        divSpeye.onclick = function() {
            showIdPResult();
        }
        divOption.appendChild(divSpeye);

        document.body.appendChild(divOption);
    }
}

chrome.runtime.onMessage.addListener(
    function(request) {
        if (request.msg === "searchSSO") {
            start = performance.now();
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
    let end = performance.now();
    console.log("Full script took " + (end - start) + " ms");
}

function extractLink(attr) {
    const regex = /(?=')?((https?(:|%3A)(\/\/|%2F%2F))|\/)[^'")]+/;
    const link = attr.match(regex);
    return link ? link[0] : null;
}

async function makeRequestIfLinkIsFound(el) {
    if (processedElements.has(el)) {
        // already handled
        return Promise.resolve();
    }
    // console.log(el);
    processedElements.add(el);

    // check if element contains sso link
    if (el.hasAttribute("href")) {
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

function getSSOSearchQuery() {
    let query = "";
    for (let xpath of SSO_LOGIN_XPATH) {
        if (query.length > 0) {
            query += "|"; // OR
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
        console.log("height: " + height);
        let search_start = performance.now();
        const matches = document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        let search_end = performance.now();
        console.log("SSO search took " + (search_end - search_start) + " ms");

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
            let chldNodes = [root];
            appendChildren(root, chldNodes);
            for (let chld of chldNodes) {
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

async function ssoSearch() {
    processedElements = new Set();

    // find idp links
    idpLinkSearch();

    // send requests to sso links
    rpLinkSearch();
}

async function submitServerForm(el) {
    const param = el.getAttribute("name");
    const value = el.getAttribute("value");

    // find closest parent form
    let form = el;
    while (form.parentElement != null && form.tagName != "FORM") {
        form = form.parentElement;
    }
    if (form === null || form.tagName === "HTML") return; // no form was found
    
    // attributes
    const method = form.getAttribute("method");
    const path = form.getAttribute("action");
    if (path === null || method === null) return; // nowhere to submit form
    
    // copy data
    let formData = new FormData(form);
    if (param != null && value != null) {
        formData.append(param, value);
    }
    // hidden parameters
    for (let i = 0; i < el.children.length; i++) {
        const chld = el.children[i];
        if (chld.tagName == "INPUT" && chld.getAttribute("type") == "hidden") {
            formData.append(chld.getAttribute("name"), chld.getAttribute("value"));
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
        return Promise.resolve();
    }

    const url = new URL(link, window.location.href);

    // check url protocol
    if (!url.protocol.startsWith("https")) {
        return Promise.resolve();
    }

    console.log("Sending request to: " + url);

    return fetch(url)
        .then(sendResultToBackground(url))
        .catch(err => {console.log(err);});
}
