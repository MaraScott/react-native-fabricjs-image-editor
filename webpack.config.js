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
      'react-konva': path.resolve(__dirname, 'shims/reactKonva.tsx'),
      '@components': path.resolve(__dirname, 'components'),
      '@hooks': path.resolve(__dirname, 'hooks'),
      '@contexts': path.resolve(__dirname, 'contexts'),
      '@utils': path.resolve(__dirname, 'utils'),
      '@types': path.resolve(__dirname, 'types'),
      '@ui': path.resolve(__dirname, 'ui'),
      '@canvas': path.resolve(__dirname, 'canvas'),
      '@vendor': path.resolve(__dirname, 'vendor'),
      '@tamagui': path.resolve(__dirname, '../tamagui'),
      '@config/tamagui': path.resolve(__dirname, '../tamagui.config.ts'),
    },
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-dom/client': 'ReactDOM',
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
