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
      '@atoms': path.resolve(__dirname, 'ui/atoms'),
      '@molecules': path.resolve(__dirname, 'ui/molecules'),
      '@organisms': path.resolve(__dirname, 'ui/organisms'),
      '@templates': path.resolve(__dirname, 'ui/templates'),
      '@pages': path.resolve(__dirname, 'ui/pages'),
      '@hooks': path.resolve(__dirname, 'hooks'),
      '@contexts': path.resolve(__dirname, 'contexts'),
      '@utils': path.resolve(__dirname, 'utils'),
      '@types': path.resolve(__dirname, 'types'),
      '@expo': path.resolve(__dirname, '..', '..', '..', '..'),
      '@tinyartist': path.resolve(__dirname, '..', '..', '..'),
      '@editor': path.resolve(__dirname, '.'),
      '@assets': path.resolve(__dirname, 'assets'),
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
