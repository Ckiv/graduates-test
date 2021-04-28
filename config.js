const passport = require('passport'); // Подключаем непонятную ересь
const LocalStrategy = require('passport-local').Strategy; // Применяем стратегию(В нашем случае username & password) можете почитать в документации на passportjs.org
const mysql = require('mysql');
//Подключаемся к базе данных
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_graduates',
    port: 3306

});

//Назначаем id сессии
passport.serializeUser(function(user, done) {
    console.log("Serialize: ", user[0].id);
    done(null, user[0].id);
});
//Получаем id пользователя
passport.deserializeUser(function(id, done) {
    //Строим запрос в базу данных(ищем id пользователя,полученного из стратегии)
    connection.query("SELECT * FROM graduate  WHERE id_user='"+id+"'",function(err,res){
        console.log("id config: ",id);
        exports.idsession = res[0].id_grad;
        console.log("idsession: ", res[0].id_grad);
        done(null, id);
    });

});

//Заменяем стандартный атрибут username usernameField: 'email'
//Получаем данные переданные методом POST из формы email/password
//Параметр done работает на подобии return он возвращает пользователя или false в зависимости прошел ли пользователь аутентификацию
passport.use(new LocalStrategy({	usernameField: 'diploma_seria', passwordField: 'diploma_number'	},
    function(diploma_seria, diploma_number, done) {
        //Строим запрос в базу данных, ищем пользователя по email переданному из формы в стратегию
        connection.query("SELECT * FROM users WHERE diploma_seria='"+diploma_seria+"' and diploma_number='"+diploma_number+"'",	function(err,res){
            //Если количество результатов запроса(пользователей с таким email) меньше 1,выводим в консоль что он не существует
            //console.log("res", res);
            if (res<1) {
                console.log('User not found');
                return done(null,false);
            }
            //Иначе передаем выводим найденый email в консоль и передаем пользователя функцией done в сессию
            else {

                console.log('User found', res[0].diploma_seria, 'id user= ', res[0].id);
                return done(null,res);

            }

        });
    }
));

/*connection.connect(function(err){
    if (err) {
        return console.error("Ошибка: " + err.message);
    }
    else{
        console.log("Подключение к серверу MySQL успешно установлено");
    }
});*/

