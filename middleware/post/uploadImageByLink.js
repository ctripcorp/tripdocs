let http = require("http");

let https = require("https");

function getBase64ByLink(url) {
    let request = http;
    if (url.indexOf("https") > -1) {
        request = https;
    }
    return new Promise((resolve, reject) => {
        request.get(url, function(res) {
            let chunks = [];
            let size = 0;
            res.on("data", function(chunk) {
                chunks.push(chunk);
                size += chunk.length;
            });
            res.on("end", function(err) {
                let data = Buffer.concat(chunks, size);
                let base64Img = data.toString("base64");
                resolve(base64Img);
            });
        });
    });
}

const {
    commonRes
} = require("../../serverLib/resCommon");

const {
    cephSet
} = require("../../serverLib/cephUtils");

async function uploadImg(req, res) {
    const {
        docId,
        url
    } = req.body;
    try {
        const path = "tripdocs/img/" + docId + "-" + Date.now() + ".png";
        const base64Img = await getBase64ByLink(url);
        console.log("uploadImg base64Img");
        const base64 = "data:image/png;base64," + base64Img;
        await cephSet(path, base64);
        console.log("uploadImg postCeph");
        res.json(commonRes({
            success: true,
            data: {
                source: path,
                base64: base64
            }
        }));
    } catch (error) {
        res.json(commonRes({
            success: false,
            msg: error.toString(),
            code: 500
        }));
    }
}

module.exports = {
    reg: /\/tripdocs\/api\/docs\/doc\/uploadImg\/byLink/i,
    fn: uploadImg
};