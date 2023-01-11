const {
    timeFormat
} = require("./format");

function sourceFileAndCodeLine(n) {
    let stack = new Error().stack;
    let ss = stack.split("\n    at");
    return ss[n].trim();
}

console.errors = function(...args) {
    let path = getPath();
    return console.error(timeFormat(null), path, ...args);
};

console.logs = function(...args) {
    let path = getPath();
    return console.log(timeFormat(null), path, ...args);
};

function getPath() {
    let path = sourceFileAndCodeLine(4).split("(")[1];
    if (typeof path === "string") {
        path = path.replace(")", ":");
    } else {
        path = sourceFileAndCodeLine(4);
    }
    return path;
}