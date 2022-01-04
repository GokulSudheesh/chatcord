const socket = io();

const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const userList = document.getElementById("users");
let selectedUserElement = null;

const searchParams = new URLSearchParams(location.search);
const username = searchParams.get("username");
let selectedUser = null;
// Join chat room
socket.emit("connected", { username });

// Get users
socket.on("roomUsers", ({ users }) => {
    const index = users.findIndex(user => user.username == username);
    if (index != -1) users.splice(index, 1)[0];
    outputUsers(users);
});

// Message from server
socket.on("message", message => {
    console.log(message);
    if (message.from == selectedUser || message.from == "You") {
        displayMessage(message);
    } else {
        const chatNotification = document.getElementById(message.from);
        if (chatNotification) chatNotification.style.display = "inline-block";
    }
});

// Message submit
chatForm.addEventListener("submit", event => {
    event.preventDefault();
    const msg = event.target.msg.value;
    // Emit message to server
    socket.emit("chatMessage", { message: msg, to: selectedUser });
    event.target.msg.value = "";
    event.target.msg.focus();
});

// Output message to DOM
function displayMessage(message){
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<p class="meta">${message.from} <span>${
        new Date(message.date).toLocaleString('en-US', { 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true 
        })
    }
    </span></p>
    <p class="text">${message.text}</p>`;
    chatMessages.appendChild(div);
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function outputUsers(users){
    userList.innerHTML = "<li>You</li>"
    userList.innerHTML += `${users.map(user => 
        `<li onclick="sendTo(this)" username="${user.username}">
        ${user.username} <span id="${user.username}" class="badge" style="display: none">*</span></li>`)
    .join("")}`;
}

function sendTo(element){
    if (selectedUserElement == element) return
    chatMessages.innerHTML = "";
    if (selectedUserElement) selectedUserElement.style.background = "rgba(0, 0, 0, 0)";
    element.style.background = "rgba(0, 0, 0, 0.1)";
    selectedUserElement = element;
    const toUser = selectedUserElement.getAttribute("username");
    if (selectedUser != toUser) getMessages(username, toUser);
    selectedUser = toUser;
    document.getElementById(selectedUser).style.display = "none";
}

async function getMessages(from, to){
    const response = await fetch(`/messages?from=${from}&to=${to}`, {
        method: "GET"
    });
    const { messages } = await response.json();
    messages.forEach(message => {
        message.from = (message.from == username) ? "You" : message.from;
        displayMessage(message);
    });
}
