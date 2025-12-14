const path = require('path');

module.exports = {
  entry: './frontend/src/index.js',
  output: {
    path: path.resolve(__dirname, 'static/js'),
    filename: 'bundle.js',
    publicPath: '/static/js/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  devServer: {
    contentBase: path.join(__dirname, 'static'),
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/login': 'http://localhost:5000'
    }
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
};