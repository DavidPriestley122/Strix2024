import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  mode: "development", // Set the mode to 'development' or 'production'
  entry: "./src/main.js", // Update the entry point to './main.js'
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".js"],
    modules: ["node_modules", "src"],
    alias: {
      "@babylonjs/gui": path.resolve(__dirname, "node_modules/@babylonjs/gui"),
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  //externals: {
  // earcut: 'earcut', // Add this line
  //},
};

/*

import path from 'path';
import { fileURLToPath } from 'url';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  mode: 'development', // Set the mode to 'development' or 'production'
  entry: './main.js', // Update the entry point to './main.js'
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js'],
    modules: ['node_modules', 'src'],
    alias: {
      '@babylonjs/gui': path.resolve(__dirname, 'node_modules/@babylonjs/gui'),
    },
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: true,
    }),
  ],
  //externals: {
  // earcut: 'earcut', // Add this line
  //},
};
*/

/*
import path from 'path';
import { fileURLToPath } from 'url';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  mode: 'production', // Changed to production
  entry: './main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js'],
    modules: ['node_modules', 'src'],
    alias: {
      '@babylonjs/gui': path.resolve(__dirname, 'node_modules/@babylonjs/gui'),
    },
  },
  //plugins: [
 //   new BundleAnalyzerPlugin({
   //   analyzerMode: 'static',
   //   reportFilename: 'bundle-report.html',
  //    openAnalyzer: true,
  //  }),
  //],
  //externals: {
  // earcut: 'earcut', // Add this line
  //},
};
*/

/*
import path from 'path';
import { fileURLToPath } from 'url';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  mode: 'development',
  entry: './main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'node_modules')],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    usedExports: true,
    sideEffects: true,
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true,
        },
        output: {
          comments: false,
        },
      },
      extractComments: false,
    })],
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: true,
      generateStatsFile: true,
      statsFilename: 'stats.json',
      statsOptions: { source: false }
    }),
  ],
};
*/
