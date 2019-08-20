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
  console.log('Connecting to Online Chat Server...');
  room.on('open', error => {
    if (error) {
      return console.error(error);
    }
    console.log('Connected.');
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

drone.on('error', error => {
  console.error('Error with connection:', error);
});
drone.on('close', event => {
  console.log('Connection closed:', event);
});

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

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
  const el = document.createElement('div');
  el.appendChild(createMemberElement(member));
  el.appendChild(document.createTextNode(text));
  el.className = 'message';
  return el;
}

function addMessageToListDOM(text, member) {
  const el = DOM.messages;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(createMessageElement(text, member));
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}
