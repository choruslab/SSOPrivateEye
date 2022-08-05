"use strict";

const SSO_LOGIN_XPATH = [
    "//*[contains(text(), 'Log in with')]", // vimeo, bitly
    "//*[contains(text(), 'Login with')]", 
    "//*[contains(text(), 'Continue with')]", // tumblr, nytimes, ebay, (researchgate)
    "//*[contains(text(), 'sign in with')]", // zoom, (usatoday)
    "//*[contains(text(), 'continue with')]", // theguardian, aliexpress
    "//*[contains(text(), 'Sign In with')]", // imgur
    "//*[contains(text(), 'Sign in with')]", // medium, imdb, fandom, xhamster

    // EXTRA PATTERNS NEEDED FOR TESTING SET
    "//*[contains(text(), 'login via')]" // tinyurl
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

const IDP_NAMES = [
    "GOOGLE", "Google", "google", "gmail", "Gmail", "ggl",
    "FACEBOOK", "Facebook", "facebook", "FaceBook", "fb",
    "APPLE", "Apple", "apple", "appl"
];

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
        // search links for idp match
        if (processedElements.has(el)) { continue; }
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
        if (xpath.includes("{idp}")) {
            //replace {idp} with idp name
            for (let idp of IDP_NAMES) {
                if (query.length > 0) { // include OR if query is non-empty
                    query += "|";
                }
                query += xpath.replace("{idp}", idp);
            }
        } else {
            // append xpath to query
            if (query.length > 0) { // include OR if query is non-empty
                query += "|";
            }
            query += xpath;
        }
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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function rpLinkSearch() {
    // build search query using xpath and idp name lists
    const query = getSSOSearchQuery();

    // find matches and make sso requests
    const scan = async height => {
        console.log("Searching at height " + height);
        const matches = document.evaluate(query, document.cloneNode(true), null, XPathResult.ANY_TYPE, null);
        let match = matches.iterateNext();
        while (match) {

            console.log(match);
            if (match.tagName == "SCRIPT" || match.tagName == "TITLE") {
                // move onto next match
                match = matches.iterateNext();
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

            match = matches.iterateNext();
        }

        //await new Promise(resolve => setTimeout(resolve, 500));

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
        return; // nothing to do
    }
    // check url protocol
    if (!String(url).startsWith("http")) {
        return;
    }
    // TODO send request only if it's to the site's server

    console.log("Sending request to: " + url);

    return fetch(url).then(sendResultToBackground(url)).catch(err => {console.log(err);});
}
