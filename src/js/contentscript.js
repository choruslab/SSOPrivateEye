"use strict";

const SSO_LOGIN_XPATH = [
    "//*[contains(text(), 'Log in with')]", // vimeo, bitly
    "//*[contains(text(), 'Login with')]", 
    "//*[contains(text(), 'Continue with')]", // tumblr, nytimes, ebay, (researchgate)
    "//*[contains(text(), 'sign in with')]", // zoom, (usatoday)
    "//*[contains(text(), 'continue with')]", // theguardian, aliexpress
    "//*[contains(text(), 'Sign In with')]", // imgur
    "//*[contains(text(), 'Sign in with')]", // medium, imdb, fandom, xhamster
    //"//*[contains(@alt, '{idp}')]", // bitly
    //"//*[contains(text(), '{idp}')]" // theguardian
    //"//*[contains(@aria-label, 'Sign in with')]", // zoom

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

var processedElements = []; // to keep track of processed SSO matches

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
        if (processedElements.includes(el)) { continue; }
        for (let i = 0; i < el.attributes.length; i++) {
            let val = el.attributes[i].value;
            if (regex.test(val)) {
                sendResultToPopup(val);
                processedElements.push(el);
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

function makeRequestIfLinkIsFound(el) {
    // check if we have processed this element already
    if (processedElements.includes(el)) { return false; }

    // check if element contains sso link
    let result = false;
    if (el.hasAttribute("href")) {
        sendServerRequest(el.href);
        result = true;
    }
    // check if it's a form element
    else if (el.tagName === "FORM" || (el.hasAttribute("type") && el.getAttribute("type") === "submit")) {
        submitServerForm(el);
        result = true;
    }
    // check if link is in onclick
    else if (el.hasAttribute("onclick")) {
        const href = extractLink(el.getAttribute("onclick"));
        if (href) {
            sendServerRequest(href);
            result = true;
        }
    }
    processedElements.push(el);
    return result;
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
            result.push(el.children[i]);
            if (el.children[i].hasChildNodes()) {
                appendChildren(el.children[i], result);
            }
        }
    }
}

function ssoLinkSearch() {
    // build search query using xpath and idp name lists
    const query = getSSOSearchQuery();

    // find matches and make sso requests
    const matches = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null);
    let match = matches.iterateNext();
    while (match) {
        let found = false;

        if (processedElements.includes (match) || match.tagName == "SCRIPT") {
            // move onto next match
            match = matches.iterateNext();
            continue;
        }
        
        // find parent element with relevant info
        let el = match;
        while (el) {
            let result = makeRequestIfLinkIsFound(el);
            if (result) { 
                found = true;
                break;
            }
            el = el.parentElement; // continue search...
        }
        
        // search sibling elements for relevant info
        let children = [];
        console.log("Match and its child elements:");
        console.log(match);
        let root = match.parentElement.closest('div');
        if (root) {
            appendChildren(root, children);
            console.log(children);
            for (let chld of children) {
                if (makeRequestIfLinkIsFound(chld)) {
                    found = true;
                }
            }
        }

        if (!found) {
            console.log("No SSO element found for this match");
        }

        // move onto next match
        match = matches.iterateNext();
    }
}

function ssoSearch() {
    // reset processed list
    processedElements = [];

    // find and send idp links in current page
    idpLinkSearch();

    // find and make requests to sso links in current page
    ssoLinkSearch();

}

function submitServerForm(el) {
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
    let req = new XMLHttpRequest();
    req.open(method, path);
    req.send(new URLSearchParams(formData));
}

function sendServerRequest(url) {
    if (typeof url === "undefined") {
        return; // nothing to do
    }
    // check url protocol
    if (!url.startsWith("http")) {
        return;
    }
    // send request only if it's to the site's server
    if (new URL(url).hostname != document.location.hostname) {
        return;
    }

    fetch(url)
        .then(response => {})
        .catch(err => {});

    sendResultToBackground(url);
}
