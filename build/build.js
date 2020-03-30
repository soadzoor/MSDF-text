
const LOCAL_ROOT = ".";
const BUILD_DEV  = "build/dev";
const BUILD_PROD = "build/prod";
const NODE_MODULES_PATH = "./node_modules";

const args = process.argv.slice(2);

const shell = require('shelljs');

if (args.indexOf("--prod") > -1) {

	process.env.NODE_ENV = "production";
}

build_dev();

if (process.env.NODE_ENV === "production") {
	build_prod();
}

function build_dev() {

	shx(`rm -rf ${BUILD_DEV}`);
	exec_module("webpack");

	shx(`cp src/index.html ${BUILD_DEV}/index.html`);

	assets();
	css();
}

function build_prod() {
	shx(`rm -rf ${BUILD_PROD}`);
	shx(`cp -R ${BUILD_DEV}/ ${BUILD_PROD}/`);
	shx(`rm -rf ${BUILD_PROD}/js/*.js.map`);

	shell.ls(`${BUILD_PROD}/js`).forEach(jsFileName => {
		exec_module("uglifyjs", `${BUILD_PROD}/js/${jsFileName} -o ${BUILD_PROD}/js/${jsFileName} --compress --mangle`);
	});

	exec_module("uglifycss", `${BUILD_PROD}/css/style.css --output ${BUILD_PROD}/css/style.css`);
}

function shx(command) {

	const module = "shx";
	const args = command;

	return exec_module(module, args);
}

function exec_module(module, args) {

	return exec(`"${NODE_MODULES_PATH}/.bin/${module}"`, args);
}

function exec(command, args) {

	//console.log("command", command, args);

	args = args || "";

	// http://stackoverflow.com/questions/30134236/use-child-process-execsync-but-keep-output-in-console
	// https://nodejs.org/api/child_process.html#child_process_child_stdio

	var stdio = [
		0,
		1, // !
		2
	];

	try {
		var result = require("child_process").execSync(command + " " + args, {stdio: stdio});

	} catch (e) {
		// this is needed for messages to display when from the typescript watcher
		throw e;
	}

	return result;
}

function assets() {

	shx(`rm -rf ${BUILD_DEV}/assets`);
	shx(`cp -R ${LOCAL_ROOT}/src/assets ${BUILD_DEV}/assets`);
}

function css() {
	shx(`cp -R src/css ${BUILD_DEV}/css`);
}
