"use strict";

chrome.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.msg === "searchSSO") {
            var sso1 = document.getElementById("js-google-oauth-login").href;
            var sso2 = document.getElementById("js-facebook-oauth-login").href;
            initiateRequest(sso1);
            initiateRequest(sso2);
        }
    }
);

function initiateRequest(url) {
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
