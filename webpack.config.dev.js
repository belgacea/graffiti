const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

var config = {
    target: 'electron-main',

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    // devServer: {
    //     hot: true
    // },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },

            { test: /\.css$/, use: [{ loader: "style-loader" }, { loader: "css-loader" } ]},

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

    // Ecrase la valeur définie par cross-env seulement pour le renderer
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('development.webpack')
            },
            'process.env.FLUENTFFMPEG_COV': false
        })
    ]
};

var mainWindow = Object.assign({}, config,{
    entry: "./src/index.tsx",

    output: {
        filename: "bundle.js",
        path: __dirname + "/dist",
        // publicPath nécessaire pour Electron
        publicPath: 'http://localhost:8080/',
    }
});

var backgroundWindow = Object.assign({}, config,{
    entry: "./background.ts",

    output: {
        filename: "background.js",
        path: __dirname + "/dist",
        // publicPath nécessaire pour Electron
        publicPath: 'http://localhost:8080/',
    },
});

module.exports = [
    mainWindow, backgroundWindow
]
