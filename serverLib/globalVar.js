function set(key, val) {
    if (typeof key === "string") {
        global[key] = val;
    }
}

function get(key) {
    if (typeof key === "string") {
        return global[key];
    }
    return null;
}

const keyMap = {
    dirRes: "directoryRes",
    compareMentionInterval: "compareMentionInterval",
    profileCorpGroupQuery: "profileCorpGroupQuery",
    profileCorpGroupQueryTree: "profileCorpGroupQueryTree",
    profileCorpQuery: "profileCorpQuery",
    profileCorpQueryTree: "profileCorpQueryTree",
    profileQuery: "profileQuery",
    profileQueryTree: "profileQueryTree",
    isBuild: "Project is being built",
    errCache: "ErrorCache",
    esConnect: "esConnect"
};

module.exports = {
    set: set,
    get: get,
    keyMap: keyMap
};