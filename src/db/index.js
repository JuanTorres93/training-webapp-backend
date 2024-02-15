// TODO all calls to database should be async?
const { Pool } = require('pg');
  
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_USER_PASSWORD,
    port: process.env.DB_PORT
});
 
const query = (text, params, callback) => {
    // Example of using params. This is done instead of concatenating strings to prevent SQL injection
    // query("INSERT INTO customers (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)" ,
    //          [first_name, last_name, email, password],   // Values stored in variables
    //          (error, results) => {
    //              if (error) {
    //                  throw error
    //              }
    //          })
	
    return pool.query(text, params, callback)
};

const getProductById = async (id) => {
    const q = "SELECT * FROM products WHERE id = $1";
    const params = [id];

    // Must return a promise to be able to await when calling from another file
    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            if (results.rows.length > 0) {
                resolve(results.rows[0]);
            } else {
                reject(null);
            }
        });
    });
};

const getAllOrdersForUserId = async (id) => {
    const q = 'SELECT ' +
                  'ord.id AS order_id, ' +
	              'prod.name, ' +
	              'ord_prod.product_quantity, ' +
	              'prod.price AS unit_price, ' +
	              'ord_prod.product_quantity * prod.price AS total_item_price ' +
              'FROM products AS prod ' +
              'JOIN orders_products AS ord_prod ON ord_prod.product_id = prod.id ' +
              'JOIN orders AS ord ON ord_prod.order_id = ord.id ' +
              'JOIN customers AS cust ON cust.id = ord.customer_id ' +
              'WHERE cust.id = $1 ' +
              'ORDER BY ord.id;'
    const params = [id];

    // Must return a promise to be able to await when calling from another file
    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            if (results.rows.length > 0) {
                resolve(results.rows);
            } else {
                reject(null);
            }
        });
    });
};

const getOrderByIdForUserId = async (userId, orderId) => {
    const q = 'SELECT ' + 
              	'ord.id AS order_id,  ' +
              	'prod.name,  ' +
              	'ord_prod.product_quantity,  ' +
              	'prod.price AS unit_price,  ' +
              	'ord_prod.product_quantity * prod.price AS total_item_price ' +
              'FROM products AS prod ' +
              'JOIN orders_products AS ord_prod ON ord_prod.product_id = prod.id ' +
              'JOIN orders AS ord ON ord_prod.order_id = ord.id ' +
              'JOIN customers AS cust ON cust.id = ord.customer_id ' +
              'WHERE cust.id = $1 ' +
              'AND order_id = $2 ' +
              'ORDER BY ord.id; ';
    const params = [userId, orderId]

    // Must return a promise to be able to await when calling from another file
    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            if (results.rows.length > 0) {
                resolve(results.rows);
            } else {
                reject(null);
            }
        });
    });
};

const updateDBOnCheckout = async (customerId, productsInfo) => {
    // productsInfo is an array of objects with the key:
    //      id: id of the product in db
    // and the value:
    //      product_quantity: quantity of product that was in cart when purchasing

    // Insert new order in db
    const createOrderQuery = "INSERT INTO orders (customer_id) VALUES ($1) RETURNING id;";
    const creteOrderParams = [customerId];

    const createOrderPromise = new Promise((resolve, reject) => {
        query(createOrderQuery, creteOrderParams, (error, results) => {
            if (error) reject(error);
            
            if (results.rows.length > 0) {
                // Return order id for later assignment of the items in order
                resolve(results.rows[0].id);
            } else {
                reject(null);
            }
        });
    });

    const orderId = await createOrderPromise;
    
    // array to store all insert promises for executing them in parallel.
    const insertItemPromises = [];
    
    productsInfo.forEach(obj => {
        const productStrIdKey = Object.keys(obj)[0];
        const quantity = obj[productStrIdKey];

        // Insert item in order
        const insertItemQuery = 'INSERT INTO ' + 
                                   'orders_products (order_id, product_id, product_quantity) ' +
                                'VALUES ($1, $2, $3);';
        const insertItemParams = [parseInt(orderId), parseInt(productStrIdKey), quantity];

        const insertItemPromise = new Promise((resolve, reject) => {
            query(insertItemQuery, insertItemParams, (error, results) => {
                if (error) reject(error);
            
                resolve("ok");
            });
        });

        insertItemPromises.push(insertItemPromise);
    });

    await Promise.all(insertItemPromises);
};

module.exports = {
    query,
    getProductById,
    updateDBOnCheckout,
    getAllOrdersForUserId,
    getOrderByIdForUserId,
};