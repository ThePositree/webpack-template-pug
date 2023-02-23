const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = env => {
	const mode = env.production ? 'production' : 'development'
	const devMode = mode === 'development'
	const target = devMode ? 'web' : 'browserslist'
	const devtool = devMode ? 'source-map' : undefined

	const PATHS = {
		src: path.resolve(__dirname, 'src'),
		pages: path.resolve(__dirname, 'src', 'pug', 'pages'),
		dist: path.resolve(__dirname, 'dist'),
		assets: 'assets/',
	}

	const filesJs = fs
		.readdirSync(PATHS.src)
		.filter(filename => filename.endsWith('.js'))

	const filesHTML = fs
		.readdirSync(PATHS.pages)
		.filter(filename => filename.endsWith('.pug'))

	const entryFiles = () => {
		let entry = {
			babel: '@babel/polyfill',
		}
		for (const filename of filesJs) {
			const entryName = filename.replace('.js', '')
			entry[entryName] = path.resolve(PATHS.src, filename)
		}
		return entry
	}

	const HtmlWebpackPluginFiles = () => {
		let arr = []
		for (const filename of filesHTML) {
			arr.push(
				new HtmlWebpackPlugin({
					template: path.resolve(PATHS.pages, filename),
					filename: filename.replace('.pug', '.html'),
					chunks: [filename.replace('.pug', '')],
					minify: false,
				})
			)
		}
		return arr
	}

	const cssLoaders = extra => {
		const loaders = [
			devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
			'css-loader',
			'postcss-loader',
		]
		if (extra) {
			loaders.push(extra)
		}
		return loaders
	}

	const webpack = {
		entry: entryFiles(),
		devtool,
		target,
		mode,
		devServer: {
			open: true,
			port: 3000,
		},
		output: {
			path: PATHS.dist,
			filename: 'js/[name]-[contenthash].js',
			clean: true,
			assetModuleFilename: 'assets/[hash][ext]',
		},
		optimization: {
			splitChunks: {
				cacheGroups: {
					vendor: {
						name: 'vendors',
						test: /node_modules/,
						chunks: 'all',
						enforce: true,
					},
				},
			},
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: 'styles/[name]-[hash].css',
				runtime: true,
			}),
			...HtmlWebpackPluginFiles(),
		],
		module: {
			rules: [
				{
					test: /\.pug$/,
					use: ['pug-loader'],
				},
				{
					test: /\.css$/,
					use: cssLoaders(),
				},
				{
					test: /\.s[ac]ss$/,
					use: cssLoaders('sass-loader'),
				},
				{
					test: /\.m?js$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
					},
				},
				{
					test: /\.woff2?$/,
					type: 'asset/resource',
					generator: {
						filename: 'fonts/[name][ext]',
					},
				},
				{
					test: /\.(png|jpe?g|gif|svg|webp)$/,
					type: 'asset/resource',
					use: [
						{
							loader: 'image-webpack-loader',
							options: {
								mozjpeg: {
									progressive: true,
								},
								optipng: {
									enabled: false,
								},
								pngquant: {
									quality: [0.65, 0.9],
									speed: 4,
								},
								gifsicle: {
									interlaced: false,
								},
								webp: {
									quality: 75,
								},
							},
						},
					],
				},
			],
		},
	}
	return webpack
}
