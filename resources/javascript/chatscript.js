var username = prompt("Preferred Name:");
if (username == null)
{
  alert("Username must not be empty.");
  location.reload();
}else if (username == "")
{
  alert("Username must not be empty.");
  location.reload();
}else if (username.includes(" ") == true)
{
  alert("Username are not allowed to have spaces in them.");
  location.reload();
}

var unread = 0;
var messagecount = 0;

const CLIENT_ID = 'mWce2OJGr3nCwHSm';

const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: username,
    color: "#065fd4",
  },
});

let members = [];
const room = drone.subscribe('observable-room', { historyCount: 10 });
drone.on('open', error => {
  if (error) {
    return console.error(error);
    document.getElementById("connection-status").innerText = "Error";
    document.getElementById("connection-status").className = "error";
  }
  console.log('Connecting to Chat Server...');
  document.getElementById("connection-status").innerText = "Connecting...";
  document.getElementById("connection-status").className = "connecting";
  room.on('open', error => {
    if (error) {
      return console.error(error);
    }
    console.log('Connected.');
    document.getElementById("connection-status").innerText = "Connected";
    document.getElementById("connection-status").className = "connected";
    document.getElementById("message-form__input").focus();
  });
	room.on('data', (text, member) => {
		const el = "messages";
		if (member) {
			var d = new Date();
			var hour = d.getHours();
			var minute = (d.getMinutes()<10?'0':'') + d.getMinutes();
			if (hour > 12)
			{
				hour = hour - 12;
				var ampm = "PM";
			}
			else {
				var ampm = "AM";
			}
            var clock = hour + ":" + minute + " " + ampm;
			if (member.clientData.name == username){
				responsiveChatPush('.chat', username, 'me', clock, text);
			}
			else {
				responsiveChatPush('.chat', member.clientData.name, 'you', clock, text);
			}
		} else {
		  // Message is from server
		}
	  });
});

room.on('members', m => {
 members = m;
 updateMembersDOM();
});

  room.on('member_join', member => {
    members.push(member);
    updateMembersDOM();
  });

  room.on('member_leave', ({id}) => {
    const index = members.findIndex(member => member.id === id);
    members.splice(index, 1);
    updateMembersDOM();
  });

drone.on('error', () => {
  console.error("Connection error.");
  document.getElementById("connection-status").innerText = "Error"
  document.getElementById("connection-status").className = "error";
});
drone.on('close', () => {
  console.log("Connection closed.");
  document.getElementById("connection-status").innerText = "Connection terminated"
  document.getElementById("connection-status").className = "error";
});

drone.on('disconnect', () => {
  console.log("Disconnected from server, reconnecting...");
  document.getElementById("connection-status").innerText = "Reconnecting..."
  document.getElementById("connection-status").className = "connecting";
});

function createMemberElement(member) {
  const { name, color } = member.clientData;
  const el = document.createElement('p');
  el.appendChild(document.createTextNode(name));
  el.className = 'member';
  el.style.color = color;
  return el;
}

function updateMembersDOM() {
  document.getElementsByClassName("members-count")[0].innerText = `${members.length} users in room:`;
  document.getElementsByClassName("members-list")[0].innerHTML = '';
  members.forEach(member =>
    document.getElementsByClassName("members-list")[0].appendChild(createMemberElement(member))
  );
}

function responsiveChat(element) {
    $(element).html('<form class="chat"><span></span><div class="messages"></div><input id="message-form__input" type="text" placeholder="iMessage"><input id="message-form__button" type="submit" value="Send"></form>');

    $(element + ' input[type="text"]').keypress(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            $(element + ' input[type="submit"]').click();
        }
    });
    $(element + ' input[type="submit"]').click(function (event) {
        event.preventDefault();
        var message = $(element + ' input[type="text"]').val();
        $(element + ' input[type="text"]').val("");
		drone.publish({
			room: 'observable-room',
			message: message,
		});
	$('.messages').scrollTop($(".message:last").prop("scrollHeight") / 0.1);
    });
}

function responsiveChatPush(element, sender, origin, date, message) {
	messagecount = document.getElementsByClassName("message").length;
    var originClass;
    if (origin == 'me') {
        originClass = 'myMessage';
    } else {
        originClass = 'fromThem';
    }
    $(element + ' .messages').append('<div class="message" id="' + messagecount + '"><div class="' + originClass + '"><p>' + message + '</p><date><b>' + sender + '</b> ' + date + '</date></div></div>');
	if (!document.hasFocus())
	{
		unread++;
		if (unread > 0)
		{
			document.getElementsByTagName("title")[0].innerText = "(" + unread + ") Chat Client";
			document.getElementById("favicon").href = "resources/other/icon-unread.ico";
		}
		Push.create("Chat Server - " + sender, {
			body: message,
			icon: "resources/other/icon.ico",
			tag: "Chat Server",
			onClick: function () {
				window.focus();
				this.close();
			},
		});
	}
}

if (Push.Permission.has())
{
	Push.Permission.request();
}

window.onbeforeunload = function(){
  drone.publish({
    room: 'observable-room',
    message: "This user has disconnected.",
  });
};

window.addEventListener("focusin", function() {
	if (unread > 0)
	{
		unread = 0;
		document.getElementsByTagName("title")[0].innerText = "Chat Client";
		document.getElementById("favicon").href = "resources/other/icon.ico";
	}
});

function toggleFullscreen() {
	var element = document.body;
	var isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;
	element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
	document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };
	isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
}

responsiveChat('.messages');
