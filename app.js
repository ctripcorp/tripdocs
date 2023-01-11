const path = require("path");

const sStatic = require("koa-static");

const Koa = require("koa");

const route = require("koa-route");

const glob = require("glob");

const koaBody = require("koa-body");

const cors = require("@koa/cors");

const fs = require("fs");

const app = new Koa();

require("./serverLib/consoleUp");

app.use(cors()).use(require("koa-compress")()).use(sStatic(path.join(__dirname, "dist"))).use(sStatic(path.join(__dirname, "public"))).use(koaBody({
    jsonLimit: "50mb"
}));

setPostApi();

setGetApi();

function resJson(ctx) {
    return function(jn) {
        ctx.body = JSON.stringify(jn);
    };
}

function reqbodyJson(req) {
    try {
        if (typeof req.body === "object") {
            req.body = JSON.parse(JSON.stringify(req.body));
        } else if (typeof req.body === "string") {
            console.log("first");
            req.body = JSON.parse(req.body);
        }
    } catch (e) {
        req.body = req.body;
    }
}

function addJsonApi(fn) {
    return async function(ctx) {
        const {
            request,
            res
        } = ctx;
        request.cookies = {
            principal_dev: ctx.cookies.get("principal_dev")
        };
        res.json = resJson(ctx);
        reqbodyJson(request);
        await fn(request, res);
    };
}

function setPostApi() {
    const fileList = glob.sync(path.join(__dirname, "./middleware/post/*.js"));
    fileList.map(file => {
        const {
            reg,
            fn
        } = require(file);
        app.use(route.post(reg, addJsonApi(fn)));
    });
}

function setGetApi() {
    const fileList = glob.sync(path.join(__dirname, "./middleware/get/*.js"));
    fileList.map(file => {
        const {
            reg,
            fn
        } = require(file);
        app.use(route.get(reg, addJsonApi(fn)));
    });
}

app.listen(5385);