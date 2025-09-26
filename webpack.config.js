const path = require('path');

module.exports = {
  entry: './index.tsx',
  output: {
    filename: 'editor.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      react: path.resolve(__dirname, 'shims/reactGlobal.ts'),
      'react-dom': path.resolve(__dirname, 'shims/reactDomGlobal.ts'),
      'react-dom/client': path.resolve(__dirname, 'shims/reactDomClient.ts'),
      'its-fine': path.resolve(__dirname, 'shims/itsFine.ts'),
      'react/jsx-runtime': path.resolve(__dirname, 'shims/jsxRuntime.ts'),
      'react-konva': path.resolve(__dirname, 'shims/reactKonva.tsx'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: path.resolve(__dirname, 'utils/simpleTsLoader.js'),
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
