"use strict";

const IDP_SCOPE_DESC = {
    "Facebook": {
        "basic_scopes": ["public_profile"],
        "basic_info": {
            title: "Basic info",
            attributes: ["Name", "Profile Picture"]
        },
        "non_basic_scopes": {
            "email": {
                title: "Email Address",
                desc: "Retrieve your email address"
            },
            "openid": {
                title: "User ID",
                desc: "Retrieve a unique user ID for the app"
            },
            "user_birthday": {
                title: "Birthday",
                desc: "Retrieve your date of birth. Based on your profile settings, this can be MM-DD-YYYY or MM-DD or YYYY"
            },
            "user_age_range": {
                title: "Age Range",
                desc: "Retrieve your age as a range (e.g., more than 18, less than 21)"
            },
            "user_gender": {
                title: "Gender",
                desc: "Retrieve your gender and/or preferred pronouns"
            },
            "user_friends": {
                title: "Facebook Friends",
                desc: "Retrieve a list of your Facebook friends who also use this website"
            },
            "user_hometown": {
                title: "Hometown (city/town)",
                desc: "Retrieve your hometown as seen on your profile"
            },
            "user_likes": {
                title: "Facebook Likes (pages)",
                desc: "Retrieve a list of all Facebook Pages you have liked"
            },
            "user_link": {
                title: "Facebook Profile (link)",
                desc: "Retrieve a link to your Facebook profile"
            },
            "user_location": {
                title: "Location (city/town)",
                desc: "Retrieve your location as seen on your profile"
            },
            "user_photos": {
                title: "Facebook Photos (tagged or uploaded)",
                desc: "Retrieve photos you are tagged in or you have uploaded"
            },
            "user_posts": {
                title: "Facebook Profile (posts)",
                desc: "Retrieve posts you have published on your timeline"
            },
            "user_videos": {
                title: "Facebook Videos (tagged or uploaded)",
                desc: "Retrieve videos you are tagged in or you have uploaded"
            }
        }
    },
    "Google": {
        "basic_scopes": ["profile"],
        "basic_info": {
            title: "Basic info",
            attributes: ["Name", "Language Preference", "Profile Picture"]
        },
        "non_basic_scopes": {
            "email": {
                title: "Email address",
                desc: "Retrieve your email address"
            },
            "openid": {
                title: "User ID",
                desc: "Retrieve a unique user ID for the app"
            },
            /* People API */
            "user.birthday.read": {
                title: "Birthday",
                desc: "Retrieve your exact date of birth"
            },
            "user.gender.read": {
                title: "Gender",
                desc: "Retrieve your gender info"
            },
            "contacts": {
                title: "Contacts (edit/delete)",
                desc: "Retrieve, change, or permanently delete your contacts"
            },
            "contants.readonly": {
                title: "Contacts (read only)",
                desc: "Retrieve your contacts"
            },
            "user.addresses.read": {
                title: "Street address",
                desc: "Retrieve your street addresses"
            },
            "user.emails.read": {
                title: "Email addresses",
                desc: "Retrieve your Google email addresses"
            },
            "user.phonenumbers.read": {
                title: "Phone Number",
                desc: "Retrieve your personal phone numbers"
            },
            "userinfo.email": {
                title: "Email address",
                desc: "Retrieve your name, email address, language preference, and profile picture"
            },
            "userinfo.profile": {
                title: "Public Profile",
                desc: "Publicly available profile info"
            },
            /* Google apps */
            "calendar": {
                title: "Calendar (edit/delete)",
                desc: "Retrieve, change, or permanently delete any calendar you can access using Google Calendar"
            },
            "calendar.readonly": {
                title: "Calendar (ready only)",
                desc: "Retrieve any calendar you can access using your Google Calendar"
            },
            "gmail.readonly": {
                title: "Gmail Messages (read only)",
                desc: "Retrieve your email messages and settings"
            },
            "drive.readonly": {
                title: "Google Drive files (ready only)",
                // "See and download all your Google Drive files"
                desc: "Retrieve all your Google Drive files"
            },
            "drive": {
                title: "Google Drive files (edit/delete)",
                // "See, edit, create, and delete all of your Google Drive files"
                desc: "Retrieve, change, create, or delete all of your Google Drive files"
            },
            "photoslibrary.readonly": {
                title: "Google Photos (read only)",
                // "View your Google Photos library"
                desc: "Retrieve your Google Photos library"
            },
            "youtube.readonly": {
                title: "YouTube account (read only)",
                // "View your YouTube account"
                desc: "Retrieve your YouTube account"
            }
        }
    },
    "Apple": {
        "basic_scopes": ["name"],
        "basic_info": {
            title: "Basic info",
            attributes: ["Name (can be hidden during login)"]
        },
        "non_basic_scopes": {
            "email": {
                title: "Email address",
                desc: "Retrieve your email address (Can be hidden during login)"
            },
            "openid": {
                title: "User ID",
                desc: "Retrieve a unique user ID for the app"
            }
        }
    }
}

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

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // ask script to search for SSO logins
    chrome.tabs.sendMessage(tabs[0].id, {msg: "searchSSO"}, function(response) {
        //console.log(response.result);
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        const regex = new RegExp(IDP_ENDPOINT_REGEX);
        if (regex.test(request.redirectUrl)) {
            showResult(request.redirectUrl);
        } 
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

function getScopeContent(url) {
    const idp = getProviderName(url);
    const content = newElement("card-content");

    // get scope values from url
    var url_scopes = extractScopesFromUrl(url);
 
    // basic info
    if (idp === "Google" || idp === "Facebook" || (idp === "Apple" && url_scopes.includes("name"))) {
        // (basic info is optional for Sign in with Apple)
        const basic_info = IDP_SCOPE_DESC[idp]["basic_info"];
        content.appendChild(newElement("scope-title", basic_info.title));
        basic_info.attributes.forEach(attr => {
            content.appendChild(newElement("scope-desc", attr));
        });
        content.appendChild(newElement("hr-after-basic-scopes"));
    }

    // non-basic info
    for (var key of Object.keys(IDP_SCOPE_DESC[idp]["non_basic_scopes"])) {
        if (url_scopes.length > 0 && url_scopes.includes(key)) {
            const val = IDP_SCOPE_DESC[idp]["non_basic_scopes"][key];
            content.appendChild(newElement("scope-title", val.title));
            content.appendChild(newElement("scope-desc", val.desc));
        }
    }

    // check if any scope is remaining to be added (i.e., not in known list)
    const basic = IDP_SCOPE_DESC[idp]["basic_scopes"];
    const non_basic = Object.keys(IDP_SCOPE_DESC[idp]["non_basic_scopes"]);
    for (var i = 0; i < url_scopes.length; i++) {
        const val = url_scopes[i];
        if (basic.includes(val)) {
            continue;
        }
        if (!non_basic.includes(val)) {
            content.appendChild(newElement("scope-title", val));
        }
    }
    return content;
}

function showResult(url) {
    const idp = getProviderName(url);
    
    // show idp info on a new card
    const header = newElement("card-header", idp);
    const content = getScopeContent(url);

    const card = newElement("card");
    card.appendChild(header);
    card.appendChild(content);
 
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
    return "";
}

function extractScopesFromUrl(url) {
    const str = String(url);
    
    if (!str.includes("scope=")) {
        return []; 
    }
    
    // substr following scope=
    let idx1 = str.indexOf("scope=") + 6;
    let ss1 = str.substring(idx1);
    
    // first & after scope=
    let idx2 = ss1.indexOf("&");
    if (idx2 == -1) { // none
        idx2 = str.length;
    } else {
        idx2 = idx1 + idx2;
    }
    const scope = str.substring(idx1, idx2)
    
    // split into individual scope values
    let scope_arr = scope.split(/%20|%2C|,|\+/i);
    scope_arr.forEach(function(val, index, arr) {
        if (val.includes("%2F")) {
            let i1 = val.lastIndexOf("%2F");
            arr[index] = val.substring(i1 + 3);
        }
    });
    return scope_arr;
}

