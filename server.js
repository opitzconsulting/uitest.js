var ejs = require('ejs');
var express = require('express');
var app = express.createServer();
var cfg = require("./package.json");

app.configure('development', function(){
    app.use(express.static(__dirname));
    app.set('views', "src");
    app.set('view options', { layout: false });
});

app.get("/uitest.js", function(req, res){
    res.render('uitest.ejs', cfg);
});

var port = 9000;
app.listen(port);
console.log("listening on port "+port);
