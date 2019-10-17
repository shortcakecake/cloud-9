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
  }
  console.log('Connecting to Chat Server...');
  room.on('open', error => {
    if (error) {
      return console.error(error);
    }
    console.log('Connected.');
    document.getElementById("connection-status").innerText = "Connected"
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

  room.on('data', (text, member) => {
    if (member) {
      addMessageToListDOM(text, member);
    } else {
      // Message is from server
    }
  });
});

drone.on('error', () => {
  console.error("Connection error.");
  document.getElementById("connection-status").innerText = "Error"
});
drone.on('close', () => {
  console.log("Connection closed.");
  document.getElementById("connection-status").innerText = "Connection terminated"
});

drone.on('disconnect', () => {
  console.log("Disconnected from server, reconnecting...");
  document.getElementById("connection-status").innerText = "Reconnecting..."
});

//------------- DOM STUFF

const DOM = {
  membersCount: document.querySelector('.members-count'),
  membersList: document.querySelector('.members-list'),
  messages: document.querySelector('.messages'),
  input: document.querySelector('.message-form__input'),
  form: document.querySelector('.message-form'),
};

DOM.form.addEventListener('submit', sendMessage);

function sendMessage() {
  const value = DOM.input.value;
  if (value === '') {
    return;
  } else if (value === ' ') {
    return;
  }
  DOM.input.value = '';
  drone.publish({
    room: 'observable-room',
    message: value,
  });
}

function createMemberElement(member) {
  const { name, color } = member.clientData;
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(name));
  el.className = 'member';
  el.style.color = color;
  return el;
}

function updateMembersDOM() {
  DOM.membersCount.innerText = `${members.length} users in room:`;
  DOM.membersList.innerHTML = '';
  members.forEach(member =>
    DOM.membersList.appendChild(createMemberElement(member))
  );
}

function createMessageElement(text, member) {
  if (text.includes("image:") == true)
  {
    const el = document.createElement('div');
    const image = document.createElement('image');
    const url = text.replace("image:", "");
    el.appendChild(createMemberElement(member));
    image.src = url;
    return el;
  }
  else if (text.includes("video:") == true)
  {
    const el = document.createElement('div');
    const video = document.createElement('video');
    const url = text.replace("video:", "");
    el.appendChild(createMemberElement(member));
    video.src = url;
    return el;
  }
  else
  {
    const el = document.createElement('div');
    el.appendChild(createMemberElement(member));
    el.appendChild(document.createTextNode(text));
    el.className = 'message';
    return el;
  }
}

function addMessageToListDOM(text, member) {
  const el = DOM.messages;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(createMessageElement(text, member));
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}

window.onbeforeunload = function(){
  drone.publish({
    room: 'observable-room',
    message: "This user has disconnected.",
  });
};
