const path = require('path');

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: 'editor.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      'its-fine': path.resolve(__dirname, 'src/shims/itsFine.ts'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devtool: 'source-map',
  performance: {
    maxAssetSize: 600000,
    maxEntrypointSize: 600000,
  },
};
