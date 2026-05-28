const mongoose = require('mongoose');
const User = require('c:\\Users\\Anurag Raj\\Downloads\\gyanastu-erp\\backend\\models\\User');

const uri = process.env.MONGO_URI || "mongodb+srv://officialshikshaschool_db_user:M3bNN4liahMELcZa@erp.kj6wd0d.mongodb.net/?retryWrites=true&w=majority";

async function listUsers() {
  try {
    await mongoose.connect(uri, { dbName: 'gyanastu' });
    const users = await User.find({}, 'email role');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

listUsers();
