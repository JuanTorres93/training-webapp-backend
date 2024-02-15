require('dotenv').config();
// Server is started in its own file for testing purposes
const createApp = require('./src/app.js');

const app = createApp();
const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
    console.log('Server is listening');
});