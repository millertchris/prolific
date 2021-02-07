const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	mode: 'development',
	entry: ['./src/js/index.js'],
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: '',
	},
	devtool: 'inline-source-map',
	devServer: {
		contentBase: path.resolve('static'),
	},
	module: {
		rules: [
			{
				test: /\.(png|svg|jpg|jpeg|gif|mp3)$/i,
				type: 'asset/resource',
				generator: {
					//If emitting file, the file path is
					filename: 'images/[name][ext][query]',
				},
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					// fallback to style-loader in development
					process.env.NODE_ENV !== 'production'
						? 'style-loader'
						: MiniCssExtractPlugin.loader,
					'css-loader',
					'sass-loader',
				],
			},
			// There's a good example that's worth checking out later
			// in how to include multiple HTML files.
			// https://www.youtube.com/watch?v=y_RFOaSDL8I
		],
	},
	plugins: [
		new CleanWebpackPlugin({
			cleanStaleWebpackAssets: false,
		}),
		new HtmlWebpackPlugin({
			title: 'Development',
			// Load a custom template (lodash by default)
			filename: 'index.html',
			template: 'src/html/pages/index.html',
		}),
		new MiniCssExtractPlugin({
			// Options similar to the same options in webpackOptions.output
			// both options are optional
			filename: '[name].css',
			chunkFilename: '[id].css',
		}),
	],
};
