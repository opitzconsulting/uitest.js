var cfg = require("./package.json");
var ejs = require('ejs');
var fs = require('fs');

var modules = ['uitest'];

modules.forEach(function(module) {
    var fileName = 'src/'+module+'.ejs';
    var content = fs.readFileSync(fileName, 'utf-8');
    var rendered = ejs.compile(content, {
        filename: fileName
    })(cfg);
    fs.writeFileSync('compiled/'+module+'-'+cfg.version+'.js', rendered);
});
