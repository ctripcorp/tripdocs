const {
    commonRes
} = require("../../serverLib/resCommon");

const {
    addEnvPredix
} = require("../../serverLib/stringUtils");

const fs = require("fs");

const path = require("path");

async function sourceSetNative(req, res) {
    try {
        const {
            source = "default.json",
            doc
        } = req.body;
        const cookie = req.cookies["principal_dev"];
        if (cookie) {
            const obj = {
                name: addEnvPredix("prod", source),
                data: typeof doc === "string" ? doc : JSON.stringify(doc),
                type: "text"
            };
            console.log("__dirname", __dirname);
            fs.writeFileSync(path.resolve(__dirname, "../devDoc/" + source), obj.data);
            res.json(commonRes({
                success: true,
                data: {
                    docContent: obj.data
                }
            }));
            return;
            res.json(commonRes({
                success: true,
                data: [],
                msg: result ? "没有传入文件路径" : "未通过身份验证"
            }));
            return;
        }
    } catch (error) {
        console.error(error);
        res.json(commonRes({
            success: false,
            msg: error.toString(),
            code: 500
        }));
    }
}

module.exports = {
    reg: /\/tripdocs\/api\/docs\/source\/set\/native/i,
    fn: sourceSetNative
};