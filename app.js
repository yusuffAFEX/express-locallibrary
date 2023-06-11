require('dotenv').config()
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// const compression = require('compression')
const helmet = require('helmet')
const rate_limit = require('express-rate-limit')
const cors = require('cors')
const xss = require('xss-clean')

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require("./routes/catalog"); //Import routes for "catalog" area of site

const app = express();

// Set up mongoose connection
const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
// comment
const mongoDB = process.env.MONGO_URI

main().catch((err) => console.log(err))
async function main() {
  await mongoose.connect(mongoDB)
}


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// extra packages
app.use(
    helmet.contentSecurityPolicy({
      directives: {
        "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
      },
    })
)
app.use(cors())
app.use(xss())
// app.use(compression)

const limiter = rate_limit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});

app.use(limiter)

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain.

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
