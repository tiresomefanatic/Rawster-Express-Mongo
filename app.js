const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const bodyParser = require("body-parser");

//const tourRouter = require('./routes/tourRoutes');
const userRoute = require('./routes/userRoute');
const teamRoute = require('./routes/teamRoute');
const matchRoute = require('./routes/matchRoute');


const globalErrorHandler = require('./controllers/errorController');

const app = express();

// 1) MIDDLEWARES

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body

app.use(bodyParser.json());

// app.use(express.json({
//     limit: '10kb'
// }));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(express.json());
//app.use(express.static(`${__dirname}/public`));



app.use((req, res, next) => {
    ('Hello from the middleware 👋');
    next();
});



app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

//3) ROUTES

app.use('/api/v1/user', userRoute);
app.use('/api/v1/team', teamRoute);
app.use('/api/v1/match', matchRoute);



app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

//app.use('/api/v1/tours', tourRouter);
//app.use('/api/v1/users', userRouter);

module.exports = app;