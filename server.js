var express = require('express');
var app = express();

app.use(express.static(__dirname));
// Display resources
app.get('/', function(req, res) {
    res.render('index.html');
});

console.log("Listen 4201");
app.listen(4201);
