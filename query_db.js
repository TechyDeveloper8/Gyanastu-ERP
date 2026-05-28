const mongoose = require('mongoose');

const uri = "mongodb+srv://officialshikshaschool_db_user:M3bNN4liahMELcZa@erp.kj6wd0d.mongodb.net/?retryWrites=true&w=majority";

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  username: String
});

const User = mongoose.model('User', userSchema);

async function findStudent() {
  try {
    await mongoose.connect(uri, { dbName: 'gyanastu' });
    const student = await User.findOne({ role: 'STUDENT' });
    if (student) {
      console.log('STUDENT_EMAIL: ' + student.email);
      console.log('STUDENT_USERNAME: ' + (student.username || 'N/A'));
    } else {
      console.log('NO_STUDENT_FOUND');
    }

    const franchise = await User.findOne({ role: 'FRANCHISE_ADMIN' });
    if (franchise) {
      console.log('FRANCHISE_EMAIL: ' + franchise.email);
    } else {
      console.log('NO_FRANCHISE_FOUND');
    }

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    process.exit();
  }
}

findStudent();
