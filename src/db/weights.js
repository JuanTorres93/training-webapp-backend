const { query } = require('./index');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'weights';
const SELECT_WEIGHT_FIELDS = 'date, user_id, value';


const selectAllWeightsForUser = (userId) => {
    const q = "SELECT " + SELECT_WEIGHT_FIELDS + " FROM " + TABLE_NAME +
        " WHERE user_id = $1" +
        " ORDER BY date ASC;";
    const params = [userId];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const users = results.rows;
            resolve(users)
        })
    });
};

const addNewWeight = async (userId, weightObject) => {
    // weightObject should have date, and value

    const { date, value } = weightObject;
    const requiredFields = ['user_id', 'date', 'value'];
    const requiredValues = [userId, date, value];
    const returningFields = ['date', 'user_id', 'value'];


    const { q, params } = qh.createInsertIntoTableStatement(TABLE_NAME,
        requiredFields, requiredValues,
        [], [],
        returningFields)

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const newWeight = results.rows[0];
            resolve(newWeight)
        })
    });
}

const weightExists = async (userId, date) => {
    // format date to yyyy-mm-dd
    const formatteDate = new Date(date).toISOString().split('T')[0];

    const q = `
        SELECT * FROM ${TABLE_NAME} 
        WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM-DD') = $2;
    `;
    const params = [userId, formatteDate];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const weightExists = results.rows[0];
            resolve(weightExists)
        })
    });
}

const truncateTableTest = () => {
    const appIsBeingTested = process.env.NODE_ENV === 'test';

    // Only allow truncating table in test environment
    if (!appIsBeingTested) {
        return new Promise((resolve, reject) => {
            // Test for making malicious people think they got something
            resolve('Truncated ' + TABLE_NAME);
        });
    }

    const q = "TRUNCATE " + TABLE_NAME + " CASCADE;";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) {
                reject(error)
            };


            resolve('Table ' + TABLE_NAME + ' truncated in test db.')
        }, true)
    });
};


module.exports = {
    addNewWeight,
    weightExists,
    selectAllWeightsForUser,
    truncateTableTest,
};