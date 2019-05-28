    connected = document.getElementById("connected");
    log = document.getElementById("log");
    chat = document.getElementById("chat");
    form = chat.form;
    state = document.getElementById("status");
	var messagealert = new Audio('message.mp3');
	var erroralert = new Audio('error.mp3');
	var connectedalert = new Audio('connected.mp3');

    if (window.WebSocket === undefined)
    {
        state.innerHTML = "sockets not supported";
        state.className = "fail";
    }
    else
    {
        if (typeof String.prototype.startsWith != "function")
        {
            String.prototype.startsWith = function (str)
            {
                return this.indexOf(str) == 0;
            };
        }
    
        window.addEventListener("load", onLoad, false);
    }
	
    function onLoad()
    {
        var wsUri = "ws://127.0.0.1:443";
        websocket = new WebSocket(wsUri);
		websocket.binaryType = 'arraybuffer';
        websocket.onopen = function(evt) { onOpen(evt) };
        websocket.onclose = function(evt) {  onClose(evt) };
        websocket.onmessage = function(evt) { onMessage(evt) };
        websocket.onerror = function(evt) { onError(evt) };
		document.getElementById("serverip").innerText = "Current server: 127.0.0.1";
    }
  
    function onOpen(evt)
    {
        state.className = "success";
        state.innerHTML = "Connected to server!";
		websocket.send("This user has connected to the server.");
		document.getElementById("connectbutton").innerText = "Disconnect";
		document.getElementById("ipinputbox").value = "";
		connectedalert.play();
    }
  
    function onClose(evt)
    {
        state.className = "fail";
        state.innerHTML = "Not connected, please either refresh page or type in IP Address in input box below and press 'Connect'.";
        connected.innerHTML = "0";
		websocket.send("This user has disconnected to the server.");
		document.getElementById("connectbutton").innerText = "Connect";
		document.getElementById("log").innerHTML = "";
		document.getElementById("serverip").innerText = "Current server: null";
    }
  
    function onMessage(evt)
    {
		var message = evt.data;
		
        if (message.startsWith("log:"))
        {
            message = message.slice("log:".length);
            log.innerHTML = '<li class="message" id="messages">' + message + "</li>" + log.innerHTML;
        }
        else if (message.startsWith("connected:"))
        {
            message = message.slice("connected:".length);
            connected.innerHTML = message;	
        }
		messagealert.play();
    }

    function onError(evt)
    {
        state.className = "fail";
        state.innerHTML = "Communication error";	
		websocket.send("This user has crashed.");
		document.getElementById("connectbutton").innerText = "Connect";
		erroralert.play();
    }
	
    function addMessage()
    {
        var message = chat.value;
		if (message == "" || message == " " || message.startsWith(" ", 0) || message.endsWith(" ", 150))
		{
			erroralert.play();
			alert("Illegal value for text message.\nPlease type something else.\n\nType of illegal messages include empty messages and messages that include only spaces.");
		}
		else
		{
			chat.value = "";
			websocket.send(message);
		}
    }	
	
	function reload()
    {
		onClose();
		document.getElementById("connectbutton").innerText = "Connect";
		var ipaddress = document.getElementById("ipinputbox").value
        var wsUri = "ws://" + ipaddress + ":443";
        websocket = new WebSocket(wsUri);
		websocket.onopen = function(evt) { onOpen(evt) };
        websocket.onclose = function(evt) {  onClose(evt) };
        websocket.onmessage = function(evt) { onMessage(evt) };
        websocket.onerror = function(evt) { onError(evt) };
		document.getElementById("connectbutton").innerText = "Disonnect";
		document.getElementById("ipinputbox").value = "";
		document.getElementById("serverip").innerText = "Current server: " + ipaddress;
    }
	
	function ipenter(e) {
    if (e.keyCode == 13) {
		reload();
        return false;
    }
}