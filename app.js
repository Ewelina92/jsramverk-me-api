const express = require("express"); // web framework for Node.js
const cors = require('cors'); // for others to access info from my api
const morgan = require('morgan'); // for logging
const passport = require('passport');
const { graphqlHTTP } = require('express-graphql');
const documents = require('./routes/documents');
const permissions = require('./routes/permissions');
const auth = require('./routes/auth');
const pdf = require('./routes/pdf');
const schema = require('./schema');
const { rootValue } = require('./resolvers');

require('./auth/auth');

const app = express();
// const port = process.env.PORT || 1337;

app.use(cors());

// enable reading req.body from PUT and POST requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// don't show the log when it is test
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

// login and register
app.use('/', auth);
app.use('/pdf', pdf);
// protected document routes
app.use('/permissions', passport.authenticate('jwt', { session: false }), permissions);
app.use('/documents', passport.authenticate('jwt', { session: false }), documents);
app.use('/graphql',
    passport.authenticate('jwt', { session: false }),
    graphqlHTTP({ schema, rootValue })
);

// Add routes for 404 and error handling
// Catch 404 and forward to error handler
// Put this last
app.use((req, res, next) => {
    var err = new Error("Not Found");

    err.status = 404;
    next(err);
});

// custom made error-handling
/* istanbul ignore next */
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        "errors": [
            {
                "status": err.status,
                "title":  err.message,
                "detail": err.message
            }
        ]
    });
});

// Start up server
// app.listen(port, () => console.log(`Example API listening on port ${port}!`));

module.exports = app;
