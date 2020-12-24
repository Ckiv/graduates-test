const mysql = require("mysql2"); //const mysql = require("mysql2/promise");
//const mysqlasyn = require("mysql2/promise");
const express = require("express");

const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const bodyParser = require("body-parser");
const urlencodedParser = express.urlencoded({extended: false});
//const urlencodedParser = bodyParser.urlencoded({extended: false});

const app = express();
app.use(express.json());

const expressHbs = require('express-handlebars');
const hbs = require('hbs');
app.engine(
    'hbs',
    expressHbs({
        layoutsDir: 'views/layouts',
        defaultLayout: 'layout',
        extname: 'hbs'
    })
);
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + '/views/partials');
app.use(express.static('public'));

// для загрузки фото
const multer  = require("multer");

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "public/picture/photoGraduate");
    },
    filename: (req, file, cb) =>{
        cb(null, file.originalname);
    }
});
const upload = multer({storage: storageConfig});

// пул подключения к бд
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_graduates',
    port: 3306
});

//для авторизации начало
app.use(express.json()); //Переводим все полученные данные в объекты json
app.use(express.urlencoded({extended: false})); //Запрещаем формировать массивы(Если передаете массив данных,лучше поставить true)
//Инициализируем сессию
app.use(
    session({
        secret: "secret", //Задаем ключ сессий
        store: new FileStore(), //Указываем место хранения сессий(Используя этот пакет,у вас будет создана папка sessions, в которой будут хранится сессии и, даже если сервер перезагрузится,пользователь останется авторизованным
        cookie: {
            path: "/",
            httpOnly: true, // path - куда сохранять куки, httpOnly: true - передача данных только по https/http,maxAge - время жизни куки в миллисекундах 60 * 60 * 1000 = 1 час
            maxAge: 60 * 60 * 5000
        },
        resave: false,
        saveUninitialized: false

    })
);


var idsess =  require('./config'); //Подключаем наш конфиг
app.use(passport.initialize()); //Инициализируем паспорт
app.use(passport.session()); //Синхронизируем сессию с паспортом
//Проверяем если авторизован - пропускаем дальше,если нет запрещаем посещение роута
const logout = (req,res,next) => {
    if(req.isAuthenticated()) {
        return res.redirect('/admin');
    } else {
        next()
    }
};

app.get("/login", function(req, res){
    res.render("login.hbs");
});
//При POST запросе проверяем передан ли пользователь, если да - пропускаем,если нет - возвращаем к форме
app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/login');

        }
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});

//Проверяем если пользователь авторизован - пропускаем,если нет - возвращаем к форме
const auth = (req,res,next) => {
    if(req.isAuthenticated()) {
        next()
    } else {
        return res.redirect('/erroraccess');
    }
};

app.get("/erroraccess", function(req, res){
    res.render("erroraccess.hbs");
});
//Если пользователь прошел аутентификацию - что-то делаем,я вывожу сообщение "Admin page"

//Если роут /logout выкидываем пользователя из сессии и перекидываем на форму
app.get('/logout', (req,res) => {
    req.logout();
    res.redirect('/');
});
//для авторизации конец

//роутинг страница профиля
app.get("/profile", auth, function(req, res){
    let idGrad = req.query.id;
    let sqlgallery = "SELECT * FROM photos where id_graduate=?";
    let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.id_grad=?";
    pool.query(sql, [idGrad], function(err, data) {
        if(err) return console.log(err);
        if (data[0].avatarphoto===null){
            data[0].avatarphoto="nophoto.png";
        }
        pool.query(sqlgallery, [idGrad], function(err, datagallery) {
            if(err) return console.log(err);
            res.render("profile.hbs", {
                graduate: data,
                gallery: datagallery
            });
        });
    });
    // res.render("profile.hbs");
});

/*let sql = "SELECT * FROM graduate, faculty, specialty, training, photos  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.id_grad=id_graduate and graduate.id_grad=?";
    pool.query(sql, [idGrad], function(err, data) {
        if(err) return console.log(err);
        if (data[0].avatarphoto===null){
            data[0].avatarphoto="nophoto.png";
        }
        res.render("profile.hbs", {
            graduate: data
        });
    });*/


//роутинг редактирование профиля
app.get("/profileedit", auth, function(req, res){
    let idGrad = idsess.idsession;
    let sqlgallery = "SELECT * FROM photos where id_graduate=?";
    let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.id_grad=?";
    pool.query(sql, [idGrad], function(err, data) {
        if(err) return console.log(err);
        if (data[0].avatarphoto===null){
            data[0].avatarphoto="nophoto.png";
        }
        pool.query(sqlgallery, [idGrad], function(err, datagallery) {
            if(err) return console.log(err);
            res.render("profileedit.hbs", {
                graduate: data,
                gallery: datagallery
            });
        });
    });


});
//app.use(multer({storage:storageConfig}).array("filedata",3));
app.post("/profileedit", urlencodedParser, function(req, res){
    if(!req.body) return res.sendStatus(400);
        let sql = "UPDATE graduate SET career=?, review=?, number=?, email=? where graduate.id_grad=?";
        pool.query(sql, [req.body.career, req.body.review, req.body.number, req.body.email, idsess.idsession], function (err, data) {
            if(err) return console.log(err);
            res.redirect("/profileedit");
            console.log("успешная запись в бд");
        });

    //res.render("profileedit.hbs");
});
//загрузка аватарки
app.post("/avatorphoto", urlencodedParser, upload.single('filedata'), function(req, res){
    let filedata = req.file;
    //console.log(filedata.length);

    if(!req.body) return res.sendStatus(400);
        let sql = "UPDATE graduate SET avatarphoto=? where graduate.id_grad=?";
        pool.query(sql, [filedata.filename, idsess.idsession], function (err, data) {
            if(err) return console.log(err);
            res.redirect("/profileedit");
            console.log("успешная запись в бд");
        });

    //res.render("profileedit.hbs");
});
//загрузка в галлерею
app.post("/gallery", urlencodedParser, upload.array('filedata', 5), function(req, res){
    let filedata = req.files;
    let i=0;
    let sqliseert = "INSERT INTO photos (id_graduate, photo_name) VALUES (?, ?)";
    while (i<filedata.length){
        pool.query(sqliseert, [idsess.idsession, filedata[i].filename], function (err, data) {
            if(err) return console.log(err);

            console.log("успешная запись в бд: ", i);
        });
        i++;
    }
    res.redirect("/profileedit");
});
// удаление фото
app.post("/deletephoto",  function (req, res) {
    const fs = require("fs");
    let photoName = req.query.photo_name;
    fs.unlink("public/picture/photoGraduate/"+ photoName, (err) => {
        if (err) console.log(err); // если возникла ошибка
        else console.log("file was deleted");
    });
    pool.query("DELETE FROM photos WHERE photo_name=?", [photoName], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/profileedit");
    });
    //res.redirect("/profileedit");
});

//роутинг страница администратора
app.get("/administrator", function(req, res){
    /*let idGrad = idsess.idsession;
    if (idGrad === 5843) {
        res.render("administrator.hbs");
    }
    else {
        return res.redirect('/erroraccess');
    }*/
    res.render("administrator.hbs");
});

//страница администратора поиск
app.post("/formseachadmin", urlencodedParser, function(req, res){
    if (!req.body) return res.sendStatus(400);
    /* поиск оп форме справа */
    if (req.body.facultyForm!==undefined && (req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.trainingForm===undefined && req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=?";
        pool.query(sql, [req.body.facultyForm], function(err, data) {
            if(err) return console.log(err);
            console.log("data.length: ", data.length);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.trainingForm!==undefined && (req.body.facultyForm===undefined && req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  training.type_training=?";
        pool.query(sql, [req.body.trainingForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.yearForm!=='' && (req.body.facultyForm===undefined && req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.trainingForm===undefined)){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  graduate.year=?";
        pool.query(sql, [req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else if ((req.body.facultyForm!==undefined && req.body.trainingForm!==undefined) && (req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and  training.type_training=?";
        pool.query(sql, [req.body.facultyForm, req.body.trainingForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else if ((req.body.facultyForm!==undefined && req.body.yearForm!=='') && (req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.trainingForm===undefined)){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and  graduate.year=?";
        pool.query(sql, [req.body.facultyForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else if ((req.body.trainingForm!==undefined && req.body.yearForm!=='') && (req.body.facultyForm===undefined && req.body.specialtyForm===undefined && req.body.groupForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and training.type_training=? and  graduate.year=?";
        pool.query(sql, [req.body.trainingForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else if ((req.body.facultyForm!==undefined && req.body.trainingForm!==undefined && req.body.yearForm!=='') && (req.body.specialtyForm===undefined && req.body.groupForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and  training.type_training=? and  graduate.year=?";
        pool.query(sql, [req.body.facultyForm, req.body.trainingForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.specialtyForm!==undefined && (req.body.facultyForm===undefined || req.body.groupForm==='' || req.body.trainingForm===undefined || req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  specialty.title_specialty=?";
        pool.query(sql, [req.body.specialtyForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.groupForm!=='' && (req.body.facultyForm===undefined || req.body.specialtyForm===undefined || req.body.trainingForm===undefined || req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  graduate.groupp=?";
        pool.query(sql, [req.body.groupForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    else {
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and specialty.title_specialty=? and graduate.groupp=? and training.type_training=? and graduate.year=?";
        pool.query(sql, [req.body.facultyForm, req.body.specialtyForm, req.body.groupForm, req.body.trainingForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }

});
//страница администратора поиск по фио
app.post("/fioseachadmin", urlencodedParser, function(req, res){
    if (!req.body) return res.sendStatus(400);
    if (req.body.fild_lastname_seach!=='' && req.body.fild_name_seach===''){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.lastname=?";
        pool.query(sql, [req.body.fild_lastname_seach], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }

    else if (req.body.fild_lastname_seach==='' && req.body.fild_name_seach!==''){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.name=?";
        pool.query(sql, [req.body.fild_name_seach], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }

    else if (req.body.fild_lastname_seach!=='' && req.body.fild_name_seach!==''){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.lastname=? and graduate.name=?";
        pool.query(sql, [req.body.fild_lastname_seach, req.body.fild_name_seach], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("administrator.hbs", {
                graduate: data
            });
        });
    }
    //res.render("index.hbs");
});

app.post("/delete", function(req, res){
    let idGrad = req.query.id;
    pool.query("DELETE FROM graduate WHERE id_grad=?", [idGrad], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/administrator");
    });
});

app.get("/graduateedit", function(req, res){
    let idGrad = req.query.id;
    let idGradadmin = idsess.idsession;
    if (idGradadmin === 5843) {
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.id_grad=?";
        pool.query(sql, [idGrad], function(err, data) {
            if(err) return console.log(err);
            console.log("id page", idGrad);
            res.render("graduateedit.hbs", {
                graduate: data
            });
        });
    }
    else {
        return res.redirect('/erroraccess');
    }
});

app.post("/formedit", urlencodedParser, function (req, res) {
    let idGrad = req.query.id;
    if(!req.body) return res.sendStatus(400);
    let facultyForm = req.body.facultyForm;
    let trainingForm = req.body.trainingForm;
    let yearForm = req.body.yearForm;
    let specialtyForm = req.body.specialtyForm;
    let groupForm = req.body.groupForm;
    let fs = require('fs');
    let datadb = JSON.parse(fs.readFileSync('public/datadb.json', 'utf8'));

    let specialty = datadb.specialty;
    let faculty = datadb.faculty;
    let training = datadb.training;

    let idSpecialty;
    let idFaculty;
    let idTraining;

    for (let tempSpec=0; tempSpec<specialty.length; tempSpec++){
        if (specialtyForm === specialty[tempSpec].title_specialty){
            idSpecialty = specialty[tempSpec].id;
        }
    }

    for (let tempFacult=0; tempFacult<faculty.length; tempFacult++){
        if (facultyForm === faculty[tempFacult].title_faculty){
            idFaculty = faculty[tempFacult].id;
        }
    }

    for (let tempTrain=0; tempTrain<training.length; tempTrain++){
        if (trainingForm === training[tempTrain].type_training){
            idTraining = training[tempTrain].id;
        }
    }
        console.log(trainingForm);
    pool.query("UPDATE graduate SET id_faculty=?, id_specialty=?, id_training=?, groupp=?, year=?  WHERE id_grad=?", [idFaculty, idSpecialty, idTraining, groupForm, yearForm, idGrad ], function(err, data) {
        if(err) return console.log(err);
        console.log("update done");
        console.log("id page", idGrad);
        res.redirect("/administrator");
    });
});

app.get("/graduateadd", function(req, res){
    /*let idGrad = idsess.idsession;
    if (idGrad === 5843) {
        res.render("graduateadd.hbs");
    }
    else {
        return res.redirect('/erroraccess');
    }*/
    res.render("graduateadd.hbs");
});

app.post("/formadd", urlencodedParser, function (req, res){
    let facultyForm = req.body.facultyForm;
    let trainingForm = req.body.trainingForm;
    let yearForm = req.body.yearForm;
    let specialtyForm = req.body.specialtyForm;
    let groupForm = req.body.groupForm;
    let lastnameForm = req.body.lastnameForm;
    let nameForm = req.body.nameForm;
    let patronymicForm = req.body.patronymicForm;
    let diplomaForm = req.body.diplomaForm;
    let fs = require('fs');
    let datadb = JSON.parse(fs.readFileSync('public/datadb.json', 'utf8'));

    let specialty = datadb.specialty;
    let faculty = datadb.faculty;
    let training = datadb.training;

    let idSpecialty;
    let idFaculty;
    let idTraining;
    let idUser=2;

    for (let tempSpec=0; tempSpec<specialty.length; tempSpec++){
        if (specialtyForm === specialty[tempSpec].title_specialty){
            idSpecialty = specialty[tempSpec].id;
        }
    }

    for (let tempFacult=0; tempFacult<faculty.length; tempFacult++){
        if (facultyForm === faculty[tempFacult].title_faculty){
            idFaculty = faculty[tempFacult].id;
        }
    }

    for (let tempTrain=0; tempTrain<training.length; tempTrain++){
        if (trainingForm === training[tempTrain].type_training){
            idTraining = training[tempTrain].id;
        }
    }

    if(!req.body) return res.sendStatus(400);
    let sql = "INSERT INTO graduate (id_specialty, id_faculty, id_user, id_training, groupp, year, diploma, name, lastname, patronymic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    pool.query(sql, [idSpecialty, idFaculty, idUser, idTraining, groupForm, yearForm, diplomaForm, nameForm, lastnameForm, patronymicForm], function (err, data) {
        if(err) return console.log(err);
    });
    console.log("успешная запись в бд");
    res.redirect("/administrator");
});

app.post("/addfile", urlencodedParser, upload.single('filedata'), function(req, res){

    let filedata = req.file;
    // запись из Excel в переменную
    var parser = new (require('simple-excel-to-json').XlsParser)();
    var doc = parser.parseXls2Json('public/picture/photoGraduate/'+filedata.filename);
    var data = doc[0];
    console.log("из количество файла", data.length);
    var fs = require('fs');
    var datadb = JSON.parse(fs.readFileSync('public/datadb.json', 'utf8'));

    let specialty = datadb.specialty;
    let faculty = datadb.faculty;
    let training = datadb.training;

    let idSpecialty;
    let idFaculty;
    let idUser;
    let idTraining;

    /*for (let i=0; i<=5180; i++){
        let sqluser = "INSERT INTO users (diploma_seria, diploma_number) VALUES (?, ?)";
        pool.query(sqluser, [data[i].diplomaseria, data[i].diplomanumber], function (err, data) {
            if(err) return console.log(err);


        });
    }
    */
            for (let i=0; i<=100; i++){
                //написать условия для определения id для записи
                for (let tempSpec=0; tempSpec<specialty.length; tempSpec++){
                    if (data[i].specialty === specialty[tempSpec].title_specialty){
                        idSpecialty = specialty[tempSpec].id;
                    }
                }

                for (let tempFacult=0; tempFacult<faculty.length; tempFacult++){
                    if (data[i].faculty === faculty[tempFacult].title_faculty){
                        idFaculty = faculty[tempFacult].id;
                    }
                }

                for (let tempTrain=0; tempTrain<training.length; tempTrain++){
                    if (data[i].training === training[tempTrain].type_training){
                        idTraining = training[tempTrain].id;
                    }
                }


                if(!req.body) return res.sendStatus(400);


                let sqlusers = "SELECT * FROM users";

                pool.query(sqlusers,  function(err, datausers) {
                    if(err) return console.log(err);
                    for (let j=0; j<=100; j++){
                    if (data[i].diplomanumber===datausers[j].diploma_number){
                        idUser=datausers[j].id;
                    }
                    }
                    let sql = "INSERT INTO graduate (id_specialty, id_faculty, id_user, id_training, groupp, year, name, lastname, patronymic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    pool.query(sql, [idSpecialty, idFaculty, idUser, idTraining, data[i].group, data[i].year, data[i].name, data[i].lastname, data[i].patronymic], function (err, data) {
                        if(err) return console.log(err);
                        console.log("запись выпускника номер: ", i);

                    });
                });




                idSpecialty=0;
                idFaculty=0;
                idTraining=0;
                idUser=0;

            }

    console.log("успешная запись в бд");
    res.redirect("/administrator");
});
/*let sqluser = "INSERT INTO users (diploma_seria, diploma_number) VALUES (?, ?)";
            pool.query(sqluser, [data[i].diplomaseria, data[i].diplomanumber], function (err, data) {
                if(err) return console.log(err);
            });

            let sql = "INSERT INTO graduate (id_specialty, id_faculty, id_user, id_training, groupp, year, name, lastname, patronymic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            pool.query(sql, [idSpecialty, idFaculty, idUser, idTraining, data[i].group, data[i].year, data[i].name, data[i].lastname, data[i].patronymic], function (err, data) {
                    if(err) return console.log(err);
            });*/

//роутинг стартовая страница
app.get("/", function(req, res){
    res.render("index.hbs");
});



// поиск выпускников по фио
app.post("/fioseach", urlencodedParser, function(req, res){
    if (!req.body) return res.sendStatus(400);
    let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and (graduate.lastname=? or graduate.name=?)";
    pool.query(sql, [req.body.fild_lastname_seach, req.body.fild_name_seach], function(err, data) {
        if(err) return console.log(err);
        let datalenght=0;
        while (datalenght<data.length){
            if (data[datalenght].avatarphoto===null){
                data[datalenght].avatarphoto="nophoto.png";

            }
            datalenght++;
        }
        res.render("index.hbs", {
            graduate: data
        });
    });

        /*if (req.body.fild_lastname_seach!=='' && req.body.fild_name_seach===''){
            let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.lastname=?";
            pool.query(sql, [req.body.fild_lastname_seach], function(err, data) {
                if(err) return console.log(err);
                let datalenght=0;
                while (datalenght<data.length){
                    if (data[datalenght].avatarphoto===null){
                        data[datalenght].avatarphoto="nophoto.png";

                    }
                    datalenght++;
                }
                res.render("index.hbs", {
                    graduate: data
                });
            });
        }

        else if (req.body.fild_lastname_seach==='' && req.body.fild_name_seach!==''){
            let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.name=?";
            pool.query(sql, [req.body.fild_name_seach], function(err, data) {
                if(err) return console.log(err);
                let datalenght=0;
                while (datalenght<data.length){
                    if (data[datalenght].avatarphoto===null){
                        data[datalenght].avatarphoto="nophoto.png";

                    }
                    datalenght++;
                }
                res.render("index.hbs", {
                    graduate: data
                });
            });
        }

        else if (req.body.fild_lastname_seach!=='' && req.body.fild_name_seach!==''){
            let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and graduate.lastname=? and graduate.name=?";
            pool.query(sql, [req.body.fild_lastname_seach, req.body.fild_name_seach], function(err, data) {
                if(err) return console.log(err);
                let datalenght=0;
                while (datalenght<data.length){
                    if (data[datalenght].avatarphoto===null){
                        data[datalenght].avatarphoto="nophoto.png";

                    }
                    datalenght++;
                }
                res.render("index.hbs", {
                    graduate: data
                });
            });
        }*/
    //res.render("index.hbs");
});
//поиск выпускников по форме
app.post("/formseach", urlencodedParser, function(req, res){
    if (!req.body) return res.sendStatus(400);
    /* поиск оп форме справа */
    if (req.body.facultyForm!==undefined && (req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.trainingForm===undefined && req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=?";
        pool.query(sql, [req.body.facultyForm], function(err, data) {
            if(err) return console.log(err);
            console.log("data.length: ", data.length);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.trainingForm!==undefined && (req.body.facultyForm===undefined && req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  training.type_training=?";
        pool.query(sql, [req.body.trainingForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.yearForm!=='' && (req.body.facultyForm===undefined && req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.trainingForm===undefined)){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  graduate.year=?";
        pool.query(sql, [req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if ((req.body.facultyForm!==undefined && req.body.trainingForm!==undefined) && (req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and  training.type_training=?";
        pool.query(sql, [req.body.facultyForm, req.body.trainingForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if ((req.body.facultyForm!==undefined && req.body.yearForm!=='') && (req.body.specialtyForm===undefined && req.body.groupForm==='' && req.body.trainingForm===undefined)){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and  graduate.year=?";
        pool.query(sql, [req.body.facultyForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if ((req.body.trainingForm!==undefined && req.body.yearForm!=='') && (req.body.facultyForm===undefined && req.body.specialtyForm===undefined && req.body.groupForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and training.type_training=? and  graduate.year=?";
        pool.query(sql, [req.body.trainingForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if ((req.body.facultyForm!==undefined && req.body.trainingForm!==undefined && req.body.yearForm!=='') && (req.body.specialtyForm===undefined && req.body.groupForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and  training.type_training=? and  graduate.year=?";
        pool.query(sql, [req.body.facultyForm, req.body.trainingForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.specialtyForm!==undefined && (req.body.facultyForm===undefined || req.body.groupForm==='' || req.body.trainingForm===undefined || req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  specialty.title_specialty=?";
        pool.query(sql, [req.body.specialtyForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else if (req.body.groupForm!=='' && (req.body.facultyForm===undefined || req.body.specialtyForm===undefined || req.body.trainingForm===undefined || req.body.yearForm==='')){
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  graduate.groupp=?";
        pool.query(sql, [req.body.groupForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
    else {
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=? and specialty.title_specialty=? and graduate.groupp=? and training.type_training=? and graduate.year=?";
        pool.query(sql, [req.body.facultyForm, req.body.specialtyForm, req.body.groupForm, req.body.trainingForm, req.body.yearForm], function(err, data) {
            if(err) return console.log(err);
            let datalenght=0;
            while (datalenght<data.length){
                if (data[datalenght].avatarphoto===null){
                    data[datalenght].avatarphoto="nophoto.png";

                }
                datalenght++;
            }
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


/*app.post("/formseach", urlencodedParser, function(req, res) {
    if (!req.body) return res.sendStatus(400);
    if (req.body.facultyForm !== undefined && (req.body.specialtyForm === undefined && req.body.groupForm === '' && req.body.trainingForm === undefined && req.body.yearForm === '')) {
        let sql = "SELECT * FROM graduate, faculty, specialty, training  where graduate.id_faculty=faculty.id and graduate.id_specialty=specialty.id and graduate.id_training=training.id and  faculty.title_faculty=?";
        pool.query(sql, [req.body.facultyForm], function (err, data) {
            if (err) return console.log(err);
            res.render("index.hbs", {
                graduate: data
            });
        });
    }
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











