export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FRANCHISE_ADMIN = 'FRANCHISE_ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  franchiseId?: string; // If null, belongs to HQ
  avatarUrl?: string;
  createdAt?: string;
  phone?: string;
  address?: string;
}

export interface StudentProfile extends User {
  rollNumber: string;
  batchId: string;
  courseId: string;
  admissionDate: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended' | 'Pending';
  attendancePercentage: number;
  feesPaid: number;
  totalFees: number;
  guardianName?: string;
  aadhaarNumber?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  category: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  learningOutcomes: string[];
  price: number;
  thumbnail: string;
  syllabusUrl?: string;
  status: 'Active' | 'Inactive' | 'Archived';
  totalStudents?: number;
}

export interface Franchise {
  id: string;
  franchiseCode?: string;
  avatarUrl?: string;

  name: string;
  location: string;
  
  ownerName: string;
  dateOfBirth?: string;
  gender?: string;

  mobileNumber: string;
  alternateMobileNumber?: string;
  emailAddress: string;

  aadhaarNumber: string;
  gstNumber: string;
  panNumber?: string;
  establishmentYear?: string;

  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;

  adminId: string;
  adminName: string; // Deprecated or mapped to ownerName
  
  status: 'Active' | 'Pending' | 'Suspended';
  studentCount: number;
  revenue: number;
  joinedDate: string;
}

export interface Batch {
  id: string;
  batchName: string;
  courseId: string;
  courseName?: string;
  franchiseId: string;
  facultyId: string;
  facultyName?: string;
  timing: string; 
  startDate: string;
  endDate?: string;
  capacity: number;
  classroom?: string;
  remarks?: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  currentStudents: number;
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: 'PDF' | 'Video' | 'Assignment' | 'Link';
  url: string;
  courseId: string;
  batchId?: string; // Optional: restrict to specific batch
  uploadedBy: string; // Faculty Name
  uploadDate: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  batchId: string;
  courseId: string;
  totalMarks: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionDate: string;
  fileUrl: string;
  status: 'Pending' | 'Submitted' | 'Graded';
  marksObtained?: number;
  feedback?: string;
}

export interface FeeTransaction {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  type: 'Tuition' | 'Exam' | 'Late Fee';
  status: 'Paid' | 'Pending' | 'Failed';
  invoiceUrl?: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  issueDate: string;
  validUntil?: string;
  qrCodeUrl: string;
  status: 'Valid' | 'Revoked' | 'Expired';
  generatedBy: string; // Admin ID
}

export interface AttendanceRecord {
  id: string;
  date: string;
  batchId: string;
  batchName?: string;
  studentId: string;
  studentName: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
  remarks?: string;
  markedBy?: string;
}


export interface StudentEnquiry {
  id: string;
  student_name: string;
  mobile: string;
  email: string;
  course_interest?: string;
  address?: string;
  message?: string;
  source: string;
  status: 'New' | 'Contacted' | 'Converted' | 'Closed';
  created_at: string;
  updated_at: string;
}

export interface FranchiseEnquiry {
  id: string;
  full_name: string;
  mobile: string;
  email: string;
  city?: string;
  state?: string;
  business_experience?: string;
  investment_budget?: string;
  location_interest?: string;
  message?: string;
  source: string;
  status: 'New' | 'Contacted' | 'Approved' | 'Pending' | 'Closed';
  created_at: string;
  updated_at: string;
}

export interface EnquiryAnalytics {
  student: {
    total: number;
    today: number;
    converted: number;
  };
  franchise: {
    total: number;
    approved: number;
    pending: number;
  };
}

export interface CMSContent {
  id: string;
  section: 'Home_Hero' | 'About_Vision' | 'Contact_Info';
  content: Record<string, string>; // Flexible JSON structure
  lastUpdated: string;
}

export interface KPI {
  label: string;
  value: string | number;
  change?: string;
  icon?: string;
  color?: string;
}

export interface ArchiveStudent {
  id: string;
  studentName: string;
  fatherName?: string;
  motherName?: string;
  mobileNumber?: string;
  enrollmentNumber?: string;
  certificateId: string;
  courseName?: string;
  batch?: string;
  session?: string;
  admissionDate?: string;
  completionDate?: string;
  grade?: string;
  resultStatus?: 'Pass' | 'Fail' | 'Distinction';
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerificationLogEntry {
  id: string;
  certificateId: string;
  searchedAt: string;
  found: boolean;
  source: 'active' | 'archive' | 'not_found';
}

export interface ArchiveStats {
  totalArchived: number;
  totalVerifications: number;
  recentSearches: number;
  courseCounts: { _id: string; count: number }[];
}

export interface BulkImportReport {
  total: number;
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}