require('dotenv').config();
const createApp = require('./src/app.js');
const createCommonUser = require('./src/createCommonUser.js').createCommonUser;

// this false parameter (appIsBeingTested = false) means that it uses real db
const APP_IS_BEING_TESTED = false;
const app = createApp(APP_IS_BEING_TESTED);
const PORT = process.env.SERVER_PORT;

app.listen(PORT, async () => {
    console.log('Server is listening');

    await createCommonUser(`http://localhost:${process.env.SERVER_PORT}`, APP_IS_BEING_TESTED);
});