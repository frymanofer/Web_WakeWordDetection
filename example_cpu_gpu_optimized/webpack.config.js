const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

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
          path.resolve(__dirname, 'node_modules/web-wake-word'), // Include the library
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
    new webpack.DefinePlugin({
      'process.env.LICENSE_KEY': JSON.stringify(process.env.LICENSE_KEY),
    }),
    new CopyWebpackPlugin({
      patterns: [
        { // Copy models to 'dist/models'
          from: 'models', to: 'models' 
        }, 
        { // Copy webassembly file to dist
          from: 'node_modules/web-wake-word/dist/ort-wasm-simd-threaded.jsep.wasm*',
//          from: 'node_modules/web-wake-word/dist/50b7c0f667efcee7087e.wasm',
          to: path.resolve(__dirname, 'dist/[name][ext]'), // Copy WASM file to dist
        },
        { 
          from: 'node_modules/web-wake-word/dist/ort-wasm-simd-threaded.jsep.mjs', // Add this line
          to: path.resolve(__dirname, 'dist/[name][ext]'), 
        },    
        { // Copy webassembly file to dist
          from: 'node_modules/web-wake-word/dist/audio-worklet-processor.js',
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
  mode: 'development', // Use development mode for the example
};
