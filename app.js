const mysql = require("mysql2"); //const mysql = require("mysql2/promise");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const urlencodedParser = bodyParser.urlencoded({extended: false});
app.set("view engine", "hbs");
app.use(express.static('public'));


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_graduates',
    port: 3306
});



// запись из Excel в переменную
var parser = new (require('simple-excel-to-json').XlsParser)();
var doc = parser.parseXls2Json('./public/grad-db.xlsx');
//print the data of the first sheet
var data = doc[0];

/*

// запись в БД
async function setDataGraduate() {

    const specialty = await pool.query('SELECT * FROM specialty');
    const faculty = await pool.query('SELECT * FROM faculty');
    const user = await pool.query('SELECT * FROM userr');
    const training = await pool.query('SELECT * FROM training');

    let idSpecialty;
    let idFaculty;
    let idUser=2;
    let idTraining;

    for (let i=0; i<=235; i++){
        //написать условия для определения id для записи
        for (let tempSpec=0; tempSpec<specialty[0].length; tempSpec++){
            if (data[i].specialty === specialty[0][tempSpec].title_specialty){
                idSpecialty = specialty[0][tempSpec].id;
            }
        }

        for (let tempFacult=0; tempFacult<faculty[0].length; tempFacult++){
            if (data[i].faculty === faculty[0][tempFacult].title_faculty){
                idFaculty = faculty[0][tempFacult].id;
            }
        }

        for (let tempTrain=0; tempTrain<training[0].length; tempTrain++){
            if (data[i].training === training[0][tempTrain].type_training){
                idTraining = training[0][tempTrain].id;
            }
        }

        pool.query("INSERT INTO graduate (id_specialty, id_faculty, id_user, id_training, groupp, year, diploma, name, lastname, patronymic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [idSpecialty, idFaculty, idUser, idTraining, data[i].group, data[i].year, data[i].diploma, data[i].name, data[i].lastname, data[i].patronymic],  function(err, data) {
            if(err) return console.log(err);
            console.log("выполнено");
        });

        idSpecialty=0;
        idFaculty=0;
        idTraining=0;

    }
    console.log("успешная запись в бд");
}

setDataGraduate();
*/

app.get("/", function(req, res){
    res.render("index.hbs");
});

// поиск выпускников
app.post("/index", urlencodedParser, function(req, res){
    if (!req.body) return res.sendStatus(400);
    if (req.body.facultyForm!==undefined && (req.body.specialtyForm==='' || req.body.groupForm==='' || req.body.trainingForm===undefined || req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=?";
        pool.query(sql, [req.body.facultyForm], function(err, data) {
            if(err) return console.log(err);
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.specialtyForm!=='' && (req.body.facultyForm===undefined || req.body.groupForm==='' || req.body.trainingForm===undefined || req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  specialty.title_specialty=?";
        pool.query(sql, [req.body.specialtyForm], function(err, data) {
            if(err) return console.log(err);
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.groupForm!=='' && (req.body.facultyForm===undefined || req.body.specialtyForm==='' || req.body.trainingForm===undefined || req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  graduate.groupp=?";
        pool.query(sql, [req.body.groupForm], function(err, data) {
            if(err) return console.log(err);
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.trainingForm!==undefined && (req.body.facultyForm===undefined || req.body.specialtyForm==='' || req.body.groupForm==='' || req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  training.type_training=?";
        pool.query(sql, [req.body.trainingForm], function(err, data) {
            if(err) return console.log(err);
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.yearForm!=='' && (req.body.facultyForm===undefined || req.body.specialtyForm==='' || req.body.groupForm==='' || req.body.trainingForm===undefined)){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  graduate.year=?";
        pool.query(sql, [req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else {
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and specialty.title_specialty=? and graduate.groupp=? and training.type_training=? and graduate.year=?";
        pool.query(sql, [req.body.facultyForm, req.body.specialtyForm, req.body.groupForm, req.body.trainingForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            res.render("index.hbs", {
                graduate: data
            });
        });
    }

    console.log("факультет из формы: " + req.body.facultyForm);
    console.log("специальность из формы: " + req.body.specialtyForm);
    console.log("группа из формы: " + req.body.groupForm);
    console.log("форма обучения из формы: " + req.body.trainingForm);
    console.log("год из формы: " + req.body.yearForm);
    //res.render("index.hbs");
});

//graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id
/* app.post("/index", urlencodedParser, function(req, res){
    if (!req.body) return res.sendStatus(400);
    pool.query("SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and faculty.title_faculty='Гуманитарный факультет'", function(err, data) {
        if(err) return console.log(err);
        res.render("index.hbs", {
            graduate: data
        });
    });

    console.log(req.body);
    //res.render("index.hbs");
});*/

/*
// заполняем БД
app.post("/create", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const age = req.body.age;
    pool.query("INSERT INTO users (name, age) VALUES (?,?)", [name, age], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

 возвращаем форму для добавления данных
app.get("/create", function(req, res){
    res.render("create.hbs");
});
// получем id редактируемого пользователя, получаем его из бд и отправлям с формой редактирования
app.get("/edit/:id", function(req, res){
    const id = req.params.id;
    pool.query("SELECT * FROM users WHERE id=?", [id], function(err, data) {
        if(err) return console.log(err);
        res.render("edit.hbs", {
            user: data[0]
        });
    });
});
// получаем отредактированные данные и отправляем их в БД
app.post("/edit", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const age = req.body.age;
    const id = req.body.id;

    pool.query("UPDATE users SET name=?, age=? WHERE id=?", [name, age, id], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

// получаем id удаляемого пользователя и удаляем его из бд
app.post("/delete/:id", function(req, res){

    const id = req.params.id;
    pool.query("DELETE FROM users WHERE id=?", [id], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});
*/
app.listen(3000, function(){
    console.log("Сервер ожидает подключения...");
});









/*const express = require("express");
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
*/











