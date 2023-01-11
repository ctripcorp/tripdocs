const webpack = require("webpack");

const path = require("path");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const HtmlWebpackPlugin = require("html-webpack-plugin");

require("./app");

const devMode = true;

const entryObj = {};

const HtmlWebpackPluginArr = [];

function setSingle() {
    entryObj["index"] = `./index.js`;
    const obj = new HtmlWebpackPlugin({
        template: `./src/index.html`,
        filename: `index.html`,
        chunks: [ "index" ]
    });
    HtmlWebpackPluginArr.push(obj);
}

setSingle();

const plugins = [ ...HtmlWebpackPluginArr, new MiniCssExtractPlugin({
    filename: devMode ? "[name].css" : "[name].[hash].css",
    chunkFilename: devMode ? "[id].css" : "[id].[hash].css"
}), new webpack.DefinePlugin({
    __DEV__: JSON.stringify(true)
}), new webpack.ProvidePlugin({
    Buffer: [ "buffer", "Buffer" ]
}) ];

if (devMode) {
    plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = {
    entry: entryObj,
    mode: "development",
    devtool: "inline-source-map",
    output: {
        filename: "[name].js",
        publicPath: "/",
        path: path.resolve(__dirname, "dist")
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "public")
        },
        allowedHosts: "all",
        compress: true,
        port: 3e3,
        proxy: {
            "/tripdocs": "http://localhost:5385",
            "/tripdoc": "http://localhost:5385",
            changeOrigin: true
        }
    },
    resolve: {
        extensions: [ ".ts", ".tsx", ".js", ".jsx" ],
        alias: {
            "@src": path.resolve(__dirname, "src/"),
            "@utils": path.resolve(__dirname, "src/utils/")
        }
    },
    plugins: plugins,
    module: {
        rules: [ {
            test: /\.tsx?$/,
            use: [ {
                loader: "babel-loader",
                options: {
                    presets: [ "@babel/preset-env", "@babel/preset-react" ]
                }
            }, {
                loader: "ts-loader",
                options: {
                    happyPackMode: true
                }
            } ]
        }, {
            test: /\.less$/i,
            use: [ {
                loader: MiniCssExtractPlugin.loader,
                options: {}
            }, "css-loader", "postcss-loader", "less-loader" ]
        }, {
            test: /\.css$/i,
            use: [ "style-loader", "css-loader" ]
        }, {
            test: /\.(js|jsx)$/i,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: [ "@babel/preset-env", "@babel/preset-react" ]
                }
            }
        }, {
            test: /\.(sa|sc)ss$/,
            use: [ {
                loader: MiniCssExtractPlugin.loader,
                options: {
                    hmr: process.env.NODE_ENV === "development"
                }
            }, "css-loader", "postcss-loader" ]
        }, {
            test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
            loader: "url-loader",
            options: {
                limit: 8192 * 1e3
            }
        } ]
    }
};