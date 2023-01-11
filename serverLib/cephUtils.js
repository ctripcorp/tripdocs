const fs = require("fs");
const path = require("path");


const timeoutStr = "";

async function cephSet(source, content) {
    const nativeImgSource = source.split('/').pop()
    const targetSource = nativeImgSource;
    const text = typeof content === "string" ? content : JSON.stringify(content);
    let abort = {
        fn: null
    };
    const r = await Promise.race([postFile(targetSource, text), promiseTimeOut(nativeImgSource, "cephSet : " + text, abort)]);
    abort.fn && abort.fn();
    return Promise.resolve(r !== timeoutStr);
}

const promiseTimeOut = (source, content = "", abort) => new Promise((resolve, reject) => {
    let isEnd = false;
    abort.fn = () => {
        isEnd = true;
        resolve();
    };
    setTimeout(() => {
        if (!isEnd) {
            console.errors("promiseTimeOut timeout", source, content.slice(0, 100));
            resolve(timeoutStr);
        }
    }, 1e4);
});

async function postFile(source, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.resolve(__dirname, "../devDoc/" + source), data, e => {
            if (e) {
                resolve(e);
                return
            }
            resolve(true);
        });
    });
}

async function getFile(source) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(__dirname, "../devDoc/" + source), (e, data) => {
            if (e) {
                resolve(e);
                return
            }
            resolve(data);
        });
    });
}

async function cephGet(source, isSkip = false) {
    try {
        const targetSource = source.split('/').pop()
        console.logs("targetSource", targetSource);
        let abort = {
            fn: null
        };
        let cData = await Promise.race([getFile(targetSource), promiseTimeOut(source, "cephGet", abort)]);
        console.log(cData)
        abort.fn && abort.fn();
        if (typeof cData !== "string") {
            cData = cData.toString();
            return Promise.resolve(cData);
        }
        if (isSkip) {
            return Promise.resolve("");
        } else {
            if (timeoutStr === cData) {
                return Promise.reject("server err: timeoutStr");
            }
            return Promise.reject("server err: no content");
        }
    } catch (e) {
        console.errors("cephGet source: ", source, " , err:", e);
        if (isSkip) {
            return Promise.resolve("");
        }
        return Promise.reject("server err: no content");
    }
}

module.exports = {
    cephSet: cephSet,
    cephGet: cephGet
};