"use strict";

chrome.webRequest.onBeforeRedirect.addListener(
    function(details) {
        var redirectUrl = details.redirectUrl;
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
