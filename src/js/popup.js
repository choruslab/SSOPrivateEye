"use strict";

const IDP_SCOPE_DESC = {
    "Facebook": {
        "basic_scopes": ["public_profile"],
        "basic_info": {
            title: "Basic info",
            title_label: "(required)",
            attributes: ["Name", "Profile Picture"]
        },
        "non_basic_scopes": {
            "email": {
                title: "Email Address"
            },
            "openid": {
                title: "User ID",
                desc: "Unique user ID for the app"
            },
            "user_birthday": {
                title: "Birthday",
                desc: "Based on your profile settings, this can be MM-DD-YYYY or MM-DD or YYYY"
            },
            "user_age_range": {
                title: "Age Range",
                desc: "Age as a range (e.g., more than 18, less than 21)"
            },
            "user_gender": {
                title: "Gender",
                desc: "Gender and/or preferred pronouns"
            },
            "user_friends": {
                title: "Facebook Friends",
                desc: "List of your Facebook friends who also use this website"
            },
            "user_hometown": {
                title: "Hometown (city/town)",
                desc: "Hometown as seen on your profile"
            },
            "user_likes": {
                title: "Facebook Likes (pages)",
                desc: "List of all Facebook Pages you have liked"
            },
            "user_link": {
                title: "Facebook Profile (link)",
                desc: "Link to your Facebook profile"
            },
            "user_location": {
                title: "Location (city/town)",
                desc: "Location as seen on your profile"
            },
            "user_photos": {
                title: "Facebook Photos (tagged or uploaded)",
                desc: "Photos you are tagged in or you have uploaded"
            },
            "user_posts": {
                title: "Facebook Profile (posts)",
                desc: "Posts you have published on your timeline"
            },
            "user_videos": {
                title: "Facebook Videos (tagged or uploaded)",
                desc: "Videos you are tagged in or you have uploaded"
            },
            "user_messenger_contact": {
                title: "Contact via Messenger",
                desc: "Site can contact you on a Messenger chat thread"
            }
        }
    },
    "Google": {
        "basic_scopes": ["profile"],
        "basic_info": {
            title: "Basic info",
            title_label: "(required)",
            attributes: ["Name", "Language Preference", "Profile Picture"]
        },
        "non_basic_scopes": {
            "email": {
                title: "Email address"
            },
            "openid": {
                title: "User ID",
                desc: "Unique user ID for the app"
            },
            /* People API */
            "user.birthday.read": {
                title: "Birthday",
                desc: "Exact date of birth"
            },
            "user.gender.read": {
                title: "Gender",
                desc: "Gender info"
            },
            "contacts": {
                title: "Contacts (edit/delete)"
            },
            "contants.readonly": {
                title: "Contacts (read only)"
            },
            "user.addresses.read": {
                title: "Street address"
            },
            "user.emails.read": {
                title: "Email addresses",
                desc: "Google email addresses"
            },
            "user.phonenumbers.read": {
                title: "Phone Number",
                desc: "Personal phone numbers"
            },
            "userinfo.email": {
                title: "Email address"
            },
            "userinfo.profile": {
                title: "Public Profile",
                desc: "Publicly available profile info"
            },
            /* Google apps */
            "calendar": {
                title: "Calendar (edit/delete)",
                desc: "Calendars you can access using Google Calendar"
            },
            "calendar.readonly": {
                title: "Calendar (ready only)",
                desc: "Calendars you can access using Google Calendar"
            },
            "gmail.readonly": {
                title: "Gmail Messages (read only)",
                desc: "Email messages and settings"
            },
            "drive.readonly": {
                title: "Google Drive files (ready only)"
            },
            "drive": {
                title: "Google Drive files (edit/create/delete)"
            },
            "photoslibrary.readonly": {
                title: "Google Photos (read only)"
            },
            "youtube.readonly": {
                title: "YouTube account (read only)",
                desc: "Info on your YouTube account"
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
                desc: "(can be hidden during login)"
            },
            "openid": {
                title: "User ID",
                desc: "Unique user ID for the app"
            }
        }
    }
}

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

var processed_idps = [];

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // ask script to search for SSO logins
    chrome.tabs.sendMessage(tabs[0].id, {msg: "searchSSO"}, function(response) {
        //console.log(response.result);
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "SHOW_RESULT") {
            const url = request.redirectUrl;
            const regex = new RegExp(IDP_ENDPOINT_REGEX);
            const idp = getProviderName(url);
            // skip if idp has already been processed or if url is not idp
            if (!processed_idps.includes(idp) && regex.test(url)) {
                showResult(url);
                processed_idps.push(idp);
            }
        }
        if (request.msg === "GET_NUMBER_OF_PROCESSED_IDPS") {
            sendResponse({num_processed_idps: processed_idps.length});
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

    // heading for the content area
    content.appendChild(newElement("card-content-header", "Retrieve your ..."));
    content.appendChild(newElement("hr-after-basic-scopes"));

    // get scope values from url
    var url_scopes = extractScopesFromUrl(url);
 
    // basic info
    if (idp === "Google" || idp === "Facebook" || (idp === "Apple" && url_scopes.includes("name"))) {
        // (basic info is optional for Sign in with Apple)
        const basic_info = IDP_SCOPE_DESC[idp]["basic_info"];
        let title = newElement("scope-title", basic_info.title);
        if (basic_info.hasOwnProperty("title_label")) {
            // label to indicated required fields
            title.appendChild(newElement("scope-title-required", basic_info.title_label));
        }
        content.appendChild(title);
        // individual attributes
        basic_info.attributes.forEach(attr => {
            content.appendChild(newElement("scope-desc", attr));
        });
        content.appendChild(newElement("hr-after-basic-scopes"));
    }

    // non-basic info
    let counter = 1;
    for (var key of Object.keys(IDP_SCOPE_DESC[idp]["non_basic_scopes"])) {
        if (url_scopes.length > 0 && url_scopes.includes(key)) {
            const val = IDP_SCOPE_DESC[idp]["non_basic_scopes"][key];
            let title = newElement("scope-title", val.title);
            content.appendChild(title);

            if (val.hasOwnProperty("desc")) { // optional description
                content.appendChild(newElement("scope-desc", val.desc));
            }
            
            if (counter < url_scopes.length) {
                content.appendChild(newElement("hr-after-basic-scopes"));
            }
            counter++;
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
    //content.appendChild(newElement("hr-after-basic-scopes"));
    return content;
}

async function showResult(url) {
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

    return true;
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
    return new URL(url).hostname;
}

function extractScopesFromUrl(url) {
    let str = String(url);
    
    if (!str.includes("scope")) {
        return []; 
    }
    str = str.replace("scope%3D", "scope=");
    
    // substr following scope=
    let idx1 = str.indexOf("scope=") + 6;
    let ss1 = str.substring(idx1);
    
    // first & after scope=
    ss1 = ss1.replace("%26", "&");
    let idx2 = ss1.indexOf("&");
    if (idx2 == -1) { // none
        idx2 = str.length;
    } else {
        idx2 = idx1 + idx2;
    }
    const scope = str.substring(idx1, idx2)
    
    // split into individual scope values
    let scope_arr = scope.split(/%20|%2B|%2C|%252C|,|\+/i);
    scope_arr.forEach(function(val, index, arr) {
        console.log(val);
        if (val.includes("%2F")) {
            let i1 = val.lastIndexOf("%2F");
            arr[index] = val.substring(i1 + 3);
        } else if (val.includes("%252C")) {
            let i1 = val.lastIndexOf("%252C");
            arr[index] = val.substring(i1 + 5);
        }
    });
    return scope_arr;
}

