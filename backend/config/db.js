
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ensure the URI points to the specific database. 
    // We also explicitly pass dbName in options to prevent the driver from defaulting to 'test' or checking 'local' database permissions.
    const uri = process.env.MONGO_URI || "mongodb+srv://officialshikshaschool_db_user:M3bNN4liahMELcZa@erp.kj6wd0d.mongodb.net/?retryWrites=true&w=majority";

    const conn = await mongoose.connect(uri, {
      dbName: 'gyanastu'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
