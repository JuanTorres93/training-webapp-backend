// DOC: passport unofficial docs: https://github.com/jwalton/passport-api-docs
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const query = require('./db/index').query;
const hashing = require('./hashing');

const localStrategy = new LocalStrategy((username, password, done) => {
    // username and password are the credentials sent in the body of a POST request
    // done is a callback function whose purpose is to supply an authenticated user to 
    // Passport if a user is authenticated. The logic within the anonymous function follows 
    // this order:
    // 1. Verify login details in the callback function.
    // 2. If login details are valid, the done callback function is
    //    invoked (see arguments below) and the user is authenticated.
    // 3. If the user is not authenticated, pass false into the 
    //    callback function (see arguments below).
    //
    // The done callback function takes in two arguments:
    // 1. An error or null if no error is found.
    // 2. A user or false if no user is found.

    // NOTE: In this specific application username is the email due to the db
    // implementation. I've decided to leave it as username for future reference purposes
    const q = "SELECT * FROM customers WHERE email = $1;";
    const params = [username]   // Read note above for username

    // TODO DEBUGGAR TODO ESTE MIDDLEWARE
    query(q, params, async (error, results) => {
        if (error) return done(error);

        const userObject = results.rows[0];

        // TODO check this condition when debugging and no user is expected
        if (!userObject) return done(null, false);

        // If passwords do not match, then return no user.
        // trim is included because I detected that my specific database
        // was including some extra whitespaces at the end, leading to never
        // be able to log in the user.
        if (!(await hashing.comparePlainTextToHash(password, userObject.password.trim()))) return done(null, false);

        const user = {
            id: userObject.id,
            first_name: userObject.first_name,
            last_name: userObject.last_name,
            second_last_name: userObject.second_last_name,
            email: userObject.email,
        };

        return done(null, user);
    })
})

// const googleStrategy = new GoogleStrategy({
//     // TODO configurar los valores en google y ponerlos en .env
//     clientID: process.env.GOOGLE_API,
//     clientSecret: process.env.GOOGLE_SECRET,
//     callbackURL: 'http://localhost:54321/login/google/callback',
//     scope: ['email'],
// }, (accessToken, refreshToken, profile, done) => {
//     // TODO Adaptar a mi base de datos y seleccionar y/o crear nuevo usuario
//     // User.findOrCreate({ googleId: profile.id }, (err, user) => {
//         // return done(err, user);
//     // });
// 
//     // TODO UPDATE. THIS IS REALLY BASIC
//     return done(null, profile);
// });

const serializeUser = (user, done) => {
    // TODO research about what exactly this function does
    // When serializing a user, Passport takes that user id and stores it 
    // internally on req.session.passport which is Passport’s internal 
    // mechanism to keep track of things.
    done(null, user.id);
}

const deserializeUser = (id, done) => {
    // TODO research about what exactly this function does
    const q = "SELECT * FROM customers WHERE id = $1;";
    const params = [id]

    query(q, params, (error, results) => {
        if (error) return done(error);

        const user = results.rows[0];

        return done(null, user);
    })
}

// local strategy for passport
passport.use(localStrategy);
// google strategy for passport
// passport.use(googleStrategy);

// The serializeUser() function sets an id as the cookie in the user’s browser, 
// and the deserializeUser() function uses the id to look up the user in the 
// database and retrieve the user object with data. 
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

module.exports = passport;
