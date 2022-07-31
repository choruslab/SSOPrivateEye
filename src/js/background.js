"use strict";

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

chrome.webRequest.onBeforeRedirect.addListener(
    function(details) {
        const redirectUrl = details.redirectUrl;
        const regex = new RegExp(IDP_ENDPOINT_REGEX);
        if (regex.test(redirectUrl)) {
            // url is a match for idp
            sendResult(redirectUrl);
        } else {
            // retry request to url
            fetch(redirectUrl)
                .then(response => console.log(response));
        }
    }, {
        urls: ["http://*/*", "https://*/*"]
    }
);

chrome.runtime.onMessage.addListener(
    function(msg, sender, sendResponse) {
        console.log(msg);
        if (msg.type == "RETRY_REQUEST") {
            checkUrlAndRetryIfNeeded(msg.url);
        }
    }
);

function sendResult(redirectUrl) {
    console.log(redirectUrl);
    // send results to interface
    chrome.runtime.sendMessage({
        msg: 'SHOW_RESULT',
        redirectUrl: redirectUrl
    }, function(response) {
        // redirect url sent to popup
    });

    //chrome.runtime.sendMessage({"redirectUrl": redirectUrl}, function(response) {
    //    console.log("result sent from background");
    //});
}

function checkUrlAndRetryIfNeeded(url) {
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    if (regex.test(url)) {
        // url is a match for idp
        return;
    } else {
        // retry request to url
        fetch(url)
            .then(response => console.log(response));
    }
}
