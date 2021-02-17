'use strict'

const webpack = require('webpack')
const path = require('path')
const buildPath = path.join(__dirname, './docs')
const args = require('yargs').argv

const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const postcssPresetEnv = require('postcss-preset-env')
const cssnano = require('cssnano')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isProd = args.prod
const isDev = args.dev
const env = args.envFile
if (env) {
  // Load env file
  require('dotenv').config({ path: env })
}

const main = ['./src/site.js']
const common = ['./src/common.js']
let devtool

if (isDev) {
  main.push('webpack-dev-server/client?http://0.0.0.0:8080')
  devtool = 'source-map'
}

const plugins = [
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({ filename: '[name].[hash].css' }),
  new HtmlWebpackPlugin({
    template: './src/index.html',
    chunks: ['main'],
    inject: 'body',
    // github pages url includes a path e.g. https://foo/repo-name this makes that work
    base: args.mode === 'production' ? 'https://coopdigital.github.io/build-your-own-radar/' : '/',
  }),
  new HtmlWebpackPlugin({
    template: './src/error.html',
    chunks: ['common'],
    inject: 'body',
    filename: 'error.html'
  }),
  new webpack.DefinePlugin({
    'process.env.CLIENT_ID': JSON.stringify(process.env.CLIENT_ID),
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.ENABLE_GOOGLE_AUTH': JSON.stringify(process.env.ENABLE_GOOGLE_AUTH),
    'process.env.GTM_ID': JSON.stringify(process.env.GTM_ID)
  })
]

if (isProd) {
  plugins.push(
    new webpack.NoEmitOnErrorsPlugin()
  )
}

module.exports = {
  entry: {
    main: main,
    common: common
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },

  output: {
    path: buildPath,
    filename: '[name].[hash].js',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: [{ loader: 'babel-loader' }] },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          'style-loader', 
          MiniCssExtractPlugin.loader, 
          {
            loader: 'css-loader',
            options: { importLoaders: 1 }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                postcssPresetEnv({ browsers: 'last 2 versions' }),
                cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
              ]
            }
          }, 
          { 
            loader: 'sass-loader', 
            options: {
              prependData: '$publicpath : "' + (args.mode === 'production' ? '/build-your-own-radar/' : '/') + '";'
            }
          }
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader?name=images/[name].[ext]'
      },
      {
        test: /\.(png|jpg|ico)$/,
        exclude: /node_modules/,
        use: [{ loader: 'file-loader?name=images/[name].[ext]&context=./src/images' }]
      },
      {
        test: require.resolve('jquery'),
        use: [{ loader: 'expose-loader', options: 'jQuery' }, { loader: 'expose-loader', options: '$' }]
      }
    ]
  },

  plugins: plugins,

  devtool: devtool,

  devServer: {
    contentBase: buildPath,
    host: '0.0.0.0',
    port: 8080
  }
}
