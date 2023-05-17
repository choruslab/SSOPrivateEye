"use strict";

function getIdPName(url) {
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

function getSubstringIfFound(str, key) {
    if (str.includes(key)) {
        return str.substring(str.indexOf(key));
    }
    return str;
}

function getRPFromRedirectParam() {
    let rp = "This site";
    const params = new URLSearchParams(window.location.search);

    if (params.has("redirect_uri")) {
        const redirectUri = params.get("redirect_uri");
        try {
            // try url parser
            const url = getSubstringIfFound(redirectUri, "http");
            rp = new URL(url).hostname;
        } catch {
            // use strs
            const url = getSubstringIfFound(redirectUri, "http").substring(5);

            // remove trailing parameters
            if (url.includes("?")) {
                rp = url.substring(0, url.indexOf("?"));
            }
            // remove unwanted characters
            rp = rp.replace(/\//g, "");
        }
    } else if (params.has("next")) {
        // sometimes the RP URL is nested within the "next" parameter
        const next = new URL(params.get("next")).searchParams;
        let val = null;
        if (next.has("redirect_uri")) {
            val = next.get("redirect_uri");
        }
        if (next.has("domain")) {
            val = next.get("domain");
        }
        try {
            rp = new URL(val).hostname;
        } catch {
            rp = val;
        }
    }
    rp = rp.replace(/www./g, "");
    return rp;
}

function extractScopeFromUrl(url) {
    let str = String(url);
    
    if (!str.includes("scope")) {
        return []; 
    }
    //TODO use url parser instead
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

const IDP_ENDPOINT_REGEX = "https://(.*)\\.facebook\\.com/login(.*)"
+ "|https://(.*)\\.facebook\\.com/oauth(.*)"
+ "|https(:|%3A)(\/\/|%2F%2F)(.*).facebook.com(\/|%2F)(.*)(\/|%2F)oauth(.*)[^'\"]+"
+ "|https://graph\\.facebook\\.com/(.*)"
+ "|https://(.*)\\.facebook\\.com/(.*)login_button.php(.*)"
// Google
+ "|https://(.*)\\.google\\.com/(.*)/oauth(.*)"
+ "|https(:|%3A)(\/\/|%2F%2F)(.*).google.com(\/|%2F)(.*)(\/|%2F)oauth(.*)[^'\"]+"
+ "|https://oauth2\\.googleapis\\.com/(.*)"
+ "|https://openidconnect\\.googleapis\\.com/(.*)"
+ "|https://googleapis\\.com/oauth(.*)"
// Apple
+ "|https://(.*)\\.apple\\.com/auth(.*)"
+ "|https(:|%3A)(\/\/|%2F%2F)(.*).apple.com(\/|%2F)auth(.*)[^'\"]+";

const IDP_SCOPE_DESC = {
    "Facebook": {
        "basic_scopes": ["public_profile", "email"],
        "basic_info": {
            title: "Basic info",
            attributes: ["Name", "Email address", "Profile Picture"]
        },
        "non_basic_scopes": {
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
        "basic_scopes": ["profile", "email", "userinfo.email"],
        "basic_info": {
            title: "Basic info",
            attributes: ["Name", "Email address", "Language Preference", "Profile Picture"]
        },
        "non_basic_scopes": {
        
        },
        "required_scopes": {
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
        "basic_scopes": ["name", "email", "openid"],
        "basic_info": {
            title: "Basic info",
            attributes: ["Name", "Email address"]
        },
        "non_basic_scopes": {
            
        }
    }
}
