"use strict";

const SSO_LOGIN_PATTERNS = [
    "[aria-label='Sign in with {idp}']", // zoom
    "#social-login-{idp}", // bit.ly
    "[data-testid='{idp}-login-button']", // tumblr
    "#js-{idp}-oauth-login", // nytimes
    "[href*='start-auth/{idp}']",
    "[href*='connect/{idp}']", // medium
    "[href*='signin?openid']", // imdb
    ".fm-sns-item.{idp}" // aliexpress
];

const IDP_NAMES = [
    "GOOGLE", "Google", "google", "gmail",
    "FACEBOOK", "Facebook", "facebook",
    "APPLE", "Apple", "apple"
];

chrome.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.msg === "searchSSO") {
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

function ssoSearch() {
    let searchPatterns = buildSearchPatterns();
    for (let item of document.querySelectorAll(searchPatterns)) {
        if (item.hasAttribute("href")) {
            sendRequest(item.href);
        }
    }
}

function sendRequest(url) {
    if (typeof url === "undefined") {
        return; // TODO: send message for "No SSO found"
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.addEventListener("error", function() {
        console.log(xhr);
    });
    xhr.send(null);
}
