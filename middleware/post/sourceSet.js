const {
    commonRes
} = require("../../serverLib/resCommon");

const {
    addEnvPredix
} = require("../../serverLib/stringUtils");

const {
    cephSet
} = require("../../serverLib/cephUtils");

async function sourceSet(req, res) {
    try {
        const {
            source,
            doc,
            env = "prod"
        } = req.body;
        const cookie = req.cookies["principal_dev"];
        console.log("sourceget1111");
        if (cookie) {
            console.log("sourceget 222", typeof req.body, req.body, source);
            if (source) {
                console.log("sourceget 3333");
                const name = addEnvPredix(env, source);
                const r = await cephSet(name, typeof doc === "string" ? doc : JSON.stringify(doc));
                console.log("sourceget", r, name);
                res.json(commonRes({
                    success: true,
                    data: {
                        docContent: r
                    }
                }));
                return;
            }
            console.log("sourceget 4444");
            const result = "test";
            res.json(commonRes({
                success: false,
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
    reg: /\/tripdocs\/api\/docs\/source\/set/i,
    fn: sourceSet
};