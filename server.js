require('dotenv').config();
// Server is started in its own file for testing purposes
const app = require('./src/app.js');

const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
    console.log('Server is listening');
});