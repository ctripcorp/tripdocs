const {
    cephGet
} = require("../../serverLib/cephUtils");

async function getCephImg(req, res, ctx) {
    const path = req.path;
    const newPath = path.slice(1).replace("tripdocs/img/old", "tripdoc/img");
    console.logs("getCephImg newPath", newPath);
    const base64 = await cephGet(newPath);
    let img = Buffer.from(base64.slice("data:image/png;base64,".length), "base64");
    res.statusCode = 200;
    res.type = "image/jpeg";
    res.setHeader("Content-Type", "image/jpeg");
    res.end(img);
    console.logs(img);
}

module.exports = {
    reg: /\/tripdocs\/img\/*/i,
    fn: getCephImg
};