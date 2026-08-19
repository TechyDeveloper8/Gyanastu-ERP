const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { generatePassword, generateStudentUsername, generateFacultyUsername, generateFranchiseUsername, generateFranchiseCode, generateFranchisePassword, generateEmployeeCode } = require('./utils/credentials');
const { deleteFiles } = require('./utils/fileCleanup');

require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { PDFDocument, rgb } = require('pdf-lib');
const multer = require('multer');
// Models
const User = require('./models/User');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Course = require('./models/Course');
const Franchise = require('./models/Franchise');
const Batch = require('./models/Batch');
const StudentEnquiry = require('./models/StudentEnquiry');
const FranchiseEnquiry = require('./models/FranchiseEnquiry');
const CMSContent = require('./models/CMSContent');
const Certificate = require('./models/Certificate');
const StudentArchive = require('./models/StudentArchive');
const VerificationLog = require('./models/VerificationLog');

const Fee = require('./models/Fee');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification'); // Added newly
const StudyMaterial = require('./models/StudyMaterial'); // Added newly
const PasswordResetOTP = require('./models/PasswordResetOTP');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Connect to MongoDB will happen before server.listen

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));


io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper to broadcast changes easily
const broadcast = (event, data) => {
  io.emit(event, data);
  io.emit('dashboard_update', { message: 'Data changed' }); // Global trigger for dashboard refresh
};

// --- SEEDER HELPER ---
const seedData = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@gyanastu.com' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin', email: 'admin@gyanastu.com', password: 'password', role: 'SUPER_ADMIN',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', phone: '9876543210'
      });
      console.log('Super Admin Seeded');
    }

    const coursesExist = await Course.countDocuments();
    if (coursesExist === 0) {
      const courses = await Course.insertMany([
        { title: 'Full Stack Web Development', slug: 'full-stack-web-dev', category: 'Development', duration: '6 Months', level: 'Advanced', description: 'Master the MERN stack.', price: 45000 },
        { title: 'Data Science with Python', slug: 'data-science-python', category: 'Data Science', duration: '4 Months', level: 'Intermediate', description: 'Learn data analysis.', price: 35000 }
      ]);
      const franchise = await Franchise.create({ name: 'Gyanastu Delhi South', location: 'New Delhi', adminName: 'Vikram Singh', status: 'Active' });
      const facultyUser = await User.create({ name: 'Priya Sharma', email: 'faculty@gyanastu.com', password: 'password', role: 'FACULTY', franchiseId: franchise._id });
      await Faculty.create({ user: facultyUser._id, franchise: franchise._id, assignedCourses: [courses[0]._id], expertise: ['React', 'Node.js'] });
      await Batch.create({ name: 'WD-2023-Morning', course: courses[0]._id, faculty: facultyUser._id, franchise: franchise._id, schedule: 'Mon, Wed, Fri - 10:00 AM', startDate: new Date(), status: 'Active' });
      console.log('Default Seed Data Inserted');
    }
  } catch (err) { console.error("Seeding Error:", err); }
};
// Seed initialization moved to bottom

// --- MIDDLEWARE ---
const requireAuth = (req, res, next) => {
  let token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
  try {
    token = token.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gyanastu_super_secret_key_2024!!');
    req.user = decoded; // { id, role, franchiseId }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
  }
  const userRole = String(req.user.role || '').toUpperCase().replace(/[^A-Z]/g, '');
  const allowedRoles = roles.map(r => String(r).toUpperCase().replace(/[^A-Z]/g, ''));

  if (userRole === 'SUPERADMIN' || allowedRoles.includes(userRole) || roles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
};

// --- API ROUTES ---

// 1. Authentication
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email }, { username: email }] });
    const isMatch = user ? (user.password === password || await bcrypt.compare(password, user.password)) : false;

    if (isMatch) {
      if (user.password === password) {
        user.password = await bcrypt.hash(password, 10);
      }
      user.lastLogin = new Date();
      await user.save();
      const token = jwt.sign(
        { id: user._id, role: user.role, franchiseId: user.franchiseId },
        process.env.JWT_SECRET || 'gyanastu_super_secret_key_2024!!', { expiresIn: '30d' }
      );

      res.json({ token, user });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/auth/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = user.password === oldPassword || await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid old password' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.isFirstLogin = false;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, franchiseId: user.franchiseId },
      process.env.JWT_SECRET || 'gyanastu_super_secret_key_2024!!', { expiresIn: '30d' }
    );
    res.json({ token, user, message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/auth/me', async (req, res) => {
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer')) {
    try {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gyanastu_super_secret_key_2024!!');
      const user = await User.findById(decoded.id);
      res.json({ user });
    } catch (err) { res.status(401).json({ message: 'Not authorized' }); }
  } else res.status(401).json({ message: 'No token' });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: username }, { username: username }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.email) return res.status(400).json({ message: 'No email associated with this account' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 mins expiry

    await PasswordResetOTP.create({
      user_id: user._id,
      username: user.username || user.email,
      email: user.email,
      otp,
      expires_at: expiresAt
    });

    // Send email using Brevo API
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@gyanastu.com';

    if (brevoApiKey && brevoApiKey !== 'YOUR_BREVO_API_KEY_HERE') {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { email: senderEmail, name: 'Gyanastu ERP' },
            to: [{ email: user.email, name: user.name || 'User' }],
            subject: 'Password Reset OTP - Gyanastu ERP',
            textContent: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
            htmlContent: `<html><body><p>Hello,</p><p>Your OTP for password reset is: <strong>${otp}</strong>.</p><p>It will expire in 10 minutes.</p></body></html>`
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[Brevo API Error]:', errorData);
          throw new Error('Failed to send OTP email via Brevo API');
        }
      } catch (emailErr) {
        console.error('Error sending email:', emailErr);
        return res.status(500).json({ message: 'Error sending email. Please try again later.' });
      }
    } else {
      console.log(`[DEV MODE] OTP for ${user.email} is: ${otp} (Brevo API Key not configured)`);
    }

    // Mask email for response
    const emailParts = user.email.split('@');
    const maskedEmail = emailParts[0].charAt(0) + '*'.repeat(emailParts[0].length - 1) + '@' + emailParts[1];

    res.json({ message: 'OTP sent successfully', maskedEmail });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { username, otp } = req.body;
  try {
    const record = await PasswordResetOTP.findOne({ username, otp, used: false }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (new Date() > record.expires_at) return res.status(400).json({ message: 'OTP has expired' });

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { username, otp, newPassword } = req.body;
  console.log(`[API] reset-password requested for username: ${username}`);

  try {
    const record = await PasswordResetOTP.findOne({ username, otp, used: false }).sort({ createdAt: -1 });
    if (!record) {
      console.log(`[API] reset-password failed: Invalid or used OTP for ${username}`);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (new Date() > record.expires_at) {
      console.log(`[API] reset-password failed: OTP expired for ${username}`);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const user = await User.findById(record.user_id);
    if (!user) {
      console.log(`[API] reset-password failed: User not found (ID: ${record.user_id})`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[API] Hashing new password for ${username}...`);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    console.log(`[API] Password updated in database for ${username}`);

    record.used = true;
    await record.save();
    console.log(`[API] OTP marked as used for ${username}`);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(`[API] Error during reset-password for ${username}:`, err);
    res.status(500).json({ message: err.message });
  }
});

// 2. Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const students = await Student.countDocuments();
    const franchises = await Franchise.countDocuments();
    const courses = await Course.countDocuments();
    const certsCount = await Certificate.countDocuments();
    const revenueRes = await Fee.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    const recentAdmissions = await Student.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name');

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const dailyRevenue = await Fee.aggregate([
      { $match: { status: 'Paid', createdAt: { $gte: fiveDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, value: { $sum: "$amount" } } }
    ]);

    const chartData = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyRevenue.find(r => r._id === dateStr);
      chartData.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), value: match ? match.value : 0 });
    }

    res.json({ students, franchises, courses, certificates: certsCount, revenue: revenueRes[0]?.total || 0, recentAdmissions, chartData });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Students CRUD
app.get('/api/students', async (req, res) => {
  const { franchiseId } = req.query;
  try {
    const students = await Student.find(franchiseId ? { franchise: franchiseId } : {})
      .populate('user', 'name email avatarUrl phone address role')
      .populate('course', 'title')
      .populate('batch', 'name')
      .populate('franchise', 'name')
      .sort({ createdAt: -1 });

    const formatted = students.filter(s => s.user).map(s => ({
      id: s.user._id, studentId: s._id, name: s.user.name, email: s.user.email, role: s.user.role,
      avatarUrl: s.user.avatarUrl, phone: s.user.phone, address: s.user.address, rollNumber: s.rollNumber,
      franchiseId: s.franchise?._id, franchiseName: s.franchise?.name, courseId: s.course?._id, courseName: s.course?.title, batchId: s.batch?._id,
      batchName: s.batch?.name, admissionDate: s.admissionDate, status: s.status,
      attendancePercentage: s.attendancePercentage, feesPaid: s.feesPaid, totalFees: s.totalFees
    }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const studentPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'assets', 'students');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadStudentPhoto = multer({ storage: studentPhotoStorage });

app.post('/api/students', uploadStudentPhoto.single('studentPhoto'), async (req, res) => {
  try {
    const { name, email, franchiseId, courseId, batchId, totalFees, address, phone, guardianName, aadhaarNumber, franchiseName, bloodGroup } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'User with this email already exists' });

    let finalFranchiseId = franchiseId;
    if (!finalFranchiseId && franchiseName) {
      const franchise = await Franchise.findOne({ name: new RegExp('^' + franchiseName + '$', 'i') });
      if (franchise) finalFranchiseId = franchise._id;
    }

    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const username = await generateStudentUsername();

    let avatarUrl = undefined;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const newFilename = `${username}${ext}`;
      const newPath = path.join(__dirname, 'assets', 'students', newFilename);
      if (fs.existsSync(req.file.path)) fs.renameSync(req.file.path, newPath);
      avatarUrl = `/assets/students/${newFilename}`;
    }

    const newUser = await User.create({ name, email, username, password: hashedPassword, role: 'STUDENT', phone, address, avatarUrl, referenceModel: 'Student' });
    const newStudent = await Student.create({ user: newUser._id, franchise: finalFranchiseId, course: courseId, batch: batchId, totalFees: totalFees || 0, status: 'Pending', guardianName, aadhaarNumber, bloodGroup });

    newUser.referenceId = newStudent._id;
    await newUser.save();

    await Notification.create({ title: 'New Admission', message: `${name} enrolled (${username})`, type: 'Success' });
    broadcast('student_added', { studentId: newStudent._id });
    res.status(201).json({ ...newUser.toJSON(), ...newStudent.toJSON(), id: newUser._id, generatedUsername: username, generatedPassword: rawPassword });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { status, rollNumber, feesPaid, batchId } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (rollNumber) updateData.rollNumber = rollNumber;
    if (feesPaid !== undefined) updateData.feesPaid = feesPaid;
    if (batchId !== undefined) updateData.batch = batchId;

    const student = await Student.findOneAndUpdate({ user: req.params.id }, updateData, { new: true });

    if (status || rollNumber) {
      const userUpdate = {};
      if (status) userUpdate.status = status === 'Active' ? 'Active' : 'Suspended';

      const user = await User.findById(req.params.id);
      if (rollNumber && user && user.avatarUrl && user.avatarUrl.startsWith('/assets/')) {
        const oldPath = path.join(__dirname, user.avatarUrl.replace('/assets/', 'assets/'));
        if (fs.existsSync(oldPath)) {
          const ext = path.extname(oldPath);
          const newFilename = `${rollNumber}${ext}`;
          const newPath = path.join(__dirname, 'assets', 'students', newFilename);
          fs.renameSync(oldPath, newPath);
          userUpdate.avatarUrl = `/assets/students/${newFilename}`;
        }
      }
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(req.params.id, userUpdate);
      }
    }

    broadcast('student_updated', { userId: req.params.id });
    res.json(student);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/students/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const student = await Student.findOne({ user: req.params.id }).session(session);
    const user = await User.findById(req.params.id).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found' });
    }

    const filesToDelete = [];
    if (user.avatarUrl) filesToDelete.push(user.avatarUrl);

    if (student) {
      // Find certificates to delete their PDFs
      const certs = await Certificate.find({ studentId: req.params.id }).session(session);
      certs.forEach(c => { if (c.pdfUrl) filesToDelete.push(c.pdfUrl); });

      // Delete related records
      await Attendance.deleteMany({ student: student._id }).session(session);
      await Fee.deleteMany({ student: student._id }).session(session);
      await Certificate.deleteMany({ studentId: req.params.id }).session(session);
      await VerificationLog.deleteMany({ referenceId: student._id }).session(session);

      // Delete the student record
      await Student.findByIdAndDelete(student._id).session(session);
    }

    // Delete the user record and OTPs
    await User.findByIdAndDelete(req.params.id).session(session);
    await PasswordResetOTP.deleteMany({ user_id: req.params.id }).session(session);
    await Notification.deleteMany({ user: req.params.id }).session(session);

    await session.commitTransaction();
    session.endSession();

    // Physical File Cleanup after DB commit
    deleteFiles(filesToDelete);

    broadcast('student_deleted', { userId: req.params.id });
    res.json({ message: 'Deleted cleanly from all related databases' });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { }
    session.endSession();
    res.status(500).json({ message: err.message });
  }
});

// 4. Franchises CRUD
app.get('/api/franchises', async (req, res) => {
  try {
    const franchises = await Franchise.find().lean();
    const enriched = await Promise.all(franchises.map(async (f) => {
      const studentCount = await Student.countDocuments({ franchise: f._id });
      const students = await Student.find({ franchise: f._id });
      const studentIds = students.map(s => s._id);
      const revenueRes = await Fee.aggregate([
        { $match: { student: { $in: studentIds }, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      return { ...f, id: f._id, studentCount, revenue: revenueRes[0]?.total || 0 };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
const franchisePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'assets', 'franchises');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'franchise-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadFranchisePhoto = multer({ storage: franchisePhotoStorage });

app.post('/api/franchises', uploadFranchisePhoto.single('franchisePhoto'), async (req, res) => {
  try {
    const {
      name, ownerName, dateOfBirth, gender, mobileNumber, alternateMobileNumber, emailAddress,
      aadhaarNumber, gstNumber, panNumber, establishmentYear,
      addressLine1, addressLine2, city, district, state, pinCode
    } = req.body;

    const emailToUse = emailAddress;

    if (await User.findOne({ email: emailToUse })) return res.status(400).json({ message: 'User already exists with this email' });

    const rawPassword = generateFranchisePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const username = await generateFranchiseUsername();
    const franchiseCode = await generateFranchiseCode();

    let avatarUrl = undefined;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const newFilename = `${franchiseCode}${ext}`;
      const newPath = path.join(__dirname, 'assets', 'franchises', newFilename);
      if (fs.existsSync(req.file.path)) fs.renameSync(req.file.path, newPath);
      avatarUrl = `/assets/franchises/${newFilename}`;
    }

    const franchise = await Franchise.create({
      franchiseCode, avatarUrl, name, location: city, ownerName, dateOfBirth, gender,
      mobileNumber, alternateMobileNumber, emailAddress, aadhaarNumber, gstNumber, panNumber,
      establishmentYear, addressLine1, addressLine2, city, district, state, pinCode,
      status: 'Active'
    });

    const adminUser = await User.create({
      name: ownerName,
      email: emailToUse,
      username,
      password: hashedPassword,
      role: 'FRANCHISE_ADMIN',
      phone: mobileNumber,
      avatarUrl,
      address: `${addressLine1}, ${city}, ${state}`,
      referenceModel: 'Franchise',
      referenceId: franchise._id
    });

    franchise.adminId = adminUser._id;
    await franchise.save();

    broadcast('franchise_added', franchise);
    res.status(201).json({ ...franchise.toJSON(), generatedUsername: username, generatedPassword: rawPassword });
  } catch (err) { res.status(400).json({ message: err.message }); }
});
app.put('/api/franchises/:id', async (req, res) => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    broadcast('franchise_updated', franchise);
    res.json(franchise);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
app.patch('/api/franchises/:id/status', async (req, res) => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    broadcast('franchise_updated', franchise);
    res.json(franchise);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
app.delete('/api/franchises/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const franchise = await Franchise.findById(req.params.id).session(session);
    if (!franchise) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Not found' });
    }

    const filesToDelete = [];

    // 1. Delete franchise admin user
    if (franchise.adminId) {
      const adminUser = await User.findById(franchise.adminId).session(session);
      if (adminUser && adminUser.avatarUrl) filesToDelete.push(adminUser.avatarUrl);

      await User.findByIdAndDelete(franchise.adminId).session(session);
      await PasswordResetOTP.deleteMany({ user_id: franchise.adminId }).session(session);
      await Notification.deleteMany({ user: franchise.adminId }).session(session);
    }

    // 2. Handle linked faculties
    const faculties = await Faculty.find({ franchise: req.params.id }).session(session);
    for (const fac of faculties) {
      const facUser = await User.findById(fac.user).session(session);
      if (facUser && facUser.avatarUrl) filesToDelete.push(facUser.avatarUrl);

      await User.findByIdAndDelete(fac.user).session(session);
      await PasswordResetOTP.deleteMany({ user_id: fac.user }).session(session);
      await Notification.deleteMany({ user: fac.user }).session(session);
      await Faculty.findByIdAndDelete(fac._id).session(session);
    }

    // 3. Handle linked students
    const students = await Student.find({ franchise: req.params.id }).session(session);
    for (const student of students) {
      const stUser = await User.findById(student.user).session(session);
      if (stUser && stUser.avatarUrl) filesToDelete.push(stUser.avatarUrl);

      const certs = await Certificate.find({ studentId: student.user }).session(session);
      certs.forEach(c => { if (c.pdfUrl) filesToDelete.push(c.pdfUrl); });

      await Attendance.deleteMany({ student: student._id }).session(session);
      await Fee.deleteMany({ student: student._id }).session(session);
      await Certificate.deleteMany({ studentId: student.user }).session(session);
      await VerificationLog.deleteMany({ referenceId: student._id }).session(session);

      await Student.findByIdAndDelete(student._id).session(session);
      await User.findByIdAndDelete(student.user).session(session);
      await PasswordResetOTP.deleteMany({ user_id: student.user }).session(session);
      await Notification.deleteMany({ user: student.user }).session(session);
    }

    // 4. Handle Batches
    await Batch.deleteMany({ franchise: req.params.id }).session(session);

    // 5. Delete the franchise
    await Franchise.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    // Physical file cleanup
    deleteFiles(filesToDelete);

    broadcast('franchise_deleted', req.params.id);
    res.json({ message: 'Franchise and all associated users deleted completely' });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { }
    session.endSession();
    res.status(500).json({ message: err.message });
  }
});

// 5. Courses CRUD
const courseStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dirName = file.fieldname === 'courseImage' ? 'course_images' : 'coursesyllabus';
    const dir = path.join(__dirname, 'assets', dirName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const cleanName = (req.body.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const prefix = file.fieldname === 'courseImage' ? 'img' : 'pdf';
    cb(null, `${cleanName}_${Date.now()}_${prefix}${path.extname(file.originalname)}`);
  }
});

const uploadCourseFiles = multer({
  storage: courseStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).fields([
  { name: 'courseImage', maxCount: 1 },
  { name: 'syllabusPdf', maxCount: 1 }
]);

app.get('/api/courses', async (req, res) => {
  res.json(await Course.find().sort({ createdAt: -1 }));
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/courses', requireAuth, requireRole(['SUPER_ADMIN']), uploadCourseFiles, async (req, res) => {
  try {
    const courseData = { ...req.body };
    if (req.files) {
      if (req.files['courseImage'] && req.files['courseImage'].length > 0) {
        courseData.thumbnail = `/assets/course_images/${req.files['courseImage'][0].filename}`;
      }
      if (req.files['syllabusPdf'] && req.files['syllabusPdf'].length > 0) {
        courseData.syllabusUrl = `/assets/coursesyllabus/${req.files['syllabusPdf'][0].filename}`;
      }
    }
    courseData.slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const course = await Course.create(courseData);
    broadcast('course_added', course);
    res.status(201).json(course);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/courses/:id', requireAuth, requireRole(['SUPER_ADMIN']), uploadCourseFiles, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const courseData = { ...req.body };
    const filesToDelete = [];

    if (req.files) {
      if (req.files['courseImage'] && req.files['courseImage'].length > 0) {
        if (course.thumbnail && course.thumbnail.startsWith('/assets/')) filesToDelete.push(course.thumbnail);
        courseData.thumbnail = `/assets/course_images/${req.files['courseImage'][0].filename}`;
      }
      if (req.files['syllabusPdf'] && req.files['syllabusPdf'].length > 0) {
        if (course.syllabusUrl && course.syllabusUrl.startsWith('/assets/')) filesToDelete.push(course.syllabusUrl);
        courseData.syllabusUrl = `/assets/coursesyllabus/${req.files['syllabusPdf'][0].filename}`;
      }
    }

    if (courseData.title) {
      courseData.slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, courseData, { new: true });

    if (filesToDelete.length > 0) deleteFiles(filesToDelete);

    broadcast('course_updated', updatedCourse);
    res.json(updatedCourse);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/courses/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const filesToDelete = [];
    if (course.thumbnail && course.thumbnail.startsWith('/assets/')) filesToDelete.push(course.thumbnail);
    if (course.syllabusUrl && course.syllabusUrl.startsWith('/assets/')) filesToDelete.push(course.syllabusUrl);

    await Course.findByIdAndDelete(req.params.id);
    if (filesToDelete.length > 0) deleteFiles(filesToDelete);

    broadcast('course_deleted', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 6. Batches CRUD
app.get('/api/batches', requireAuth, async (req, res) => {
  try {
    const { franchiseId, facultyId } = req.query;
    let query = {};

    if (req.user.role === 'FRANCHISE_ADMIN') {
      query.franchise = req.user.franchiseId;
    } else if (req.user.role === 'FACULTY') {
      // Faculty only see batches assigned to them or within their franchise
      if (req.user.franchiseId) query.franchise = req.user.franchiseId;
      if (facultyId) query.faculty = facultyId;
    } else if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ user: req.user.id });
      if (student && student.batch) query._id = student.batch;
    } else {
      // Super Admin sees all, or filters by franchise
      if (franchiseId) query.franchise = franchiseId;
    }

    const batches = await Batch.find(query)
      .populate('course', 'title')
      .populate('franchise', 'name')
      .populate('faculty', 'name');

    // Manually count students for each batch
    const enriched = await Promise.all(batches.map(async (b) => {
      const currentStudents = await Student.countDocuments({ batch: b._id });
      return {
        id: b._id,
        batchName: b.batchName,
        courseId: b.course?._id,
        courseName: b.course?.title,
        franchiseId: b.franchise?._id,
        franchiseName: b.franchise?.name,
        facultyId: b.faculty?._id,
        facultyName: b.faculty?.name,
        timing: b.timing,
        startDate: b.startDate,
        endDate: b.endDate,
        capacity: b.capacity,
        classroom: b.classroom,
        remarks: b.remarks,
        status: b.status,
        currentStudents
      };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/batches', requireAuth, requireRole(['SUPER_ADMIN', 'FRANCHISE_ADMIN']), async (req, res) => {
  try {
    const isSuperAdmin = (req.user.role || '').toUpperCase().replace(/[^A-Z]/g, '') === 'SUPERADMIN';
    const franchiseId = isSuperAdmin ? (req.body.franchiseId || req.body.franchise) : req.user.franchiseId;
    const payload = { ...req.body, franchise: franchiseId };
    const batch = await Batch.create(payload);
    broadcast('batch_added', batch);
    res.status(201).json(batch);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/batches/:id', requireAuth, requireRole(['SUPER_ADMIN', 'FRANCHISE_ADMIN']), async (req, res) => {
  try {
    const isSuperAdmin = (req.user.role || '').toUpperCase().replace(/[^A-Z]/g, '') === 'SUPERADMIN';
    const filter = isSuperAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, franchise: req.user.franchiseId };
    const batch = await Batch.findOneAndUpdate(
      filter,
      req.body,
      { new: true }
    );
    if (!batch) return res.status(404).json({ message: 'Batch not found or access denied' });
    broadcast('batch_updated', batch);
    res.json(batch);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/batches/:id', requireAuth, requireRole(['SUPER_ADMIN', 'FRANCHISE_ADMIN']), async (req, res) => {
  try {
    const isSuperAdmin = (req.user.role || '').toUpperCase().replace(/[^A-Z]/g, '') === 'SUPERADMIN';
    const filter = isSuperAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, franchise: req.user.franchiseId };
    const batch = await Batch.findOneAndDelete(filter);
    if (!batch) return res.status(404).json({ message: 'Batch not found or access denied' });

    // Unassign students from this batch
    await Student.updateMany({ batch: req.params.id }, { batch: null });

    broadcast('batch_deleted', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/batches/:id/students', requireAuth, async (req, res) => {
  try {
    const students = await Student.find({ batch: req.params.id }).populate('user', 'name phone');
    res.json(students.map(s => ({
      studentId: s.user._id, // User ID is used as studentId in frontend in some places
      studentRecordId: s._id, // Actual Student ID
      name: s.user.name,
      phone: s.user.phone,
      admissionDate: s.admissionDate,
      attendancePercentage: s.attendancePercentage
    })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 7. Faculty CRUD
app.get('/api/faculty', async (req, res) => {
  const { franchiseId } = req.query;
  const faculties = await Faculty.find(franchiseId ? { franchise: franchiseId } : {}).populate('user').populate('franchise', 'name');
  res.json(faculties.filter(f => f.user).map(f => ({
    id: f.user._id, name: f.user.name, email: f.user.email, phone: f.user.phone, address: f.user.address,
    avatarUrl: f.user.avatarUrl, username: f.user.username, role: 'FACULTY',
    employeeCode: f.employeeCode, designation: f.designation, qualification: f.qualification,
    bloodGroup: f.bloodGroup, emergencyContact: f.emergencyContact, joinDate: f.joinDate || f.createdAt,
    expertise: f.expertise, rating: f.rating, franchiseName: f.franchise?.name || ''
  })));
});

const facultyPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'assets', 'faculty');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'faculty-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadFacultyPhoto = multer({ storage: facultyPhotoStorage });

app.post('/api/faculty', uploadFacultyPhoto.single('facultyPhoto'), async (req, res) => {
  try {
    const { name, email, phone, address, franchiseId, designation, qualification, bloodGroup, emergencyContact, joinDate, expertise, assignedCourses, assignedBatches } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'User exists' });

    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const username = await generateFacultyUsername();
    const employeeCode = await generateEmployeeCode();

    let avatarUrl = undefined;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const newFilename = `${employeeCode}${ext}`;
      const newPath = path.join(__dirname, 'assets', 'faculty', newFilename);
      if (fs.existsSync(req.file.path)) fs.renameSync(req.file.path, newPath);
      avatarUrl = `/assets/faculty/${newFilename}`;
    }

    const parsedCourses = assignedCourses ? (typeof assignedCourses === 'string' ? JSON.parse(assignedCourses) : assignedCourses) : [];
    const parsedBatches = assignedBatches ? (typeof assignedBatches === 'string' ? JSON.parse(assignedBatches) : assignedBatches) : [];
    const parsedExpertise = expertise ? (typeof expertise === 'string' ? JSON.parse(expertise) : expertise) : [];

    const user = await User.create({ name, email, username, password: hashedPassword, role: 'FACULTY', phone, address, avatarUrl, referenceModel: 'Faculty' });
    const fac = await Faculty.create({
      user: user._id, franchise: franchiseId, employeeCode, designation, qualification,
      bloodGroup, emergencyContact, joinDate: joinDate || new Date(),
      expertise: parsedExpertise, assignedCourses: parsedCourses, assignedBatches: parsedBatches
    });

    user.referenceId = fac._id;
    await user.save();

    await Notification.create({ title: 'New Faculty', message: `${name} onboarded (${employeeCode})`, type: 'Success' });
    broadcast('faculty_added', fac);
    res.status(201).json({ id: user._id, name, email, role: 'FACULTY', employeeCode, generatedUsername: username, generatedPassword: rawPassword });
  } catch (err) { res.status(400).json({ message: err.message }); }
});
app.delete('/api/faculty/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const faculty = await Faculty.findOne({ user: req.params.id }).session(session);
    const user = await User.findById(req.params.id).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found' });
    }

    const filesToDelete = [];
    if (user.avatarUrl) filesToDelete.push(user.avatarUrl);

    if (faculty) {
      // Unassign from batches
      await Batch.updateMany({ faculty: req.params.id }, { faculty: null }).session(session);
      await Faculty.findByIdAndDelete(faculty._id).session(session);
    }

    // Delete User and OTPs
    await User.findByIdAndDelete(req.params.id).session(session);
    await PasswordResetOTP.deleteMany({ user_id: req.params.id }).session(session);
    await Notification.deleteMany({ user: req.params.id }).session(session);

    await session.commitTransaction();
    session.endSession();

    // Physical File Cleanup
    deleteFiles(filesToDelete);

    broadcast('faculty_deleted', req.params.id);
    res.json({ message: 'Faculty completely removed from database' });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { }
    session.endSession();
    res.status(500).json({ message: err.message });
  }
});

// 8. Attendance
app.get('/api/attendance', requireAuth, async (req, res) => {
  try {
    const { studentId, batchId, date, startDate, endDate } = req.query;
    const query = {};

    // Security check: Student can only view their own
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) return res.status(403).json({ message: 'Student record not found' });
      query.student = student._id;
    } else if (studentId) {
      // Find internal student _id
      const st = await Student.findOne({ user: studentId });
      if (st) query.student = st._id;
    }

    if (batchId) query.batch = batchId;

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(targetDate.getDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDate };
    } else if (startDate && endDate) {
      const sd = new Date(startDate); sd.setHours(0, 0, 0, 0);
      const ed = new Date(endDate); ed.setHours(23, 59, 59, 999);
      query.date = { $gte: sd, $lte: ed };
    }

    const records = await Attendance.find(query).sort({ date: -1 }).populate('batch', 'batchName').populate({ path: 'student', populate: { path: 'user', select: 'name' } });
    res.json(records.map(r => ({
      id: r._id,
      studentId: r.student.user._id,
      studentName: r.student.user.name,
      batchId: r.batch._id,
      batchName: r.batch.batchName,
      date: r.date,
      status: r.status,
      remarks: r.remarks
    })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/attendance', requireAuth, requireRole(['FRANCHISE_ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const { batchId, date, records } = req.body;

    // Check if the user has access to this batch
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    if (req.user.role === 'FRANCHISE_ADMIN' && batch.franchise.toString() !== req.user.franchiseId) {
      return res.status(403).json({ message: 'Access Denied' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const promises = records.map(async (rec) => {
      // Find actual Student document via User ID (rec.studentId)
      const studentDoc = await Student.findOne({ user: rec.studentId });
      if (!studentDoc) return;
      return Attendance.findOneAndUpdate(
        { student: studentDoc._id, batch: batchId, date: targetDate },
        { status: rec.status, remarks: rec.remarks, markedBy: req.user.id },
        { upsert: true, new: true }
      );
    });
    await Promise.all(promises);

    // Recalculate attendance % for all these students
    for (const rec of records) {
      const studentDoc = await Student.findOne({ user: rec.studentId });
      if (studentDoc) {
        const totalDays = await Attendance.countDocuments({ student: studentDoc._id });
        const presentDays = await Attendance.countDocuments({ student: studentDoc._id, status: 'Present' });
        const pct = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        studentDoc.attendancePercentage = parseFloat(pct.toFixed(2));
        await studentDoc.save();
      }
    }

    broadcast('attendance_marked', { batchId, date });
    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/attendance/reports/student', requireAuth, async (req, res) => {
  try {
    const { franchiseId } = req.query;
    let studentQuery = {};

    if (req.user.role === 'FRANCHISE_ADMIN') {
      studentQuery.franchise = req.user.franchiseId;
    } else if (req.user.role === 'SUPER_ADMIN' && franchiseId) {
      studentQuery.franchise = franchiseId;
    }

    const students = await Student.find(studentQuery).populate('user', 'name').populate('batch', 'batchName');

    const report = await Promise.all(students.map(async (s) => {
      const total = await Attendance.countDocuments({ student: s._id });
      const present = await Attendance.countDocuments({ student: s._id, status: 'Present' });
      const absent = await Attendance.countDocuments({ student: s._id, status: 'Absent' });
      const late = await Attendance.countDocuments({ student: s._id, status: 'Late' });
      const leave = await Attendance.countDocuments({ student: s._id, status: 'Leave' });

      return {
        studentId: s.user._id,
        studentName: s.user.name,
        batchName: s.batch ? s.batch.batchName : 'Unassigned',
        totalDays: total,
        presentDays: present,
        absentDays: absent,
        lateDays: late,
        leaveDays: leave,
        attendancePercentage: s.attendancePercentage
      };
    }));

    res.json(report);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/attendance/reports/batch', requireAuth, async (req, res) => {
  try {
    const { franchiseId } = req.query;
    let batchQuery = {};
    if (req.user.role === 'FRANCHISE_ADMIN') {
      batchQuery.franchise = req.user.franchiseId;
    } else if (req.user.role === 'SUPER_ADMIN' && franchiseId) {
      batchQuery.franchise = franchiseId;
    }

    const batches = await Batch.find(batchQuery);
    const report = await Promise.all(batches.map(async (b) => {
      const studentCount = await Student.countDocuments({ batch: b._id });

      // Today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + 1);

      const todayRecords = await Attendance.find({ batch: b._id, date: { $gte: today, $lt: nextDate } });
      const presentToday = todayRecords.filter(r => r.status === 'Present').length;

      // Monthly average approx (just calculating all time average for simplicity, can be refined)
      const allRecords = await Attendance.find({ batch: b._id });
      const totalP = allRecords.filter(r => r.status === 'Present').length;
      const averagePct = allRecords.length > 0 ? (totalP / allRecords.length) * 100 : 0;

      return {
        batchId: b._id,
        batchName: b.batchName,
        totalStudents: studentCount,
        presentToday,
        averageAttendance: parseFloat(averagePct.toFixed(2))
      };
    }));
    res.json(report);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 9. Study Materials
app.get('/api/materials', async (req, res) => {
  try {
    const { batchId } = req.query;
    const filter = batchId ? { batch: batchId } : {};
    const materials = await StudyMaterial.find(filter).populate('batch', 'name').populate('course', 'title').sort({ createdAt: -1 });
    res.json(materials.map(m => ({ ...m.toObject(), id: m._id })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/materials', async (req, res) => {
  try {
    const { title, type, url, courseId, batchId, uploadedBy } = req.body;
    const mat = await StudyMaterial.create({ title, type, url, course: courseId, batch: batchId, uploadedBy });
    broadcast('material_added', { id: mat._id });
    res.status(201).json(mat);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/materials/:id', async (req, res) => {
  try {
    await StudyMaterial.findByIdAndDelete(req.params.id);
    broadcast('material_deleted', { id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 10. Fees
app.get('/api/fees', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (studentId) {
      const student = await Student.findOne({ user: studentId });
      return res.json(await Fee.find({ student: student._id }));
    }
    // Return all for admin
    return res.json(await Fee.find().populate({ path: 'student', populate: { path: 'user' } }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});
app.post('/api/fees', async (req, res) => {
  try {
    const { studentId, amount, type } = req.body;
    const student = await Student.findOne({ user: studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const fee = await Fee.create({ student: student._id, amount, type, receiptId: `REC-${Date.now()}`, status: 'Paid' });
    student.feesPaid += amount;
    await student.save();
    broadcast('fee_paid', fee);
    res.status(201).json(fee);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 10. Certificates
const templateStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'assets');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'cet_temp.pdf'); // Overwrite the existing file
  }
});
const uploadTemplate = multer({
  storage: templateStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF templates are allowed'));
  }
});

app.post('/api/certificates/template', uploadTemplate.single('template'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ message: 'Template updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/certificates', async (req, res) => {
  try {
    const { studentId, courseId, generatedBy } = req.body;
    const student = await Student.findOne({ user: studentId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // Lookup SuperAdmin if generatedBy is a string 'SuperAdmin'
    let adminId = generatedBy;
    if (generatedBy === 'SuperAdmin' || !mongoose.Types.ObjectId.isValid(generatedBy)) {
      const admin = await User.findOne({ role: 'SUPER_ADMIN' });
      adminId = admin ? admin._id : null;
    }

    const cert = await Certificate.create({ certificateId: `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, student: student._id, course: courseId, status: 'Valid', approvedBy: adminId });
    student.certificateStatus = 'Issued';
    if (student.status === 'Active') student.status = 'Graduated';
    await student.save();

    broadcast('certificate_generated', cert);
    res.status(201).json(cert);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
app.get('/api/certificates', async (req, res) => {
  const certs = await Certificate.find().populate({ path: 'student', populate: { path: 'user' } }).populate('course');
  res.json(certs.map(c => ({ id: c.certificateId, studentId: c.student?.user?._id, studentName: c.student?.user?.name, courseName: c.course?.title, issueDate: c.issueDate.toISOString().split('T')[0], status: c.status })));
});
app.delete('/api/certificates/:id', async (req, res) => {
  try {
    await Certificate.findOneAndDelete({ certificateId: req.params.id });
    broadcast('certificate_deleted', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
app.get('/api/certificates/verify/:id', async (req, res) => {
  try {
    // Step 1: Search active certificates
    const cert = await Certificate.findOne({ certificateId: req.params.id }).populate({ path: 'student', populate: { path: 'user' } }).populate('course');
    if (cert) {
      // Log verification
      await VerificationLog.create({ certificateId: req.params.id, found: true, source: 'active' });
      return res.json({
        id: cert.certificateId,
        studentName: cert.student?.user?.name,
        courseName: cert.course?.title,
        issueDate: cert.issueDate.toISOString().split('T')[0],
        status: cert.status,
        aadharNumber: cert.student?.aadhaarNumber ? cert.student.aadhaarNumber.toString().slice(-4) : 'N/A',
        source: 'active'
      });
    }

    // Step 2: Search archive records
    const archiveRecord = await StudentArchive.findOne({ certificateId: req.params.id });
    if (archiveRecord) {
      await VerificationLog.create({ certificateId: req.params.id, found: true, source: 'archive' });
      return res.json({
        id: archiveRecord.certificateId,
        studentName: archiveRecord.studentName,
        courseName: archiveRecord.courseName,
        session: archiveRecord.session,
        completionDate: archiveRecord.completionDate ? archiveRecord.completionDate.toISOString().split('T')[0] : null,
        grade: archiveRecord.grade,
        resultStatus: archiveRecord.resultStatus,
        aadharNumber: archiveRecord.aadharNumber || 'N/A',
        status: 'Valid',
        source: 'archive'
      });
    }

    // Step 3: Not found in either
    await VerificationLog.create({ certificateId: req.params.id, found: false, source: 'not_found' });
    return res.status(404).json({ message: 'Certificate not found' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/certificates/download/:id', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.id })
      .populate({ path: 'student', populate: [{ path: 'user' }, { path: 'franchise' }] })
      .populate('course');

    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const templatePath = path.join(__dirname, 'assets', 'cet_temp.pdf');
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: 'Template not found at ' + templatePath });
    }
    const templateBytes = fs.readFileSync(templatePath);

    // Load existing PDF instead of creating a new one
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    // Ensure standard font
    const helveticaFont = await pdfDoc.embedFont('Helvetica');
    const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
    const timesRoman = await pdfDoc.embedFont('Times-Roman');
    const timesBold = await pdfDoc.embedFont('Times-Bold');

    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return rgb(r, g, b);
    };

    // 1. STUDENT NAME
    const studentName = cert.student?.user?.name || 'Unknown Student';
    page.drawText(studentName, {
      x: 365,
      y: 290,
      size: 24,
      font: timesBold,
      color: hexToRgb('#000000')
    });

    // 2. REGISTRATION NUMBER
    const regNo = cert.student?.rollNumber || cert.student?.user?._id?.toString()?.slice(-8) || 'N/A';
    page.drawText(regNo, {
      x: 403,
      y: 268,
      size: 12,
      font: helveticaFont,
      color: hexToRgb('#000000')
    });

    // 3. FATHER / GUARDIAN NAME
    const guardianName = cert.student?.guardianName || 'Guardian Name';
    page.drawText(guardianName, {
      x: 359,
      y: 240,
      size: 16,
      font: helveticaFont,
      color: hexToRgb('#000000')
    });

    // 4. COURSE NAME
    const courseName = cert.course?.title || 'Unknown Course';
    page.drawText(courseName, {
      x: 300,
      y: 172,
      size: 18,
      font: helveticaBold,
      color: hexToRgb('#ffffffff')
    });

    // 5. DURATION
    let duration = cert.course?.duration || 'Unknown';
    if (duration !== 'Unknown') {
      const match = duration.match(/\d+/);
      if (match) duration = match[0];
    }
    page.drawText(duration, {
      x: 290,
      y: 147,
      size: 14,
      font: helveticaFont,
      color: hexToRgb('#000000')
    });

    // 6. GRADE
    const grade = cert.grade || 'A+';
    page.drawText(grade, {
      x: 581,
      y: 145,
      size: 16,
      font: helveticaBold,
      color: hexToRgb('#000000')
    });

    // 7. DATE FIELD
    const issueDate = cert.issueDate.toISOString().split('T')[0];
    page.drawText(issueDate, {
      x: 92,
      y: 78,
      size: 14,
      font: helveticaFont,
      color: hexToRgb('#000000')
    });

    // 8. PLACE FIELD
    const placeText = cert.student?.franchise?.name || 'New Delhi, India';
    page.drawText(placeText, {
      x: 96,
      y: 50,
      size: 14,
      font: helveticaFont,
      color: hexToRgb('#000000')
    });

    // 9. CERTIFICATE NUMBER
    page.drawText(cert.certificateId, {
      x: 675,
      y: 559,
      size: 10,
      font: helveticaFont,
      color: hexToRgb('#000000')
    });

    /* // 10. QR CODE POSITION
     const verificationUrl = `https://erp.gyanastu.in/verify/${cert.certificateId}`;
     const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1 });
     const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
     const qrImage = await pdfDoc.embedPng(qrImageBytes);
     page.drawImage(qrImage, {
       x: 680,
       y: 50,
       width: 80,
       height: 80
     });*/

    if (cert.student?.user?.avatarUrl && cert.student.user.avatarUrl.startsWith('/assets/')) {
      try {
        const photoPath = path.join(__dirname, cert.student.user.avatarUrl.replace('/assets/', 'assets/'));
        if (fs.existsSync(photoPath)) {
          const photoBytes = fs.readFileSync(photoPath);
          const ext = path.extname(photoPath).toLowerCase();
          let photoImage;
          if (ext === '.jpg' || ext === '.jpeg') {
            photoImage = await pdfDoc.embedJpg(photoBytes);
          } else if (ext === '.png') {
            photoImage = await pdfDoc.embedPng(photoBytes);
          }

          if (photoImage) {
            page.drawImage(photoImage, {
              x: 665,
              y: 450,
              width: 80,
              height: 80
            });
          }
        }
      } catch (e) {
        console.error('Failed to embed student photo:', e);
      }
    }

    const pdfBytes = await pdfDoc.save();

    // Ensure output directory exists
    const outputDir = path.join(__dirname, 'generated-certificates');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const fileName = `${cert.certificateId}.pdf`;
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, pdfBytes);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// 11. Notifications & CMS/Audit
app.get('/api/notifications', async (req, res) => {
  res.json(await Notification.find().sort({ createdAt: -1 }).limit(20));
});
app.get('/api/cms', async (req, res) => {
  res.json(await CMSContent.find());
});
app.put('/api/cms/:id', async (req, res) => {
  try {
    const { id, section, content } = req.body;
    const cmsItem = await CMSContent.findOneAndUpdate(
      { id: req.params.id },
      { id: req.params.id, section, content, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
    broadcast('cms_updated', cmsItem);
    res.json(cmsItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── 12. Student ID Card Generation ──────────────────────────────────────────

// Auth middleware helper

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    next();
  };
};

const authenticateToken = (req, res, next) => {

  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer')) {
    try {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gyanastu_super_secret_key_2024!!');
      req.user = decoded;
      next();
    } catch (err) { res.status(401).json({ message: 'Not authorized' }); }
  } else {
    res.status(401).json({ message: 'No token' });
  }
};

// ─── 13. Student Archive (Old Student Records) ──────────────────────────────

// Archive - Add a record
app.post('/api/archive/add', authenticateToken, async (req, res) => {
  try {
    const record = await StudentArchive.create(req.body);
    broadcast('archive_updated', { action: 'add', id: record._id });
    res.status(201).json(record);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'A record with this Certificate ID already exists.' });
    res.status(400).json({ message: err.message });
  }
});

// Archive - List with search, filter, pagination
app.get('/api/archive/list', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 20, course, session, batch } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { certificateId: regex },
        { studentName: regex },
        { courseName: regex },
        { session: regex },
        { batch: regex }
      ];
    }
    if (course) query.courseName = new RegExp(course, 'i');
    if (session) query.session = session;
    if (batch) query.batch = batch;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      StudentArchive.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      StudentArchive.countDocuments(query)
    ]);

    res.json({ records, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Archive - Update a record
app.put('/api/archive/update/:id', authenticateToken, async (req, res) => {
  try {
    const record = await StudentArchive.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    broadcast('archive_updated', { action: 'update', id: record._id });
    res.json(record);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'A record with this Certificate ID already exists.' });
    res.status(400).json({ message: err.message });
  }
});

// Archive - Delete a record
app.delete('/api/archive/delete/:id', authenticateToken, async (req, res) => {
  try {
    const record = await StudentArchive.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    broadcast('archive_updated', { action: 'delete', id: req.params.id });
    res.json({ message: 'Record deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Archive - Dashboard stats
app.get('/api/archive/stats', authenticateToken, async (req, res) => {
  try {
    const totalArchived = await StudentArchive.countDocuments();
    const totalVerifications = await VerificationLog.countDocuments();
    const recentSearches = await VerificationLog.countDocuments({
      searchedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const courseCounts = await StudentArchive.aggregate([
      { $group: { _id: '$courseName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json({ totalArchived, totalVerifications, recentSearches, courseCounts });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Archive - Bulk import (CSV/Excel)
const bulkImportStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'assets', 'imports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'import-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadBulkImport = multer({
  storage: bulkImportStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only CSV and Excel files are allowed'));
  }
});

app.post('/api/archive/bulk-import', authenticateToken, uploadBulkImport.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (rows.length === 0) return res.status(400).json({ message: 'File is empty' });

    const report = { total: rows.length, imported: 0, skipped: 0, errors: [] };

    // Column name mapping (flexible)
    const mapRow = (row) => {
      const get = (keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return String(row[k]).trim();
        }
        return undefined;
      };
      return {
        studentName: get(['studentName', 'Student Name', 'Name', 'student_name', 'STUDENT NAME']),
        fatherName: get(['fatherName', 'Father Name', 'father_name', 'FATHER NAME']),
        motherName: get(['motherName', 'Mother Name', 'mother_name', 'MOTHER NAME']),
        mobileNumber: get(['mobileNumber', 'Mobile', 'Phone', 'mobile_number', 'MOBILE']),
        enrollmentNumber: get(['enrollmentNumber', 'Enrollment No', 'enrollment_number', 'ENROLLMENT NO']),
        certificateId: get(['certificateId', 'Certificate ID', 'certificate_id', 'CERTIFICATE ID', 'Cert ID']),
        courseName: get(['courseName', 'Course', 'Course Name', 'course_name', 'COURSE']),
        batch: get(['batch', 'Batch', 'BATCH']),
        session: get(['session', 'Session', 'SESSION']),
        admissionDate: get(['admissionDate', 'Admission Date', 'admission_date', 'ADMISSION DATE']),
        completionDate: get(['completionDate', 'Completion Date', 'completion_date', 'COMPLETION DATE']),
        grade: get(['grade', 'Grade', 'GRADE']),
        resultStatus: get(['resultStatus', 'Result', 'Result Status', 'result_status', 'RESULT']),
        remarks: get(['remarks', 'Remarks', 'REMARKS'])
      };
    };

    for (let i = 0; i < rows.length; i++) {
      try {
        const mapped = mapRow(rows[i]);
        if (!mapped.studentName || !mapped.certificateId) {
          report.errors.push({ row: i + 2, message: 'Missing required fields (studentName or certificateId)' });
          report.skipped++;
          continue;
        }

        // Check for duplicates
        const exists = await StudentArchive.findOne({ certificateId: mapped.certificateId });
        if (exists) {
          report.errors.push({ row: i + 2, message: `Duplicate certificate ID: ${mapped.certificateId}` });
          report.skipped++;
          continue;
        }

        // Parse dates
        if (mapped.admissionDate) mapped.admissionDate = new Date(mapped.admissionDate);
        if (mapped.completionDate) mapped.completionDate = new Date(mapped.completionDate);

        // Validate resultStatus
        if (mapped.resultStatus && !['Pass', 'Fail', 'Distinction'].includes(mapped.resultStatus)) {
          mapped.resultStatus = 'Pass';
        }

        await StudentArchive.create(mapped);
        report.imported++;
      } catch (rowErr) {
        report.errors.push({ row: i + 2, message: rowErr.message });
        report.skipped++;
      }
    }

    broadcast('archive_updated', { action: 'bulk-import', count: report.imported });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Archive - Verification History
app.get('/api/archive/verification-history', authenticateToken, async (req, res) => {
  try {
    const logs = await VerificationLog.find().sort({ searchedAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});


// Enquiry System Routes
app.post('/api/student-enquiry/create', async (req, res) => {
  try {
    const enquiry = await StudentEnquiry.create(req.body);
    broadcast('student_enquiry_added', enquiry);
    res.status(201).json(enquiry);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/franchise-enquiry/create', async (req, res) => {
  try {
    const enquiry = await FranchiseEnquiry.create(req.body);
    broadcast('franchise_enquiry_added', enquiry);
    res.status(201).json(enquiry);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/student-enquiry', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'All' ? { status } : {};
    const enquiries = await StudentEnquiry.find(filter).sort({ created_at: -1 });
    res.json(enquiries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/student-enquiry/:id/status', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const enquiry = await StudentEnquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    broadcast('student_enquiry_updated', enquiry);
    res.json(enquiry);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/student-enquiry/:id', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    await StudentEnquiry.findByIdAndDelete(req.params.id);
    broadcast('student_enquiry_deleted', req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/franchise-enquiry', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'All' ? { status } : {};
    const enquiries = await FranchiseEnquiry.find(filter).sort({ created_at: -1 });
    res.json(enquiries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/franchise-enquiry/:id/status', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const enquiry = await FranchiseEnquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    broadcast('franchise_enquiry_updated', enquiry);
    res.json(enquiry);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/franchise-enquiry/:id', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    await FranchiseEnquiry.findByIdAndDelete(req.params.id);
    broadcast('franchise_enquiry_deleted', req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/enquiry/analytics', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studentTotal = await StudentEnquiry.countDocuments();
    const studentToday = await StudentEnquiry.countDocuments({ created_at: { $gte: today } });
    const studentConverted = await StudentEnquiry.countDocuments({ status: 'Converted' });

    const franchiseTotal = await FranchiseEnquiry.countDocuments();
    const franchiseApproved = await FranchiseEnquiry.countDocuments({ status: 'Approved' });
    const franchisePending = await FranchiseEnquiry.countDocuments({ status: 'Pending' });

    res.json({
      student: { total: studentTotal, today: studentToday, converted: studentConverted },
      franchise: { total: franchiseTotal, approved: franchiseApproved, pending: franchisePending }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

connectDB().then(() => {
  seedData();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
