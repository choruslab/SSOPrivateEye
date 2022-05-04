"use strict";

const IDP_SCOPE_DESC = {
    "Facebook": {
        "email": {
            title: "Email address",
            desc: "Retrieve your email address"
        },
        "public_profile": {
            title: "Profile",
            desc: "Retrieve your name and profile picture"
        },
        "user_age_range": {
            title: "Age (range)",
            desc: "Retrieve your age as a range (e.g., more than 18, less than 21)"
        },
        "user_birthday": {
            title: "Date of birth",
            desc: "Retrieve your date of birth. Depending on your Facebook privacy settings, this can be the exact date (MM/DD/YYYY) or only the year (YYYY) or without the year (MM/DD)"
        },
        "user_friends": {
            title: "Friends list",
            desc: "Retrieve a list of your Facebook friends who also use this website"
        },
        "user_gender": {
            title: "Gender",
            desc: "Retrieve your gender and/or preferred pronouns"
        },
        "user_hometown": {
            title: "Hometown (city/town)",
            desc: "Retrieve your hometown as seen on your profile"
        },
        "user_likes": {
            title: "Page Likes",
            desc: "Retrieve a list of all Facebook Pages you have liked"
        },
        "user_link": {
            title: "Profile link",
            desc: "Retrieve a link to your Facebook profile"
        },
        "user_location": {
            title: "Location (city/town)",
            desc: "Retrieve your location as seen on your profile"
        },
        "user_photos": {
            title: "Photos",
            desc: "Retrieve photos you are tagged in or you have uploaded"
        },
        "user_posts": {
            title: "Profile Posts",
            desc: "Retrieve posts you have published on your timeline"
        },
        "user_videos": {
            title: "Videos",
            desc: "Retrieve videos you are tagged in or you have uploaded"
        }
    },
    "Google": {
        /* Sign-In */
        "email": {
            title: "Email address",
            desc: "Retrieve your email address"
        },
        "profile": {
            title: "Profile",
            desc: "Retrieve your name, email address, language preference, and profile picture"
        },
        "openid": {
            title: "Identification",
            desc: "Retrieve your name, email address, language preference, and profile picture"
        },
        /* People API */
        "contacts": {
            title: "Contacts",
            desc: "Retrieve, change, or permanently delete your contacts"
        },
        "contants.readonly": {
            title: "Contacts",
            desc: "Retrieve your contacts"
        },
        "user.addresses.read": {
            title: "Street address",
            desc: "Retrieve your street addresses"
        },
        "user.birthday.read": {
            title: "Date of birth",
            desc: "Retrieve your exact date of birth"
        },
        "user.emails.read": {
            title: "Email address",
            desc: "Retrieve your Google email addresses"
        },
        "user.gender.read": {
            title: "Gender",
            desc: "Retrieve your gender info"
        },
        "user.phonenumbers.read": {
            title: "Phone number",
            desc: "Retrieve your personal phone numbers"
        },
        "userinfo.email": {
            title: "Email address",
            desc: "Retrieve your name, email address, language preference, and profile picture"
        },
        "userinfo.profile": {
            title: "Google Profile",
            desc: "Retrieve your name, email address, language preference, and profile picture"
        },
        /* Google apps */
        "calendar": {
            title: "Calendar",
            desc: "Retrieve, change, or permanently delete any calendar you can access using Google Calendar"
        },
        "calendar.readonly": {
            title: "Calendar",
            desc: "Retrieve any calendar you can access using your Google Calendar"
        },
        "gmail.readonly": {
            title: "Gmail (email content)",
            desc: "Retrieve your email messages and settings"
        },
        "drive.readonly": {
            title: "Google Drive",
            // "See and download all your Google Drive files"
            desc: "Retrieve all your Google Drive files"
        },
        "drive": {
            title: "Google Drive",
            // "See, edit, create, and delete all of your Google Drive files"
            desc: "Retrieve, change, create, or delete all of your Google Drive files"
        },
        "photoslibrary.readonly": {
            title: "Photos",
            // "View your Google Photos library"
            desc: "Retrieve your Google Photos library"
        },
        "youtube.readonly": {
            title: "YouTube",
            // "View your YouTube account"
            desc: "Retrieve your YouTube account"
        }
    },
    "Apple": {
        "email": {
            title: "Email address",
            desc: "Retrieve your email address"
        },
        "name": {
            title: "Profile",
            desc: "Retrieve your full name"
        }
    }
}

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

function newElement(classname, text=undefined) {
    const el = document.createElement("div");
    el.classList.add(classname);
    // (optional) add text to element
    if (typeof text !== 'undefined') {
        el.append(text);
    }
    return el;
}

function showResult(url) {
    const idp = getProviderName(url);
    // create a new card to show info on idp
    const header = newElement("card-header", idp);
    const content = newElement("card-content");
    // add scope descriptions to the card
    getScopes(url).forEach(scope => {
        const title = newElement("scope-title", IDP_SCOPE_DESC[idp][scope].title)
        const desc = newElement("scope-desc", IDP_SCOPE_DESC[idp][scope].desc);
        content.appendChild(title);
        content.appendChild(desc);
    });
    const card = newElement("card");
    card.appendChild(header);
    card.appendChild(content);
 
    // add footer if needed
    if (idp === "Apple") {
        const footer = newElement("card-footer");
        const a = document.createElement("a");
        a.appendChild(document.createTextNode('Learn about "Hide My Email"'));
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.href = "https://support.apple.com/en-ca/HT210425";
        footer.appendChild(a);
        card.appendChild(footer);
    }
 
    // show card on popup window
    const column = newElement("column");
    column.appendChild(card);
    document.getElementById("login-options").appendChild(column);
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

function getScopes(url) {
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
    // split into individual scope values
    return scope.split(/%20|%2C|\+/i);
}

