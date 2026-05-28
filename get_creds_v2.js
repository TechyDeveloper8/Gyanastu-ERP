const mongoose = require('mongoose');
const User = require('c:\\Users\\Anurag Raj\\Downloads\\gyanastu-erp\\backend\\models\\User');
const fs = require('fs');

const uri = process.env.MONGO_URI || "mongodb+srv://officialshikshaschool_db_user:M3bNN4liahMELcZa@erp.kj6wd0d.mongodb.net/?retryWrites=true&w=majority";

async function getLogins() {
  let output = '';
  try {
    await mongoose.connect(uri, { dbName: 'gyanastu' });

    let franchiseAdmin = await User.findOne({ role: 'FRANCHISE_ADMIN' });
    if (franchiseAdmin) {
      output += '--- FRANCHISE LOGIN ---\n';
      output += 'Email: ' + franchiseAdmin.email + '\n';
      output += 'Password: password\n';
    } else {
      output += 'No Franchise Admin found.\n';
    }

    let student = await User.findOne({ role: 'STUDENT' });
    if (student) {
      output += '\n--- STUDENT LOGIN ---\n';
      output += 'Email: ' + student.email + '\n';
      output += 'Username: ' + (student.username || 'N/A') + '\n';
      output += 'Password: password\n';
    } else {
      output += 'No Student found.\n';
    }

    fs.writeFileSync('creds_output.txt', output);
  } catch (err) {
    fs.writeFileSync('creds_output.txt', 'Error: ' + err.message);
  } finally {
    process.exit();
  }
}

getLogins();
