// https://github.com/webpack/docs/wiki/how-to-write-a-plugin
function PostElectronBuild(options) {
  // Setup the plugin instance with options...
}

PostElectronBuild.prototype.apply = function(compiler) {
  //compiler.plugin('run', function(compiler, callback) {});
  compiler.plugin('done', function() {
  console.log('\n');
	const callback = (err, stdout) => {
    if (err) {
      throw err;
    }
    console.log(stdout)
  };
	
  const exec = require('child_process').exec;
  const fs = require('fs');
  const path = require('path');
  
  fs.readlink(path.resolve("dist\\app\\node_modules"), (err, linkString) => {
    if (err) // link not found
      exec('cd dist\\app && mklink /d "node_modules" "..\\..\\node_modules"', callback);
  });

  fs.readlink(path.resolve("dist\\app\\extras"), (err, linkString) => {
    if (err) // link not found
      exec('cd dist\\app && mklink /d "extras" "..\\..\\extras"', callback);
  });

	exec('copy package.json dist\\app\\', callback);
	exec('copy index.prod.html dist\\app\\index.html', callback);
	exec('copy background.prod.html dist\\app\\background.html', callback);
  });
};

module.exports = PostElectronBuild;
