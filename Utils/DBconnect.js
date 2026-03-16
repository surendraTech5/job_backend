require("dotenv").config();
const mongoose = require("mongoose");

async function DBConnectionHandler() {
    try {
        const conn = await mongoose.connect(process.env.DB_STRING, {
            // optional settings can go here
        });
        console.log("db connected successfully");
        console.log(`   host: ${conn.connection.host}`);
        console.log(`   database: ${conn.connection.name}`);
        console.log(`   state: ${conn.connection.readyState}`); // 1 = connected
    } catch (err) {
        console.log(`There is an error id DB: ${err.message}`);
        process.exit(1);
    }
}

module.exports = DBConnectionHandler;
