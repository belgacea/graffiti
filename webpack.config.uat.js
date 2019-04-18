const PostElectronBuild = require('./post-electron-build');
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    target: 'electron-main',

    // https://github.com/webpack/webpack/issues/1189#issuecomment-156576084
    entry: {
        'app/bundle': './src/index.tsx',
        'app/main': './main.js',
        'app/background': './background.ts'
    },
    output: {
        filename: '[name].js',
        path: __dirname + "/dist",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    // https://github.com/electron/electron/issues/5107#issuecomment-266752252
    node: {
        __dirname: false
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },

            { test: /\.css$/, use: [{ loader: "style-loader" }, { loader: "css-loader" }] },

            // Font / non complet, voir material-ui doc
            { test: /\.(eot|svg|ttf|woff|woff2)$/, loader: 'file?name=public/fonts/[name].[ext]' }
        ]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('uat'),
            //https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/573#issuecomment-305408048
            'process.env.FLUENTFFMPEG_COV': false
        }),
        new UglifyJSPlugin({
            uglifyOptions: {
                output: {
                    "ascii_only": true
                }
            }
        }),
        new PostElectronBuild()
    ]
};
