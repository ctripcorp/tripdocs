const {
    cephSet,
    cephGet
} = require("../../serverLib/cephUtils");

const {
    commonRes
} = require("../../serverLib/resCommon");

async function uploadImg(req, res) {
    const {
        type,
        base64,
        docId,
        path
    } = req.body;
    try {
        if (type === "upload") {
            const path = "tripdocs/img/" + docId + "-" + Date.now() + ".png";
            console.log("upload");
            await cephSet(path, base64);
            res.json(commonRes({
                success: true,
                data: {
                    source: path
                }
            }));
        } else if (type === "get") {
            const cData = await cephGet(path);
            res.json(commonRes({
                success: true,
                data: {
                    source: path,
                    base64: cData.content.toString()
                }
            }));
        }
    } catch (error) {
        res.json(commonRes({
            success: false,
            msg: error.toString(),
            code: 500
        }));
    }
}

module.exports = {
    reg: /\/tripdocs\/api\/docs\/doc\/uploadImg/i,
    fn: uploadImg
};