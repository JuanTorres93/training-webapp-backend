// Server is started in its own file for testing purposes
const app = require('./src/app.js');

const PORT = process.env.PORT || 54321;

app.listen(PORT, () => {
    console.log('Listening');
});