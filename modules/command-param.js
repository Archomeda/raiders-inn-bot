'use strict';

class CommandParam {
    constructor(name, helpText, isOptional) {
        this.name = name;
        this.helpText = helpText;
        this.isOptional = isOptional || false;
    }
}

module.exports = CommandParam;
