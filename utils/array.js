'use strict';

function ensureArray(value) {
    if (!value) {
        return [];
    }
    if (!Array.isArray(value)) {
        return [value];
    }
    return value;
}

module.exports = {
    ensureArray
};
