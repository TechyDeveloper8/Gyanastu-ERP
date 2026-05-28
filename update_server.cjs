const fs = require('fs');
let content = fs.readFileSync('backend/server.js', 'utf8');

// 1. Change imports
content = content.replace("const Enquiry = require('./models/Enquiry');", "const StudentEnquiry = require('./models/StudentEnquiry');\nconst FranchiseEnquiry = require('./models/FranchiseEnquiry');");

// 2. Add authorizeRole middleware
const authMiddleware = `
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    next();
  };
};
`;

if (content.includes('const authenticateToken')) {
  content = content.replace('const authenticateToken = (req, res, next) => {', authMiddleware + '\nconst authenticateToken = (req, res, next) => {\n');
} else if (content.includes('function authenticateToken')) {
  content = content.replace('function authenticateToken', authMiddleware + '\nfunction authenticateToken');
} else {
  const bothMiddlewares = `
const authenticateToken = (req, res, next) => {
  let token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer')) return res.status(401).json({ message: 'No token' });
  try {
    token = token.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gyanastu_super_secret_key_2024!!');
    req.user = decoded;
    next();
  } catch (err) { res.status(401).json({ message: 'Not authorized' }); }
};
` + authMiddleware;
  content = content.replace('// --- API ROUTES ---', '// --- API ROUTES ---\n' + bothMiddlewares);
}

// 3. Remove old enquiry route
content = content.replace(/app\.get\('\/api\/enquiries',.*?}\);\r?\n?/s, '');

// 4. Add new Enquiry routes before connectDB
const newRoutes = `
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

`;

content = content.replace('connectDB().then(() => {', newRoutes + 'connectDB().then(() => {');
fs.writeFileSync('backend/server.js', content);
console.log('Modified server.js');
