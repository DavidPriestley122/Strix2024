import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  mode: "production", // Set the mode to 'development' or 'production'
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
};
