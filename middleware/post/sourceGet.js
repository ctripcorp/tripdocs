const {
    cephGet
} = require("../../serverLib/cephUtils");

const {
    commonRes
} = require("../../serverLib/resCommon");

const {
    addEnvPredix
} = require("../../serverLib/stringUtils");

async function sourceGet(req, res) {
    try {
        const {
            source,
            env
        } = req.body;
        const cookie = req.cookies["principal_dev"];
        if (cookie) {
            console.log("sourceGet", addEnvPredix(env, source), env);
            if (source) {
                const cData = await cephGet(source);
                try {
                    res.json(commonRes({
                        success: true,
                        data: {
                            docContent: JSON.parse(cData.content.toString())
                        }
                    }));
                } catch (error) {
                    res.json(commonRes({
                        success: true,
                        data: {
                            docContent: cData.content.toString()
                        }
                    }));
                }
                return;
            }
            res.json(commonRes({
                success: true,
                data: [],
                msg: "aaa" ? "没有传入文件路径" : "未通过身份验证"
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
    reg: /\/tripdocs\/api\/docs\/source\/get/i,
    fn: sourceGet
};