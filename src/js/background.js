"use strict";

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

chrome.webRequest.onBeforeRedirect.addListener(
    function(details) {
        var redirectUrl = details.redirectUrl;
        checkUrlAndRetryIfNeeded(redirectUrl);
        sendResult(redirectUrl);
    }, {
        urls: ["http://*/*", "https://*/*"]
    }
);

function sendResult(redirectUrl) {
    console.log(redirectUrl);
    // send results to interface
    chrome.runtime.sendMessage({"redirectUrl": redirectUrl}, function(response) {
        console.log("result sent from background");
    });
}

function checkUrlAndRetryIfNeeded(url) {
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    if (regex.test(url)) {
        // url is a match for idp
        return;
    } else {
        // retry request to url
        fetch(url, {redirect: 'follow'});
    }
}
