const Message = require("../models/Message");

function formatMessage(from, to, text) {
    const date = new Date();
    // const time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    const newMessage = new Message(
        {
            text,
            from: from.username,
            to: to.username,
            date
        }
    );
    const errors = newMessage.validateSync();
    newMessage.save();
    return {
        from: from.username,
        text,
        date
    };
}

function formatBotMessage(username, text) {
    const date = new Date();
    // const time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    return {
        from: username,
        text,
        date
    };
}

async function getMessages(user1, user2){
    const messages1 = await Message.find({to: user1, from: user2}).limit(50).sort('-date');
    const messages2 = await Message.find({to: user2, from: user1}).limit(50).sort('-date');
    const messages = messages1.concat(messages2);
    // Sort messages by date
    messages.sort((a,b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
    return messages;
}

module.exports = {
    formatMessage,
    formatBotMessage,
    getMessages
};
