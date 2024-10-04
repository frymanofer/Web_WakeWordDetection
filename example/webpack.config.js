const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './example.js', // Entry point for your example
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'example.bundle.js', // Output example bundle
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'example.js'),
          path.resolve(__dirname, 'node_modules/keyword-detection-web'), // Include the library
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { // Copy models to 'dist/models'
          from: 'models', to: 'models' 
        }, 
        { // Copy webassembly file to dist
          from: path.resolve(__dirname, 'node_modules/keyword-detection-web/dist/d27ca340296764f46a45.wasm'),
          to: path.resolve(__dirname, 'dist/[name][ext]'), // Copy WASM file to dist
        }
    ]
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'dist'), // Serve the 'dist' folder
    compress: true,
    port: 8080, // Port for development server
  },
  mode: 'production', // Use development mode for the example
};
