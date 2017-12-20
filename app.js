/**
 * Created by jason on 2017/12/20.
 */
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const router = require("./router");


const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cookieParser());




app.use("/web", express.static(path.join(__dirname, './web')));

app.get("/",function (req,res) {
    res.redirect("/web/html/index.html");
});

app.use("/",router);


app.listen(8080,function (err) {
    if(err){
        console.log(err);
    }else{
        console.log("Server is running at port 8080");
    }
});
