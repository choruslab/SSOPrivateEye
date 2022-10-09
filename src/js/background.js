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

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    console.log(info.pageUrl);
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    if (regex.test(info.pageUrl)) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                msg: "SHOW_PERMISSIONS"
            });
        });
    }
});

chrome.contextMenus.create({
    id: "ctxMenuViewPermissions",
    title: "View login permissions...",
    contexts: ["all"],
});

chrome.webRequest.onBeforeRedirect.addListener(
    function(details) {
        const redirectUrl = details.redirectUrl;
        const regex = new RegExp(IDP_ENDPOINT_REGEX);
        if (regex.test(redirectUrl)) {
            // url is a match for idp
            sendResultToPopup(redirectUrl);
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
    function(request, sender, sendResponse) {
        console.log(request);
        if (request.msg == "RETRY_REQUEST") {
            checkUrlAndRetryIfNeeded(request.url);
        }
    }
);

function sendResultToPopup(redirectUrl) {
    chrome.runtime.sendMessage({
        msg: 'SHOW_RESULT',
        redirectUrl: redirectUrl
    });
    console.log(redirectUrl);
}

function checkUrlAndRetryIfNeeded(url) {
    const regex = new RegExp(IDP_ENDPOINT_REGEX);
    if (regex.test(url)) {
        // url is a match for idp
        return;
    } else {
        // retry request to url
        fetch(url).then(response => console.log(response));
    }
}
