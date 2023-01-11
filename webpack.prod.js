const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanPlugin } = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ToInlineBlobWorkerPlugin = require('./src/worker/webpackPlugins/ToInlineBlobWorkerPlugin.js');
const devMode = true;
const entryObj = {};
const HtmlWebpackPluginArr = [];
function setSingle() {
  entryObj['index'] = [`./src/indexBuild.js`];
  const obj = new HtmlWebpackPlugin({
    template: `./src/indexDemo.html`,
    filename: `index.html`,
    chunks: ['index'],
    title: 'tripdocs',
    inject: 'head',
    scriptLoading: 'blocking',
  });
  HtmlWebpackPluginArr.push(obj);
  // console.log(entryObj, HtmlWebpackPluginArr);
}
setSingle();
/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: entryObj,
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    publicPath: 'auto',
    // 输出目录绝对路径
    path: path.resolve(__dirname, 'dist'),
    clean: {
      keep: /\.ares\//, // Keep these assets under 'ignored/dir'.
    },
  },
  // extensions 省略后缀
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@src': path.resolve(__dirname, 'src/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
    },
  },
  plugins: [
    ...HtmlWebpackPluginArr,
    // new CleanPlugin(), // 打开以后ares要重新配置
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(false),
    }),
    new ToInlineBlobWorkerPlugin(),
    // new BundleAnalyzerPlugin(),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          //拆分第三方库（通过npm|yarn安装的库）
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: -10,
          // maxInitialSize: 2.3 * 1024 * 1024,
          // maxSize: 2.5 * 1024 * 1024,
        },
      },
    },
  },
  module: {
    rules: [
      // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
          {
            loader: 'ts-loader',
            options: {
              happyPackMode: true, // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
            },
          },
        ],
      },
      {
        test: /\.less$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          'css-loader',
          'postcss-loader',
          'less-loader',
        ],
      },
      {
        test: /\.css$/i,
        // ?modules&localIdentName=[path][name]-[local]-[hash:5]
        use: ['style-loader', 'css-loader'],
      },
      {
        /*src目录下面的以.js结尾的文件，要使用babel解析*/
        /*cacheDirectory是用来缓存编译结果，下次编译加速*/
        test: /\.(js|.jsx)$/i,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      // The following webpack.config.js can load CSS files,
      // embed small PNG/JPG/GIF/SVG images as well as fonts as Data URLs
      // and copy larger files to the output directory.
      {
        test: /\.(sa|sc)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === 'development',
            },
          },
          'css-loader',
          'postcss-loader',
        ],
      },

      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        loader: 'url-loader',
        options: {
          limit: 200000,
        },
      },
    ],
  },
};
