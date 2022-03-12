"use strict";

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // ask script to search for SSO logins
    chrome.tabs.sendMessage(tabs[0].id, {msg: "searchSSO"}, function(response) {
        console.log(response.result);
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        showResult(request.redirectUrl);
    }
);

function showResult(url) {
    var logins = document.getElementById("login-options");
    var sso = logins.insertRow(1);
    var c0 = sso.insertCell(0);
    var c1 = sso.insertCell(1);
    c0.innerHTML = getProviderName(url);
    c1.innerHTML = getScopeValue(url);
}

function getProviderName(url) {
    var str = String(url);
    if (str.includes("google")) {
        return "Google";
    }
    if (str.includes("facebook")) {
        return "Facebook";
    }
    if (str.includes("apple")) {
        return "Apple";
    }
    if (str.includes("LinkedIn")) {
        return "LinkedIn";
    }
}

function getScopeValue(url) {
    var str = String(url);
    if (!str.includes("scope=")) {
        return; 
    }
    // substr following scope=
    var idx1 = str.indexOf("scope=") + 6;
    var ss1 = str.substring(idx1);
    // first & after scope=
    var idx2 = ss1.indexOf("&");
    if (idx2 == -1) { // none
        idx2 = str.length;
    } else {
        idx2 = idx1 + idx2;
    }
    var scope = str.substring(idx1, idx2)
    return scope;
}

