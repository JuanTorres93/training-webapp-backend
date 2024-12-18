require('dotenv').config();

const fs = require('fs');
const path = require('path');

const createApp = require('./src/app.js');
const createCommonUser = require('./src/createCommonUser.js').createCommonUser;
const { query } = require('./src/db/index.js');

const app = createApp();
const PORT = process.env.SERVER_PORT;

// Read insertSubscriptions.sql and insert the subscriptions in the database
const insertSubscriptionsFilePath = path.join(__dirname, 'insertSubscriptions.sql');
const insertSubscriptionsSql = fs.readFileSync(insertSubscriptionsFilePath).toString();


app.listen(PORT, async () => {
    console.log('Server is listening');

    // Initialize subscription types
    query(insertSubscriptionsSql, [], (error, results) => {
        if (error) {
            console.error('Error inserting subscriptions');
            console.error(error);
            process.exit(1);
        }

        console.log('Subscriptions inserted');
    });

    // TODO DELETED WHEN REFACTORING DEMANDS IT
    await createCommonUser(`http://localhost:${process.env.SERVER_PORT}`);
});