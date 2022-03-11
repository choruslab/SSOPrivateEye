"use strict";

if (document.location.href.includes('login')) {
    var sso = document.getElementById('js-google-oauth-login').href;

    // xhr request to provider
    var xhr = new XMLHttpRequest();
    xhr.open("GET", sso, true);
    xhr.withCredentials = true;
    xhr.addEventListener('error', function() {
        console.log(xhr);
    });
    xhr.send(null)
}
