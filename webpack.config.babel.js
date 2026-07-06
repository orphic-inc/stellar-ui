import { resolve } from 'path';
import webpack from 'webpack';
import dotenv from 'dotenv';
import HtmlPlugin from 'html-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin as CleanPlugin } from 'clean-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

import pkg from './package.json';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const dev = process.env.NODE_ENV === 'development';
const apiUrl = process.env.STELLAR_API_URL || 'http://localhost:8080';

// Content-Security-Policy — the inject-time half of the stylesheet boundary
// (ADR-0003). User themes may restyle anything, so the policy is permissive on
// the *resource* axes (style/img/font/connect) to keep that freedom and avoid
// breaking legit assets (avatars, cover art, Sentry ingest). Its teeth are the
// code-execution axes: `script-src 'self'` (no inline/eval/remote script — the
// real XSS gate), `object-src 'none'`, `base-uri`/`form-action 'self'`. Emitted
// in production builds only — dev uses eval source-maps + ws: HMR that a strict
// script-src/connect-src would break. (frame-ancestors can't be set via <meta>;
// it needs a response header — tracked separately.)
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: https: http:",
  "font-src 'self' data: https:",
  "connect-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

const plugins = [
  new webpack.DefinePlugin({
    __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN || ''),
    // Footer version surface — pinned to the manifest so it can't drift.
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Deploy environment for Sentry (dev/production), from NODE_ENV.
    __APP_ENV__: JSON.stringify(process.env.NODE_ENV || 'development')
  }),
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
    template: './src/index.html',
    // Prod-only: dev's eval source-maps + ws: HMR need a looser policy.
    meta: dev
      ? {}
      : {
          'Content-Security-Policy': {
            'http-equiv': 'Content-Security-Policy',
            content: CSP
          }
        }
  }),
  new CopyPlugin({
    patterns: [
      { from: 'src/stylesheets', to: 'stylesheets' },
      // Cold-load theme pre-apply script (ADR-0024 §4) — must be a plain,
      // unbundled same-origin file so it satisfies script-src 'self' without
      // an inline-script CSP exception, and runs standalone before the app
      // bundle even starts loading.
      { from: 'src/preapply-theme.js', to: 'preapply-theme.js' },
      // The footer links to these repo-root files as raw paths (/LICENSE,
      // /CHANGELOG.md). Emit them into the output root so they resolve as real
      // assets in dev and prod — otherwise historyApiFallback swallows /LICENSE
      // into the SPA shell and 404s /CHANGELOG.md on the dot-rule.
      { from: 'CHANGELOG.md', to: 'CHANGELOG.md' },
      // toType 'file' is required: LICENSE has no extension, so CopyPlugin would
      // otherwise treat the target as a directory and emit dist/LICENSE/LICENSE.
      { from: 'LICENSE', to: 'LICENSE', toType: 'file' }
    ]
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
    static: [
      {
        directory: resolve(__dirname, 'src/stylesheets'),
        publicPath: '/stylesheets'
      }
    ],
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
            options: {
              minimize: true,
              sources: {
                // The pre-apply script (ADR-0024 §4) is deployed as a static,
                // unbundled file via CopyPlugin, not a webpack module — html-loader
                // would otherwise try to resolve its root-absolute src as an
                // import and fail the build.
                urlFilter: (_attribute, value) => value !== '/preapply-theme.js'
              }
            }
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
    publicPath: '/',
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
