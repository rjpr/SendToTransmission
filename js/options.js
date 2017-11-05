function saveOptions(silentUpdate) {
    // Set variables for option values and success messages
    var host = document.getElementById("host").value;
    var port = document.getElementById("port").value;
    var url = document.getElementById("url").value;
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var btn = document.getElementById("save");
    var btnText = document.getElementById("content");
    var success = document.getElementById("success");

    // Get stored options
    chrome.storage.sync.set({
        host: host,
        port: port,
        url: url,
        username: username,
        password: password
    }, function() {
        if (silentUpdate != true) {
            // Remove button text and fade in success message 
            btn.classList.add("button-dark");
            btnText.style.display = "none";
            success.style.display = "block";
            success.classList.add("fadeIn");

            // Fade button text back in after timeout
            setTimeout(function() {
                btn.classList.remove("button-dark");
                btnText.style.display = "block";
                success.style.display = "none";
                btnText.classList.add("fadeIn");
            }, 2000);
        };
    });
};

function restoreOptions() {
    // Restore saved options to html fields
    chrome.storage.sync.get({
        host: null,
        port: null,
        url: "/transmission/rpc",
        username: null,
        password: null
    }, function(items) {
        document.getElementById("host").value = items.host;
        document.getElementById("port").value = items.port;
        document.getElementById("url").value = items.url;
        document.getElementById("username").value = items.username;
        document.getElementById("password").value = items.password;
    });
};

function toggleAdvanced() {
    // Show or hide the advanced section
    var div = document.getElementById("advanced-container");
    var icon = document.getElementById("toggle-icon");
    if (div.style.display === "block") {
        div.style.display = "none";
        icon.className = "";
    } else {
        div.style.display = "block";
        icon.className = "open";
    };
};

// Restore options on dom load and add event listeners to DOM elements
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("advanced-toggle").addEventListener("click", toggleAdvanced);

// If fresh install, silently save default options
var url = new URL(window.location.href);
if (url.searchParams.get("install") != null) {
    // Remove install from url to prevent accidental data overwrite (i.e. if they reload)
    window.history.replaceState('options', 'Options', 'options.html');

    // Set default options in DOM
    document.getElementById("host").value = "localhost";
    document.getElementById("port").value = 9091;
    document.getElementById("url").value = "/transmission/rpc";

    // Save options
    saveOptions(silentUpdate=true);
};