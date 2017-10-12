'use strict';

const mongoose = require('mongoose');

const AccountSchema = require('./Account');


module.exports = {
    Account: mongoose.model('Account', AccountSchema)
};
