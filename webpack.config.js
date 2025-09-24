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
      'its-fine': path.resolve(__dirname, 'shims/itsFine.ts'),
      'react/jsx-runtime': path.resolve(__dirname, 'shims/jsxRuntime.ts'),
    },
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-dom/client': 'ReactDOM',
    'react-konva': 'ReactKonva',
    konva: 'Konva',
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
