const ActiveUser = require("../models/User");

// Join user to chat
async function userJoin(clientId, username){
    const newUser = await ActiveUser.findOneAndUpdate({ username }, { clientId }, {
        new: true,
        upsert: true
    });
    return newUser;
}

// Get user with a comdition (either clientId or username)
async function getUser(cond){
    const user = await ActiveUser.findOne(cond);
    return user;
}

async function userLeave(id){
    const result = await ActiveUser.findOneAndDelete({ clientId: id });
    return result;
}

// Get active users
async function getUsers(){
    let activeUsers = await ActiveUser.find().select("username").lean();
    return activeUsers;
}

module.exports = { 
    userJoin,
    getUser,
    userLeave,
    getUsers
}
