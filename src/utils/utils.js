const checkKeysInObject = (keysArray, obj) => {
    // Returns true if every key in keysArray is contained in obj keys
    return keysArray.every(key => Object.keys(obj).includes(key))
};

module.exports = {
    checkKeysInObject,
}
