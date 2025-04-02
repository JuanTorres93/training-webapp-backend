const fs = require("fs");
const path = require("path");

// Regular imports
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const cors = require("cors");
const morgan = require("morgan");
const passport = require("./passport-config.js");
const rateLimit = require("express-rate-limit");

// My modules imports
const paymentController = require("./controllers/paymentController.js");
const { getPool, getPoolClient } = require("./db/index.js");
const config = require("./config.js");

// Function to create the express app. Its main use is for testing
const createApp = () => {
  const appIsBeingTested = process.env.NODE_ENV === "test";
  // Create server and enable body parser in order not to import it
  // in every router
  const app = express();

  app.post(
    "/webhook-checkout",
    // Parse the body
    express.raw({ type: "application/json" }),
    paymentController.webhookCheckout
  );

  // Parse HTTP request body to JSON
  app.use(express.json());

  // Routers imports
  const usersRouter = require("./endpoints/users/users.js");
  const exercisesRouter = require("./endpoints/exercises/exercises.js");
  const workoutsRouter = require("./endpoints/workouts/workouts.js");
  const workoutsTemplatesRouter = require("./endpoints/workouts.templates/workoutsTemplates.js");
  const weightsRouter = require("./endpoints/weights/weights.js");
  const loginRouter = require("./endpoints/login/login.js");
  const logoutRouter = require("./endpoints/logout.js");
  const subscriptionsRouter = require("./endpoints/subscriptions/subscriptions.js");
  const paymentsRouter = require("./endpoints/payments/payments.js");

  // Enable request logs
  if (!appIsBeingTested) app.use(morgan("short"));

  // CORS configuration
  const corsOptions = {
    origin: [process.env.CLIENT_URL],
    credentials: true, // Required for cookies, authorization headers with HTTPS
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  if (process.env.DB_HOST === "db-test-for-frontend") {
    // This allows the connection with jsdom in jest
    // Otherwise, there is a CORS error despite the fact
    // that the origin is well set
    corsOptions.origin = "*";
  }

  app.use(cors(corsOptions));

  // Rate limiter. IMPORTANT TO BE AFTER CORS configuration
  // Add rate limiter only if the app is not being tested
  if (!appIsBeingTested) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      // TODO DELETE BELOW AND UNCOMMENT ABOVE
      // windowMs: 1 * 60 * 1000, // 15 minutes
      max: 200, // limit each IP to 100 requests per windowMs
      // TODO DELETE BELOW AND UNCOMMENT ABOVE
      // max: 2, // limit each IP to 100 requests per windowMs
      message: "Too many requests, please try again later.",
    });

    // Add limiter if NO testing the frontend
    if (process.env.DB_HOST !== "db-test-for-frontend") {
      app.use(limiter);
    }
  }

  // =================
  // Configure session
  // =================

  // IMPORTANT! Storing in-memory sessions is something that should be done only during
  // development, NOT during production due to security risks.
  let store;

  if (appIsBeingTested) {
    // DOCS This line can be uncommented for development purposes, but it should be changed in production
    store = new session.MemoryStore();
  } else {
    // DOCS This line can be uncommented for development purposes, but it should be changed in production
    // store = new session.MemoryStore();
    // DOCS change store method. Can be founď here: https://www.npmjs.com/package/express-session
    store = new pgSession({
      pool: getPool(),
      tableName: "user_sessions",
      createTableIfMissing: true,
    });
  }

  // Cookie for the browser to be able to send session ID back to the server
  const cookie = {
    maxAge: config.MAX_COOKIE_AGE_MILLISECONDS, // milliseconds until cookie expires
    // Secure only in production
    secure: process.env.NODE_ENV === "production", // It's only sent to the server via HTTPS
    // Same site only in production
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Allow cross-site cookie through different browsers
    httpOnly: true, // Specifies whether or not the cookies should be accessible via
    // JavaScript in the browser (Document.cookie). This setting is set
    // to true, because it ensures that any cross-site scripting attack (XSS) is impossible
    // Other properties can be 'expires' or 'httpOnly', amongst others
  };

  app.use(
    session({
      // secret is used as a key for signing and/or encrypting cookies
      // to protect the session ID. Should be a random string NOT INCLUDED in code,
      // but in an ENVIRONMENT VARIABLE
      secret: process.env.EXPRESS_SESSION_SECRET,
      // Setting resave to true will force a session to be saved back to
      // the session data store, even when no data was modified. Typically,
      // this option should be false, but also depends on your session storage strategy.
      resave: false,
      // If saveUnititialized is set to true, the server
      // will store every new session, even if there are no changes to the
      // session object. This might be useful if we want to keep track of
      // recurring visits from the same browser, but overall, setting this
      // property to false allows us to save memory space.
      saveUninitialized: false,
      cookie,
      store,
    })
  );

  // =====================================
  // Configure passport for authentication
  // =====================================

  // Initialization
  app.use(passport.initialize());
  // Allow persistent logins
  // The session() middleware alters the request object and is able to
  // attach a ‘user’ value that can be retrieved from the session id.
  app.use(passport.session());

  // =======================
  // Mount endpoints routers
  // =======================

  // Mount users endpoint
  app.use("/users", usersRouter);
  // Mount exercises endpoint
  app.use("/exercises", exercisesRouter);
  // Mount workouts templates endpoint
  app.use("/workouts/templates", workoutsTemplatesRouter);
  // Mount workouts endpoint
  app.use("/workouts", workoutsRouter);
  // Mount weights endpoint
  app.use("/weights", weightsRouter);
  // Mount login endpoint
  app.use("/login", loginRouter);
  // Mount logout endpoint
  app.use("/logout", logoutRouter);
  // Mount subscriptions endpoint
  app.use("/subscriptions", subscriptionsRouter);
  // Mount payments endpoint
  app.use("/payments", paymentsRouter);

  // =======================
  // Cron jobs
  // =======================

  // Run this query every 2 days
  // Delete workouts that have no exercises and are at least 1 day old
  setInterval(async () => {
    // Read the SQL file
    const sqlFilePath = path.join(
      __dirname,
      "db",
      "queries",
      "removeEmptyWorkouts.sql"
    );
    const sqlFileContent = fs.readFileSync(sqlFilePath, "utf8");

    // Split the file content into separate queries
    const [deleteFromUsersWorkoutsQuery, deleteFromWorkoutsQuery] =
      sqlFileContent
        .split(";")
        .map((query) => query.trim())
        .filter((query) => query.length > 0);

    try {
      const client = await getPoolClient(); // Get a client from the pool
      try {
        await client.query("BEGIN"); // Start transaction

        const resultsWorkoutsIds = await client.query(
          deleteFromUsersWorkoutsQuery,
          []
        ); // Execute query within transaction
        const workoutsIds = resultsWorkoutsIds.rows.map(
          (row) => row.workout_id
        );

        for (const workoutId of workoutsIds) {
          await client.query(deleteFromWorkoutsQuery, [workoutId]);
        }

        await client.query("COMMIT"); // Commit transaction

        console.log("Periodic query executed: remove empty workouts");
      } catch (error) {
        await client.query("ROLLBACK"); // Rollback transaction on error
        throw error;
      } finally {
        client.release(); // Release client back to the pool
      }
    } catch (err) {
      console.error("Error executing query:", err);
    }
  }, 2 * 24 * 60 * 60 * 5000); // Interval set to 2 days in milliseconds

  return app;
};

// Export server instead of starting it for being able to perform tests
module.exports = createApp;
