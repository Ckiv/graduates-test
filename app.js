// подключение express
const express = require("express");

const app = express();

app.use(express.static(__dirname + "/public"));

app.use("/", function(request, response){

    response.send("<h1>Главная страница</h1>");
});

app.listen(3000);




/*var mysql = require("mysql");

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_graduates',
    port: 3306
});

var express = require('express');
var app = express();

app.get('/graduates/html/index.html', function (req, res) {
    res.sendFile(__dirname + "/html/index.html");

});
app.get('/graduates/html/lol', function (req, res) {
    res.send('lol');

});
app.listen(63342);
*/

/*
connection.connect(function(err) {
    if (err) throw err;
    console.log("Подключение к серверу MySQL успешно установлено");
});

const sql = `SELECT * FROM graduate`;

connection.query(sql, function(err, results) {
    if(err) console.log(err);
    console.log(results);
});

connection.end(function(err) {
    if (err) {
        return console.log("Ошибка: " + err.message);
    }
    console.log("Подключение закрыто");
});
*/
