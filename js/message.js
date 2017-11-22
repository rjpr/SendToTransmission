var id = "send_to_transmission_message";  // The ID of the message div being added

// Remove existing message if exists
if (document.getElementById(id)) {
    var existing = document.getElementById(id);
    existing.parentNode.removeChild(existing);
};

// Add message div with fadeIn class to current tab body
var div = document.createElement("div");
div.id = id;
div.className = "send-to-transmission-message";
div.classList.add("send-to-transmission-fade-in");
document.body.appendChild(div);

// Fade out and remove message div after timeout
setTimeout(
    function() {
        var msg = document.getElementById(id);
        // Don't try to remove messages that have already been removed by newly generated messages
        if (msg != undefined) {
            msg.classList.remove("send-to-transmission-fade-in");
            msg.classList.add("send-to-transmission-fade-out");
    
            // Removing the div at the same time as the animation finishes causes flickering,
            // removing it slightly before the animation finishes seems to mitigate this
    
            setTimeout(function() {
                // Check the element again as the msg variable has changed since being set
                if (document.getElementById(id) != undefined) {
                    msg.parentNode.removeChild(msg);                    
                }
            }, 470);
        };
    }, 
    send_to_transmission_message_timeout  // This is set by showMessage in background.js 
);
