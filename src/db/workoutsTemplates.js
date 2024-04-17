const { query, getPoolClient } = require('./index');
const utils = require('../utils/utils.js');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'workout_template';

const createWorkoutTemplate = ({ userId, alias, description }, appIsBeingTested = undefined) => {
    // Build query
    let requiredFields = ['user_id', 'alias'];
    let requiredValues = [userId, alias];

    let optionalFields = ['description'];
    let optionalValues = [description];

    let returningFields = ['id', 'user_id', 'alias', 'description'];

    const { q, params } = qh.createInsertIntoTableStatement(TABLE_NAME, 
                                                           requiredFields, requiredValues,
                                                           optionalFields, optionalValues,
                                                           returningFields);

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const createdWorkoutTemplate = results.rows[0];
            const specWorkoutTemplate = {
                ...createdWorkoutTemplate,
                userId: createdWorkoutTemplate.user_id,
            };

            delete specWorkoutTemplate.user_id

            resolve(specWorkoutTemplate)
        }, appIsBeingTested)
    });
}

const truncateTableTest = (appIsBeingTested) => {
    if (appIsBeingTested) {
        return new Promise((resolve, reject) => {
            // Test for making malicious people think they got something
            resolve('Truncated ' + TABLE_NAME);
        });
    }

    const q = "TRUNCATE " + TABLE_NAME + " CASCADE;";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            resolve('Table ' + TABLE_NAME + ' truncated in test db.')
        }, true)
    });
};

module.exports = {
    createWorkoutTemplate,
    truncateTableTest,
};
