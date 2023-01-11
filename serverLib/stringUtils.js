function addEnvPredix(env = "fws", str) {
    let realStr = str;
    if (env !== "prod") {
        realStr = env + "@" + realStr;
    }
    return realStr;
}

module.exports = {
    addEnvPredix: addEnvPredix
};