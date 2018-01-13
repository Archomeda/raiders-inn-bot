'use strict';

const Schema = require('mongoose').Schema;


const Account = new Schema({
    discordId: String,
    isExperienced: Boolean,
    allowExperienced: { type: Boolean, default: true },
    hasTimeout: Boolean,
    timeouts: [{
        start: Date,
        end: Date,
        reason: String,
        by: String
    }]
});

module.exports = Account;
