require('dotenv').config();
const createApp = require('./src/app.js');
const createCommonUser = require('./src/createCommonUser.js').createCommonUser;

const app = createApp();
const PORT = process.env.SERVER_PORT;
app.listen(PORT, async () => {
    console.log('Server is listening');

    // TODO DELETE WHEN REFACTORING DEMANDS IT
    await createCommonUser(`http://localhost:${process.env.SERVER_PORT}`);
});