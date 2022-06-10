"use strict";

const SSO_LOGIN_PATTERNS = [
    "#{idp}_form", // vimeo
    "[aria-label='Sign in with {idp}']", // zoom
    "#social-login-{idp}", // bit.ly
    "[data-testid='{idp}-login-button']", // tumblr
    "[data-cy='{idp}-sign-in-button']", // theguardian
    "[href*='signin/{idp}']", // imgur
    "#js-{idp}-oauth-login", // nytimes
    "[href*='start-auth/{idp}']",
    "[href*='connect/{idp}']", // medium
    "[href*='signin?openid']", // imdb
    ".fm-sns-item.{idp}", // aliexpress
    ".{idp}-button", //xhamster
    "#signin_{idp}_btn", // ebay
    "[data-test='signin-auth-provider-button-{idp}']", // fandom
    "[action*='auth/{idp}']" // okezone
];

const IDP_ENDPOINT_REGEX = "https://(.*)\\.facebook\\.com/login(.*)"
+ "|https://(.*)\\.facebook\\.com/oauth(.*)"
+ "|https://graph\\.facebook\\.com/(.*)" 
+ "|https://(.*)\\.facebook\\.com/(.*)/oauth(.*)"
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

chrome.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.msg === "searchSSO") {
            console.log("received search request");
            ssoSearch();
        }
    }
);

function buildSearchPatterns() {
    let patterns = [];
    for (let pattern of SSO_LOGIN_PATTERNS) {
        if (pattern.includes("{idp}")) {
            for (let idp of IDP_NAMES) {
                patterns.push(pattern.replace("{idp}", idp));
            }
        } else {
            patterns.push(pattern);
        }
    }
    return patterns.join(',');
}

function idpLinkSearch() {
    let regex = new RegExp(IDP_ENDPOINT_REGEX);
    for (let el of document.querySelectorAll("*")) {
        // search links for idp match
        if (regex.test(el.href)) {
            sendResult(el.href);
        }
    }
}

function sendResult(redirectUrl) {
    console.log(redirectUrl);
    // send results to interface
    chrome.runtime.sendMessage({"redirectUrl": redirectUrl}, function(response) {
        console.log("result sent from content script");
    });
}

function extractLink(attr) {
    console.log(attr);
    const regex = /("|')(.*?)("|')/;
    const link = attr.match(regex)[0];
    console.log(link);
    return link;
}

function ssoSearch() {
    
    idpLinkSearch();

    let searchPatterns = buildSearchPatterns();
    console.log(searchPatterns);
    for (let el of document.querySelectorAll(searchPatterns)) {
        if (el.hasAttribute("href")) {
            sendServerRequest(el.href);
        }
        else if (el.hasAttribute("onclick")) {
            const href = extractLink(el.getAttribute("onclick"));
            sendServerRequest(href);
        }
        else if (el.hasAttribute("type") && el.getAttribute("type") === "submit") {
            submitServerForm(el);
        }
        else if (el.tagName === "FORM") {
            submitServerForm(el);
        }
    }
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
    if (form === null) return; // no form found
    
    // form attributes
    const method = form.getAttribute("method");
    const path = form.getAttribute("action");
    
    // set form values
    let formData = new FormData(form);
    if (param != null && value != null) {
        formData.append(param, value);
    }
    
    // submit form
    let req = new XMLHttpRequest();
    req.open(method, path);
    req.send(new URLSearchParams(formData));
}

function sendServerRequest(url) {
    if (typeof url === "undefined") {
        return; // TODO: send message for "No SSO found"
    }

    //fetch(url, {redirect: 'manual'});
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.send(null);
}
