var username = prompt("Preferred Name:");
if (username == null)
{
  alert("Username must not be empty.");
  location.reload();
}else if (username == "")
{
  alert("Username must not be empty.");
  location.reload();
}

const CLIENT_ID = 'DykEIjZu8e1n7atl';

const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: username,
    color: "#065fd4",
  },
});

let members = [];
let pc;
const configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};

function onSuccess() {};
function onError(error) {
  console.error(error);
};

const room = drone.subscribe('observable-room', { historyCount: 10 });
drone.on('open', error => {
  if (error) {
    return console.error(error);
    document.getElementById("connection-status").innerText = "Error";
    document.getElementById("connection-status").className = "error";
  }
  console.log('Connecting to FaceTime...');
  document.getElementById("connection-status").innerText = "Connecting...";
  document.getElementById("connection-status").className = "connecting";
  room.on('open', error => {
    if (error) {
      return console.error(error);
    }
    console.log('Connected.');
    document.getElementById("connection-status").innerText = "Connected";
    document.getElementById("connection-status").className = "connected";
  });
});

room.on('members', m => {
 members = m;
 updateMembersDOM();
 startWebRTC(m.length);
 startListeningToSignals();
});

  room.on('member_join', member => {
    members.push(member);
    updateMembersDOM();
	  refreshVideo();
	  for (var i = 0; i < members.length; i++){
	  	
	  }
  });

  room.on('member_leave', ({id}) => {
    const index = members.findIndex(member => member.id === id);
    members.splice(index, 1);
    updateMembersDOM();
    document.getElementById(id).parentNode.removeChild(id);
  });
  
function createMemberElement(member) {
  const { name, color } = member.clientData;
  const el = document.createElement('p');
  el.appendChild(document.createTextNode(name));
  el.className = 'member';
  el.style.color = color;
  return el;
}

function addVideoFeed() {
	var video = document.createElement("video");
}

function removeVideoFeed() {
	
}

function updateMembersDOM() {
  document.getElementsByClassName("members-count")[0].innerText = `${members.length} users in room:`;
  document.getElementsByClassName("members-list")[0].innerHTML = '';
  members.forEach(member =>
    document.getElementsByClassName("members-list")[0].appendChild(createMemberElement(member))
  );
}

function sendMessage(message) {
  drone.publish({
    room: "observable-room",
    message
  });
}


function toggleFullscreen() {
	var element = document.body;
	var isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;
	element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
	document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };
	isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
}

function launchiMessage() {
	drone.publish({
    		room: 'observable-room',
    		message: "This user is switching to iMessage...",
  	});
	window.location.href = "index.html";
}

function refreshVideo(videofeedInt, status) {
	var video = document.getElementsByTagName("video")[document.getElementsByTagName("video").length - 1];
	if (status == "offline")
		video.setAttribute("poster", "resources/other/offline.png");
	if (status == "cameraoff")
		video.setAttribute("poster", "resources/other/cameraoff.png");
}

function startWebRTC(isOfferer) {
  pc = new RTCPeerConnection(configuration);

  // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
  // message to the other peer through the signaling server
  pc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({'candidate': event.candidate});
    }
  };

  // If user is offerer let the 'negotiationneeded' event create the offer
  if (isOfferer) {
    pc.onnegotiationneeded = () => {
      pc.createOffer().then(localDescCreated).catch(onError);
    }
  }

  // When a remote stream arrives display it in the #remoteVideo element
  pc.ontrack = event => {
	  var streamID = members.length - 1;
    const stream = event.streams[streamID];
	  var video = document.createElement("video");
	  document.getElementById("videoarea").appendChild("video");
	  video.setAttribute("width", "300");
	  video.setAttribute("height", "200");
	  video.setAttribute("autoplay", "");
	  video.setAttribute("id", members[streamID].clientData.id);
    if (!video.srcObject || video.srcObject.id !== stream.id) {
      video.srcObject = stream;
    }
  };

  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  }).then(stream => {
    // Display your local video in #localVideo element
    yourVideo.srcObject = stream;
    // Add your stream to be sent to the conneting peer
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  }, onError);

  // Listen to signaling data from Scaledrone
  room.on('data', (message, client) => {
    // Message was sent by us
    if (client.id === drone.clientId) {
      return;
    }

    if (message.sdp) {
      // This is called after receiving an offer or answer from another peer
      pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
        // When receiving an offer lets answer it
        if (pc.remoteDescription.type === 'offer') {
          pc.createAnswer().then(localDescCreated).catch(onError);
        }
      }, onError);
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      pc.addIceCandidate(
        new RTCIceCandidate(message.candidate), onSuccess, onError
      );
    }
  });
}

function localDescCreated(desc) {
  pc.setLocalDescription(
    desc,
    () => sendMessage({'sdp': pc.localDescription}),
    onError
  );
}

function startListeningToSignals() {
 // Listen to signaling data from Scaledrone
 room.on('data', (message, client) => {
   // Message was sent by us
   if (!client || client.id === drone.clientId) {
     return;
   }
   if (message.sdp) {
     // This is called after receiving an offer or answer from another peer
     pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
       // When receiving an offer lets answer it
       if (pc.remoteDescription.type === 'offer') {
         pc.createAnswer().then(localDescCreated).catch(onError);
       }
     }, onError);
   } else if (message.candidate) {
     // Add the new ICE candidate to our connections remote description
     pc.addIceCandidate(
       new RTCIceCandidate(message.candidate), onSuccess, onError
     );
   }
 });
}

refreshVideo();
