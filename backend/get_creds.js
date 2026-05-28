const mongoose = require('mongoose');
const User = require('./models/User');

const uri = process.env.MONGO_URI || "mongodb+srv://officialshikshaschool_db_user:M3bNN4liahMELcZa@erp.kj6wd0d.mongodb.net/?retryWrites=true&w=majority";

async function getLogins() {
  try {
    await mongoose.connect(uri, { dbName: 'gyanastu' });

    let franchiseAdmin = await User.findOne({ role: 'FRANCHISE_ADMIN' });
    if (franchiseAdmin) {
      franchiseAdmin.password = 'password';
      await franchiseAdmin.save();
      console.log('--- FRANCHISE LOGIN ---');
      console.log('Email/Username: ' + franchiseAdmin.email);
      console.log('Password: password');
    } else {
      console.log('No Franchise Admin found.');
    }

    let student = await User.findOne({ role: 'STUDENT' });
    if (student) {
      student.password = 'password';
      await student.save();
      console.log('\n--- STUDENT LOGIN ---');
      console.log('Email/Username: ' + student.email);
      console.log('Password: password');
    } else {
      console.log('No Student found.');
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

getLogins();
