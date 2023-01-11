const webpack = require("webpack");

const path = require("path");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const HtmlWebpackPlugin = require("html-webpack-plugin");

const {
    CleanPlugin
} = require("webpack");

const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const ToInlineBlobWorkerPlugin = require("./src/worker/webpackPlugins/ToInlineBlobWorkerPlugin.js");

const devMode = true;

const entryObj = {};

const HtmlWebpackPluginArr = [];

function setSingle() {
    entryObj["index"] = [ `./src/indexBuild.js` ];
    const obj = new HtmlWebpackPlugin({
        template: `./src/indexDemo.html`,
        filename: `index.html`,
        chunks: [ "index" ],
        title: "tripdocs",
        inject: "head",
        scriptLoading: "blocking"
    });
    HtmlWebpackPluginArr.push(obj);
}

setSingle();

module.exports = {
    entry: entryObj,
    mode: "production",
    devtool: "source-map",
    output: {
        filename: "[name].js",
        publicPath: "./",
        path: path.resolve(__dirname, "dist"),
        clean: {
            keep: /\.ares\//
        }
    },
    resolve: {
        extensions: [ ".ts", ".tsx", ".js", ".jsx" ],
        alias: {
            "@src": path.resolve(__dirname, "src/"),
            "@utils": path.resolve(__dirname, "src/utils/")
        }
    },
    plugins: [ ...HtmlWebpackPluginArr, new MiniCssExtractPlugin({
        filename: devMode ? "[name].css" : "[name].[hash].css",
        chunkFilename: devMode ? "[id].css" : "[id].[hash].css"
    }), new webpack.DefinePlugin({
        __DEV__: JSON.stringify(false)
    }), new ToInlineBlobWorkerPlugin() ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "all",
                    priority: -10
                }
            }
        }
    },
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
            test: /\.(js|.jsx)$/i,
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
                limit: 2e4
            }
        } ]
    }
};