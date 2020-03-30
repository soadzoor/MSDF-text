
const BUILD_DEV  = "build/dev";
const production = (process.env.NODE_ENV === "production");

const TsConfigPathsPlugin = require('awesome-typescript-loader').TsConfigPathsPlugin;

const path = require("path");

module.exports = {
	mode: production ? "production" : "development",
	entry: "./src/ts/Main.ts",
	output: {
		filename: "app.bundle.js",
		path: __dirname + `/${BUILD_DEV}/js`,
		chunkFilename: "[name].chunk.js",
		//path: path.resolve(__dirname, `/${BUILD_DEV}/src`)
		publicPath: "src/"
	},

	// Enable sourcemaps for debugging webpack's output.
	devtool: "source-map",

	resolve: {
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: [".ts", ".tsx", ".js", ".json"],
		plugins: [
			new TsConfigPathsPlugin(/* { tsconfig, compiler } */)
		]
	},

	module: {
		rules: [

			// {
			// 	test: /\.ts$/,
			// 	include: path.join(__dirname, "src"),
			// 	loader: "ts-loader"
			// },

			// All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
			{ test: /\.tsx?$/, loader: "awesome-typescript-loader" },

			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
			{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
		]
	},

	// When importing a module whose path matches one of the following, just
	// assume a corresponding global variable exists and use that instead.
	// This is important because it allows us to avoid bundling all of our
	// dependencies, which allows browsers to cache those libraries between builds.
	externals: {
	}
};
