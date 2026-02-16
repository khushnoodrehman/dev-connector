const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(db)
        console.log("connected to DB");
    } catch (error) {
        console.log(error.message);
        // Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;