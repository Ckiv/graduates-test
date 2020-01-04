const express = require("express");
const expressHbs = require("express-handlebars");
const hbs = require("hbs");
const app = express();

// устанавливаем настройки для файлов layout
app.engine("hbs", expressHbs(
    {
        layoutsDir: "views/layouts",
        defaultLayout: "layout",
        extname: "hbs"
    }
))
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials");

app.use("/contact", function(request, response){

    response.render("contact", {
        title: "Мои контакты",
        emailsVisible: true,
        emails: ["gavgav@mycorp.com", "mioaw@mycorp.com"],
        phone: "+1234567890"
    });
});

app.use("/", function(request, response){

    response.render("home.hbs");
});
app.listen(3000);









/*const express = require("express");
const app = express();
var mysql = require("mysql");

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_graduates',
    port: 3306
});

// обработка запроса по адресу /about
app.get("/about", function(request, response){

    response.send("<h1>О сайте</h1>");
});

// обработка запроса по адресу /contact
app.use("/contact", function(request, response){

    response.send("<h1>Контакты</h1>");
});
//включение статических файлов
app.use(express.static(__dirname + '/public'));

// обработка запроса к корню веб-сайта
app.use("/", function(request, response){

    response.sendFile(__dirname + "/public/index.html");
});
app.listen(3000);

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

/*
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
var mysql = require("mysql");

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_graduates',
    port: 3306
});
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
