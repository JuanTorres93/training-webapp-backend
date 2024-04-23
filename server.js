require('dotenv').config();
// Server is started in its own file for testing purposes
const createApp = require('./src/app.js');

// this false parameter (appIsBeingTested = false) means that it uses real db
const app = createApp(false);
const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
    console.log('Server is listening');
});
