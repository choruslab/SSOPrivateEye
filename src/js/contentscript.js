"use strict";

const SSO_LOGIN_XPATH = [
    // ignores first letter `L` to cover upper/lower case
    "//*[contains(text(), 'og in with')]", // vimeo, bitly, (ilovepdf, surveymonkey)
    "//*[contains(text(), 'ogin with')]",  // (instructure)
    // ignores first letter `C`
    "//*[contains(text(), 'ontinue with')]", // tumblr, nytimes, ebay, theguardian, aliexpress, (researchgate, pixiv)
    // ignores first letter `S`
    "//*[contains(text(), 'ign in with')]", // zoom, medium, imdb, fandom, xhamster, (usatoday)
    "//*[contains(text(), 'ign In with')]", // imgur

    // EXTRA PATTERNS NEEDED FOR TESTING SET
    // ignores first letter `L`
    "//*[contains(text(), 'ogin via')]", // tinyurl
    "//*[contains(text(), 'one of these options')]", // booking
    "//*[contains(@data-text, 'connect using')]" // livejournal
];

const IDP_ENDPOINT_REGEX = "https://(.*)\\.facebook\\.com/login(.*)"
+ "|https://(.*)\\.facebook\\.com/oauth(.*)"
+ "|https://graph\\.facebook\\.com/(.*)" 
// Google
+ "|https://(.*)\\.google\\.com/(.*)/oauth(.*)"
+ "|https://oauth2\\.googleapis\\.com/(.*)"
+ "|https://openidconnect\\.googleapis\\.com/(.*)"
+ "|https://googleapis\\.com/oauth(.*)"
// Apple
+ "|https://(.*)\\.apple\\.com/auth(.*)";

var processedElements = new Set(); // to keep track of processed SSO matches

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
    const regex = /("|')(.*?)("|')/;
    const link = attr.match(regex)[0];
    return link;
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
        return sendServerRequest(el.href);
    }
    // check if it's a form element
    else if (el.tagName === "FORM" || (el.hasAttribute("type") && el.getAttribute("type") === "submit")) {
        return submitServerForm(el);
    }
    // check if link is in onclick
    else if (el.hasAttribute("onclick")) {
        const href = extractLink(el.getAttribute("onclick"));
        if (href) {
            return sendServerRequest(href);
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
        for (let i = 0; i < matches.snapshotLength; i++) {
            const match = matches.snapshotItem(i);
            console.log(match);
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
    }
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

async function sendServerRequest(url) {
    if (typeof url === "undefined") {
        return Promise.resolve(); // nothing to do
    }

    // check url protocol
    if (!String(url).startsWith("http")) {
        return Promise.resolve();
    }
    // TODO send request only if it's to the site's server

    console.log("Sending request to: " + url);

    return fetch(url).then(sendResultToBackground(url)).catch(err => {console.log(err);});
}
