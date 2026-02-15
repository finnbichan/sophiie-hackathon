const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const webpack = require('webpack');
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
