let Options, sessionToken;

function showLoading() {
    chrome.tabs.executeScript({
        // 20 seconds is the openRequest http timeout
        code: "var send_to_transmission_message_timeout = " + 20000 + ";"
    }, function() {
        chrome.tabs.executeScript({
            file: "js/message.js"
        }, function() {
            const element = "document.getElementById('send_to_transmission_message')";
            const setText = '<div class="send-to-transmission-pulse">Sending to Transmission...</div>';
            // Insert message into page
            chrome.tabs.executeScript({
                code: element + ".innerHTML='" + setText + "';"
            });
        });
    });

    // Inject the CSS for the message
    chrome.tabs.insertCSS({
        file: "css/message.css"
    });
};

function showMessage(message, error, long) {
    let messageVisibleTime;
    // Set length of time message appears
    if (long === true) {
        messageVisibleTime = 10000;
    } else if (error === true) {
        messageVisibleTime = 5000;
    } else {
        messageVisibleTime = 2500;
    };
    chrome.tabs.executeScript({
        code: "var send_to_transmission_message_timeout = " + messageVisibleTime + ";"
    }, function() {
        // Show success and error messages on the current tab
        chrome.tabs.executeScript({
            file: "js/message.js"
        }, function() {
            let setMessageBg;
            // Set the message text on the callback
            const element = "document.getElementById('send_to_transmission_message')";

            // If it's an error message, add the error background to the message div
            if (error === true) {
                setMessageBg = element + ".classList.add('send-to-transmission-message-error');";
            } else {
                setMessageBg = element + ".classList.add('send-to-transmission-message-success');";
            };

            // Add close onclick, pointer cursor to message, and hover text
            let setClickEvent = element + ".onclick = removeMessage;" + element + '.style = "cursor: pointer;";' 
                                + element + ".setAttribute('title', 'Click to close');"

            // Insert message into page
            chrome.tabs.executeScript({
                code: element + ".innerHTML='" + message + "';" + setMessageBg + 
                    ";" + setClickEvent
            });
        });
    });
    
    // Inject the CSS for the message
    chrome.tabs.insertCSS({
        file: "css/message.css"
    });
};

function openRequest(token) {
    // Build & open request from saved options 
    const http = new XMLHttpRequest();
    let targetUrl = "http://" + Options.host + ":" + Options.port + Options.url;

    try {
        if (Options.username.length === 0) {
            http.open("POST", targetUrl, true);
        } else {
            http.open("POST", targetUrl, true, Options.username, Options.password);
        };
    } catch (e) {
        console.log(e);
        return;
    }

    http.setRequestHeader("Content-type", "application/json");
    // Transmission Session Id is required by the rpc client to prevent CSRF attacks
    // We get this token from getToken and it's set as a global variable that is passed here 
    http.setRequestHeader("X-Transmission-Session-Id", token);

    // Set 20 second timeout as there is none by default
    http.timeout = 20000;

    return http;
};

function getToken() {
    // Get the Transmission session token from the 409 response page
    const http = openRequest();

    http.onreadystatechange = function() {
        if (http.readyState === XMLHttpRequest.DONE && http.status === 409) {
            response = JSON.stringify(http.responseText);
            // This finds the string we need and splits it into 2 parts
            // The second part contains the code we want
            match = response.match(/<code>X-Transmission-Session-Id: (.*?)<\/code>/);
            sessionToken = match[1];
        };
    };

    http.send();
};

function addTorrent(info, tab) {
    // Send href from right clicked link element to Transmission
    let http, params, response;

    http = openRequest(sessionToken);

    params = {
        "method": "torrent-add",
        "arguments": {
            "filename": info.linkUrl
        }
    };
    params = JSON.stringify(params);

    if (http === undefined) {
        showMessage("No IP/Hostname is set in options.", error=true);
        return;
    };

    showLoading();
    http.onreadystatechange = function() {
        let isDone = http.readyState === XMLHttpRequest.DONE;
        if (isDone && http.status === 200) {
            response = JSON.parse(http.responseText);
            // Display messages for success, duplicate or invalid files
            if ("torrent-duplicate" in response.arguments) {
                showMessage("Torrent already exists.", error=true);
            } else if (response.result === "success") {
                showMessage("Torrent successfully added.");
            } else {
                showMessage("Not a valid torrent file.", error=true);
            };
        }
        // If session token has expired then get new token and retry
        else if (isDone && http.status === 409) {
            getToken();
            addTorrent(info, tab);
            return;
        } 
        // Unauthorized error
        else if (isDone && http.status === 401) {
            showMessage("Incorrect username or password.", error=true)
        }
        // If no response from server then show error
        else if (isDone && http.status === 0) {
            showMessage(
                'Connection to the Transmission server failed.<br/><br/>' +
                'Check your settings and that remote access is allowed in Transmission.', 
                error=true, 
                long=true
            );
        }
        // Handle enexpected responses
        else if (isDone) {
            showMessage(
                'An unexpected error occured while attempting to connect to Transmission.<br/><br/>'+
                'Check your settings and that remote access is allowed in Transmission.<br/><br/>'+
                'Failing that, please submit a detailed support request via the chrome webstore.',
                error=true,
                long=true
            );
        }
    };

    http.ontimeout = function() {
        showMessage('The connection to the Transmission server timed out.', error=true);
    }

    http.send(params);
};

function initializeExtension() {
    getToken();
    // If first install open options page with "?install"
    // "?install" saves the default settings to chrome storage
    chrome.runtime.onInstalled.addListener(function(details) {
        if (Options.host) {
            return
        } else {
            chrome.tabs.create({url: "options.html?install"});        
        }
    });
}

function getOptions(init) {
    // Get chrome extension settings from storage
    chrome.storage.sync.get([
        'host',
        'port',
        'url',
        'username',
        'password'
    ], function(items) {
        // Update global Options variable
        Options = items;
        // If initializing extension get token & open options page if first install
        if (init) {
            initializeExtension();
        };
    });
};

// Get options and intialize extension
getOptions(init=true);

// Context menu
chrome.contextMenus.create({
    "title": "Send to Transmission",
    "contexts": ["link"],
    "onclick": addTorrent
});

// Add listener to chrome storage to get options when changed
chrome.storage.onChanged.addListener(function() {
    getOptions();
});

