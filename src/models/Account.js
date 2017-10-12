'use strict';

const Schema = require('mongoose').Schema;


const Account = new Schema({
    discordId: String,
    isExperienced: Boolean,
    allowExperienced: { type: Boolean, default: true }
});

module.exports = Account;
