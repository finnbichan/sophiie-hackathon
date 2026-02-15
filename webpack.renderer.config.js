const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Import HtmlWebpackPlugin
require('dotenv').config();

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body', // Inject scripts into the body
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_GROQ_API_KEY': JSON.stringify(
        process.env.REACT_APP_GROQ_API_KEY
      ),
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  ignoreWarnings: [
    { module: /@whereby\.com\/camera-effects/ },
  ],
};
