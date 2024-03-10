const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
    entry: './src/dragDropAnnotate.js',
    output: {
        filename: 'dragDropAnnotate.min.js',
        path: path.resolve(__dirname, 'src'),
        publicPath: '/src/'
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                minify: TerserPlugin.uglifyJsMinify,
            }),
            new CssMinimizerPlugin()
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'example'),
        },
        watchFiles: ['src/**/*.min.js', 'src/**/*.min.css', 'example/**/*'],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'dragDropAnnotate.min.css',
        })
    ],
    module: {
        rules: [
            {
                test: /\.(css)$/,
                use: [MiniCssExtractPlugin.loader,'css-loader']
            }
        ]
    }
};
