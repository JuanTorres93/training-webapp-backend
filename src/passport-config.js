// DOC: passport unofficial docs: https://github.com/jwalton/passport-api-docs
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { query } = require('./db/index');
const hashing = require('./hashing');
const dbUser = require('./db/users');

const localStrategy = new LocalStrategy(
    (username, password, done) => {
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

        query(q, params, async (error, results) => {
            if (error) return done(error);

            const userObject = results.rows[0];

            if (!userObject) return done(null, false);


            if (userObject) {
                const email = userObject.email;
                const userWasCreatedWithOAuth = await dbUser.selectUserRegisteredByOAuth(email);

                if (userWasCreatedWithOAuth) {
                    return done(error, false, { msg: 'User registered via other platform' });
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
        })
    })

const googleStrategy = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/login/google/callback',
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;

        const user = await dbUser.selectUserByEmail(email);

        if (user) {
            const userWasCreatedWithOAuth = await dbUser.selectUserRegisteredByOAuth(email);
            if (userWasCreatedWithOAuth) {
                return done(null, user);
            } else {
                return done(null, false, { msg: 'Email already in use' });
            }
        }

        // I think this is not needed
        const emailInUse = await dbUser.checkEmailInUse(email);

        if (emailInUse) {
            return done(null, false, { msg: 'Email already in use' });
        }

        // If user does not exist, create it
        if (!user) {
            const alias = profile.displayName || 'Unknown Google User';
            const plainPassword = profile.id + process.env.GOOGLE_CLIENT_SECRET;
            const password = await hashing.plainTextHash(plainPassword)

            const newUser = await dbUser.registerNewUser({
                alias,
                email,
                password,
                registeredViaOAuth: true,
            });

            return done(null, newUser);
        }
    } catch (error) {
        return done(error, false);
    }
});

const serializeUser = (req, user, done) => {
    // When serializing a user, Passport takes that user id and stores it 
    // internally on req.session.passport which is Passport’s internal 
    // mechanism to keep track of things.

    const serializeData = {
        id: user.id,
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
    });
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
