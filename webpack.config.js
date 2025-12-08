const path = require("path");
const FileIncludeWebpackPlugin = require("file-include-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: path.resolve(__dirname, "src/styles/styles.css"),
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devServer: {
    static: "./dist",
    port: 3001,
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("@tailwindcss/postcss"),
                ],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "styles.css" }),
    new FileIncludeWebpackPlugin({
      source: "./src/templates",
      htmlBeautifyOptions: { indent_size: 2 },
      recursive: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: "src/images", to: "images", noErrorOnMissing: true },
        { from: "src/videos", to: "videos", noErrorOnMissing: true },
        { from: "src/js", to: "js/", noErrorOnMissing: true },
      ],
    }),
  ],
  mode: "development",
};
