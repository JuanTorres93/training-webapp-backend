// DOC: passport unofficial docs: https://github.com/jwalton/passport-api-docs
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { query } = require('./db/index');
const hashing = require('./hashing');
const dbUser = require('./db/users');

const localStrategy = new LocalStrategy(
    { passReqToCallback: true }, // Send request to callback to be able to access req.appIsBeingTested
    (req, username, password, done) => {
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

        // Everything is selected in order for query to return a standar JS object and not
        // a weird one in the shape of: { row: '(76,testUser,test@uuuser.com,,,)' }
        // In addition, password is needed to be retrieved from db in order to compare it
        // with the one submitted by the user.
        const q = "SELECT * FROM users WHERE alias = $1;";
        const params = [username];

        // TODO DEBUGGAR TODO ESTE MIDDLEWARE
        query(q, params, async (error, results) => {
            if (error) return done(error);

            const userObject = results.rows[0];

            // TODO check this condition when debugging and no user is expected
            if (!userObject) return done(null, false);


            if (userObject) {
                const email = userObject.email;
                const userWasCreatedWithOAuth = await dbUser.selectUserRegisteredByOAuth(email, false); // TODO WARNING false means app is not being tested

                if (userWasCreatedWithOAuth) {
                    const error = new Error('User registered via other platform');
                    return done(error, null);
                }
            }

            // If passwords do not match, then return no user.
            // trim is included because I detected that my specific database
            // was including some extra whitespaces at the end, leading to never
            // be able to log in the user.
            if (!(await hashing.comparePlainTextToHash(password, userObject.password.trim()))) return done(null, false);

            // Actual user info to be send
            // TODO IMPORTANT SECURITY. I DON'T KNOW WHAT THIS DOES. I THOUGHT THIS TO BE
            // THE RETURN VALUE WHEN LOGGING, BUT WHEN TESTING IT SEEMS TO BE THE VALUE
            // RETURNED BY deserializUser function
            const user = {
                id: userObject.id,
                alias: userObject.alias,
                email: userObject.email,
                last_name: userObject.last_name,
                second_last_name: userObject.second_last_name,
                img: userObject.img,
            };

            return done(null, user);
        }, req.appIsBeingTested)
    })

const googleStrategy = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/login/google/callback',
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;

        const user = await dbUser.selectUserByEmail(email, false); // TODO WARNING false means app is not being tested

        if (user) {
            const userWasCreatedWithOAuth = await dbUser.selectUserRegisteredByOAuth(email, false); // TODO WARNING false means app is not being tested
            if (userWasCreatedWithOAuth) {
                return done(null, user);
            } else {
                const error = new Error('Email already in use');
                return done(error, null);
            }
        }

        // I think this is not needed
        const emailInUse = await dbUser.checkEmailInUse(email, false); // TODO WARNING false means app is not being tested
        if (emailInUse) {
            const error = new Error('Email already in use');
            return done(error, null);
        }

        // If user does not exist, create it
        if (!user) {
            const alias = profile.displayName || 'Unknown Google User';
            const plainPassword = profile.id + process.env.GOOGLE_CLIENT_SECRET;
            const password = await hashing.plainTextHash(plainPassword)

            const newUser = dbUser.registerNewUser({
                alias,
                email,
                password,
                registeredViaOAuth: true,
            }, false); // TODO WARNING false means app is not being tested

            return done(null, newUser);
        }
    } catch (error) {
        return done(error);
    }
});

const serializeUser = (req, user, done) => {
    // When serializing a user, Passport takes that user id and stores it 
    // internally on req.session.passport which is Passport’s internal 
    // mechanism to keep track of things.

    const serializeData = {
        id: user.id,
        appIsBeingTested: req.appIsBeingTested,
    };

    done(null, serializeData);
}

const deserializeUser = (serializedData, done) => {
    const q = "SELECT * FROM users WHERE id = $1;";
    const params = [serializedData.id]

    query(q, params, (error, results) => {
        if (error) return done(error);

        const userObject = results.rows[0];

        const user = {
            id: userObject.id,
            alias: userObject.alias,
            email: userObject.email,
            last_name: userObject.last_name,
            second_last_name: userObject.second_last_name,
            img: userObject.img,
        };

        return done(null, user);
    }, serializedData.appIsBeingTested);
}

// ===== Use defined strategies =====
// local strategy for passport
passport.use(localStrategy);
// google strategy for passport
passport.use(googleStrategy);

// The serializeUser() function sets an id as the cookie in the user’s browser, 
// and the deserializeUser() function uses the id to look up the user in the 
// database and retrieve the user object with data. 
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

module.exports = passport;
