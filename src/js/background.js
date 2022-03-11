"use strict";

chrome.webRequest.onBeforeRedirect.addListener(
    function(details) {
        var redirectUrl = details.redirectUrl;
        chrome.storage.local.set({ redirectUrl });
        console.log(redirectUrl);
    }, {
        urls: ["http://*/*", "https://*/*"]
    }
);


