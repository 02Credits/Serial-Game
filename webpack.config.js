var path = require("path");
var webpack = require("webpack");
var { CheckerPlugin } = require('awesome-typescript-loader');

module.exports = {
  context: path.resolve('.'),
  entry: [
    "babel-polyfill",
    "./ts/bootstrap"
  ],
  output: {
    path: path.resolve('./js'),
    filename: "bundle.js",
    publicPath: "/js/",
    devtoolModuleFilenameTemplate: function(info){
      return "../" + info.resourcePath;
    }
  },
  devtool: 'source-map',
  module: {
    loaders: [{
      test: /\.tsx?$/,
      loader: "awesome-typescript-loader"
    }, {
      test: /\.js$/,
      loader: "source-map-loader",
      enforce: "pre"
    }, {
      test: /\.(glsl|frag|vert)$/,
      loader: 'raw-loader',
      exclude: /node_modules/
    }, {
      test: /\.(glsl|frag|vert)$/,
      loader: 'glslify-loader',
      exclude: /node_modules/
    }]
  },
  devServer: {
    inline: true,
    port: 8080
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"]
  },
  externals: [
    {"twgl.js": "twgl"}
  ],
  plugins: [
    new CheckerPlugin()
  ]
};
