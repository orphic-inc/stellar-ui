import { resolve } from 'path';
import HtmlPlugin from 'html-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin as CleanPlugin } from 'clean-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

const dev = process.env.NODE_ENV === 'development';
const apiUrl = process.env.STELLAR_API_URL || 'http://127.0.0.1:8080';

const plugins = [
  new CleanPlugin(),
  new StylelintPlugin({
    configFile: '.stylelintrc',
    context: 'src',
    files: '**/*.scss',
    failOnError: true,
    quiet: false
  }),
  new MiniCssExtractPlugin({
    filename: '[name]-[chunkhash].css'
  }),
  new HtmlPlugin({
    template: './src/index.html'
  })
];

if (dev) {
  plugins.push(new ESLintPlugin({ extensions: ['js', 'ts', 'tsx'] }));
}

export default {
  mode: dev ? 'development' : 'production',
  devtool: dev ? 'eval-cheap-module-source-map' : 'cheap-module-source-map',
  entry: './src/index.tsx',
  devServer: {
    compress: dev,
    open: true,
    historyApiFallback: true,
    port: 9000,
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                ident: 'postcss',
                plugins: [
                  require('@tailwindcss/postcss'),
                  require('autoprefixer'),
                  require('postcss-flexbugs-fixes')
                ],
                sourceMap: dev
              }
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: true }
          }
        ]
      },
      {
        test: /\.png$/,
        type: 'asset/resource'
      }
    ]
  },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js'
  },
  plugins,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    modules: ['node_modules', resolve(__dirname, 'src')],
    alias: {
      components: resolve(__dirname, 'src/components'),
      utils: resolve(__dirname, 'src/utils')
    }
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 12
        }
      }),
      new CssMinimizerPlugin()
    ]
  }
};
