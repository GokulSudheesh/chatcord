require("./config/database");
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { formatMessage, formatBotMessage, getMessages } = require("./utils/messages");
const { userJoin, userLeave, getUser, getUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "ChatCord Bot";

// Set static folder
app.use(express.static(path.join(__dirname, "public")));
const PORT = 3000 || process.env.PORT;

// Run when a client connects
io.on("connection", client => {
    console.log(`New client - ${client.id} connected.`);
    // Ideally you would save the new user to db here (with authentication)
    client.on("connected", async ({username}) => {
        const user = userJoin(client.id, username);
        
        // Broadcast when a new user connects
        client.broadcast.emit(
            "serverMessage", 
            formatBotMessage(botName, `${user.username} has joined the chat.`)
        );
        // Send users
        io.emit("roomUsers", { 
            users: await getUsers()
        });
    });
    
    // Client sends a chat message
    client.on("chatMessage", async ({message, to}) => {
        const fromUser = await getUser({ clientId: client.id });
        const toUser = await getUser({ username: to });
        console.log(`From: ${fromUser} Message: "${message}" To: ${toUser}`);
        if (!toUser || !fromUser) return
        message = formatMessage(fromUser, toUser, message);
        client.emit("message", {...message, from: "You"}); // Return to sender
        client.to(toUser.clientId).emit("message", message); // Send to receiver
    });
    
    // Runs when a client disconnects
    client.on("disconnect", async () => {
        console.log(`Client - ${client.id} disconnected.`);
        const user = await userLeave(client.id);
        if (!user) return
        client.broadcast.emit("serverMessage", formatBotMessage(botName, `${user.username} has left the chat.`));
        // Send users
        io.emit("roomUsers", { 
            users: await getUsers()
        });
    });
});


// This is not secure. DO NOT use in production.
// Use passport authentication
app.get("/messages", async (req, res, next) => {
    const fromUser = await getUser({ username: req.query.from });
    const toUser = await getUser({ username: req.query.to });
    if (!fromUser || !toUser) return res.status(404).json({ messages: [formatBotMessage(botName, "Error. Please try again.")] });
    const messages = await getMessages(fromUser.username, toUser.username);
    res.status(200).json({ messages });
});

server.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});
