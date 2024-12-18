const { query } = require('./index');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'subscriptions';
const SELECT_SUSCRIPTION_FIELDS = 'id, type, description, base_price_in_eur_cents';

// TODO DRY, it is the same as in users.js
const checkStringInFieldInUse = async (field, value) => {
    const q = "SELECT " + field +
        " FROM " + TABLE_NAME + " WHERE LOWER(" + field + ") = LOWER($1);";
    const params = [value];

    // Must return a promise to be able to await when calling from another file
    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject({
                error,
                exists: null,
            });

            if (results !== undefined && results.rows.length > 0) {
                resolve(true);
            } else {
                reject({
                    error: null,
                    exists: false,
                });
            }
        });
    });
};

const checkTypeInUse = async (type) => {
    try {
        // checkStringInFieldInUse only resolves to true
        const exists = await checkStringInFieldInUse('type', type);

        return exists
    } catch (error) {
        if (error.error !== null) throw error;

        return false;
    }
};

const addSubscription = async ({
    type,
    description,
    basePriceInEurCents,
}) => {

    const typeInUse = await checkTypeInUse(type);
    if (typeInUse) {
        return new Promise((resolve, reject) => {
            reject({
                error: 'Type already in use',
                subscription: null,
            });
        });
    }

    // Build query
    let requiredFields = ['type', 'description', 'base_price_in_eur_cents'];
    let requiredValues = [type, description, basePriceInEurCents];

    let optionalFields = [];
    let optionalValues = [];

    let returningFields = ['id', 'type', 'description', 'base_price_in_eur_cents']

    const { q, params } = qh.createInsertIntoTableStatement(TABLE_NAME,
        requiredFields, requiredValues,
        optionalFields, optionalValues,
        returningFields);

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const createdSubscriptionType = results.rows[0];
            resolve(createdSubscriptionType)
        })
    });
}

const selectAllSubscriptions = () => {
    const q = "SELECT " + SELECT_SUSCRIPTION_FIELDS + " FROM " + TABLE_NAME + ";";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const suscriptions = results.rows;

            resolve(suscriptions)
        })
    });
};

const selectSuscriptionById = async (id) => {
    const q = "SELECT " + SELECT_SUSCRIPTION_FIELDS + " FROM " +
        TABLE_NAME + " WHERE id = $1;";
    const params = [id];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const suscription = results.rows[0];
            resolve(suscription)
        })
    });
};

const selectSuscriptionByType = async (type) => {
    const q = "SELECT " + SELECT_SUSCRIPTION_FIELDS + " FROM " +
        TABLE_NAME + " WHERE type = $1;";
    const params = [type];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const suscription = results.rows[0];
            resolve(suscription)
        })
    });
};

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
    checkStringInFieldInUse,
    checkTypeInUse,
    addSubscription,
    selectAllSubscriptions,
    selectSuscriptionById,
    selectSuscriptionByType,
    truncateTableTest,
};