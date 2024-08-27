const User = require('./models').User;

async function rankUsers() {
    return await User.find().sort({ won: -1, played: -1 });
}

module.exports = { rankUsers };
