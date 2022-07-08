const express = require("express")
const app = express()
const mongoose = require('mongoose')
const dotenv = require('dotenv');
dotenv.config();
const session = require('express-session');

const adminRoute = require('./api/routes/admin')
const userRoute = require('./api/routes/user')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

mongoose.connect('mongodb+srv://eventsmhssp:' + process.env.MONGO_ATLAS_PW + '@cluster0.tnuqc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true
})

app.use(express.static(__dirname + '/views/assets'))

app.set('view engine', 'ejs');

app.use('/admin', adminRoute)
app.use('/', userRoute)

app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use('/fonts', express.static(__dirname + 'public/fonts'))
app.use('/assets', express.static(__dirname + 'public/assets'))
app.use('/uploads', express.static(__dirname + 'public/uploads'))

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error)
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    console.log(error)
    res.json({
        error: {
            message: error.message
        }
    })
})

module.exports = app;