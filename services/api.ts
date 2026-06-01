import { User, StudentProfile } from '../types';

export const API_BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = { ...options, headers };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (response.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.hash.includes('/login')) {
         window.location.href = '/#/login';
      }
      throw new Error('Session expired');
    }
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Request Failed');
    return data;
  } catch (error: any) {
    console.error('API Request Error:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
       throw new Error('Server unreachable. Please ensure the backend is running.');
    }
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  changePassword: (data: any) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data: { username: string }) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  verifyOTP: (data: { username: string, otp: string }) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data: { username: string, otp: string, newPassword: string }) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/me'),
  
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),


  // Students
  getStudents: (franchiseId?: string) => request(`/students${franchiseId ? `?franchiseId=${franchiseId}` : ''}`),
  createStudent: (data: any) => request('/students', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  updateStudent: (id: string, data: any) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id: string) => request(`/students/${id}`, { method: 'DELETE' }),
  
  // Franchises
  getFranchises: () => request('/franchises'),
  createFranchise: (data: any) => request(`/franchises`, { method: 'POST', body: JSON.stringify(data) }),
  updateFranchiseStatus: (id: string, status: string) => request(`/franchises/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateFranchise: (id: string, data: any) => request(`/franchises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFranchise: (id: string) => request(`/franchises/${id}`, { method: 'DELETE' }),
  
  // Courses
  getCourses: () => request('/courses'),
  createCourse: (data: any) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: any) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: string) => request(`/courses/${id}`, { method: 'DELETE' }),
  
  // Batches
  getBatches: (franchiseId?: string, facultyId?: string) => {
    const params = new URLSearchParams();
    if (franchiseId) params.append('franchiseId', franchiseId);
    if (facultyId) params.append('facultyId', facultyId);
    return request(`/batches?${params.toString()}`);
  },
  getBatchStudents: (id: string) => request(`/batches/${id}/students`),
  createBatch: (data: any) => request(`/batches`, { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (id: string, data: any) => request(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBatch: (id: string) => request(`/batches/${id}`, { method: 'DELETE' }),
  
  // Faculty
  getFaculty: (franchiseId?: string) => request(`/faculty${franchiseId ? `?franchiseId=${franchiseId}` : ''}`),
  createFaculty: (data: any) => request(`/faculty`, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  deleteFaculty: (id: string) => request(`/faculty/${id}`, { method: 'DELETE' }),
  
  // Attendance
  getAttendance: (params?: { studentId?: string, batchId?: string, date?: string, startDate?: string, endDate?: string }) => {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.studentId) q.append('studentId', params.studentId);
      if (params.batchId) q.append('batchId', params.batchId);
      if (params.date) q.append('date', params.date);
      if (params.startDate) q.append('startDate', params.startDate);
      if (params.endDate) q.append('endDate', params.endDate);
      query = q.toString() ? `?${q.toString()}` : '';
    }
    return request(`/attendance${query}`);
  },
  markAttendance: (data: { batchId: string, date: string, records: any[] }) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getStudentAttendanceReport: (franchiseId?: string) => request(`/attendance/reports/student${franchiseId ? `?franchiseId=${franchiseId}` : ''}`),
  getBatchAttendanceReport: (franchiseId?: string) => request(`/attendance/reports/batch${franchiseId ? `?franchiseId=${franchiseId}` : ''}`),
  
  // Fees
  getFees: (studentId?: string) => request(`/fees${studentId ? `?studentId=${studentId}` : ''}`),
  collectFee: (data: { studentId: string, amount: number, type: string }) => request('/fees', { method: 'POST', body: JSON.stringify(data) }),
  
  // Certificates
  getCertificates: () => request('/certificates'),
  generateCertificate: (data: { studentId: string, courseId: string, generatedBy: string }) => request('/certificates', { method: 'POST', body: JSON.stringify(data) }),
  deleteCertificate: (id: string) => request(`/certificates/${id}`, { method: 'DELETE' }),
  verifyCertificate: (id: string) => request(`/certificates/verify/${id}`),
  uploadCertificateTemplate: async (file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('template', file);
    const response = await fetch(`${API_BASE_URL}/certificates/template`, {
      method: 'POST',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Template upload failed');
    return data;
  },
  
  // Notifications & CMS
  getNotifications: () => request('/notifications'),
  getStudentEnquiries: (status?: string) => request(`/student-enquiry${status ? `?status=${status}` : ''}`),
  createStudentEnquiry: (data: any) => request('/student-enquiry/create', { method: 'POST', body: JSON.stringify(data) }),
  updateStudentEnquiryStatus: (id: string, status: string) => request(`/student-enquiry/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteStudentEnquiry: (id: string) => request(`/student-enquiry/${id}`, { method: 'DELETE' }),

  getFranchiseEnquiries: (status?: string) => request(`/franchise-enquiry${status ? `?status=${status}` : ''}`),
  createFranchiseEnquiry: (data: any) => request('/franchise-enquiry/create', { method: 'POST', body: JSON.stringify(data) }),
  updateFranchiseEnquiryStatus: (id: string, status: string) => request(`/franchise-enquiry/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteFranchiseEnquiry: (id: string) => request(`/franchise-enquiry/${id}`, { method: 'DELETE' }),

  getEnquiryAnalytics: () => request('/enquiry/analytics'),
  getCMSContent: () => request('/cms'),
  updateCMSContent: (id: string, data: any) => request(`/cms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Materials
  getMaterials: (batchId?: string) => request(`/materials${batchId ? `?batchId=${batchId}` : ''}`),
  createMaterial: (data: any) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  deleteMaterial: (id: string) => request(`/materials/${id}`, { method: 'DELETE' }),

  // Archive (Old Student Records)
  getArchiveStudents: (params?: { search?: string; page?: number; limit?: number; course?: string; session?: string; batch?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.course) q.append('course', params.course);
    if (params?.session) q.append('session', params.session);
    if (params?.batch) q.append('batch', params.batch);
    const query = q.toString() ? `?${q.toString()}` : '';
    return request(`/archive/list${query}`);
  },
  addArchiveStudent: (data: any) => request('/archive/add', { method: 'POST', body: JSON.stringify(data) }),
  updateArchiveStudent: (id: string, data: any) => request(`/archive/update/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArchiveStudent: (id: string) => request(`/archive/delete/${id}`, { method: 'DELETE' }),
  getArchiveStats: () => request('/archive/stats'),
  bulkImportArchive: async (file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/archive/bulk-import`, {
      method: 'POST',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Import failed');
    return data;
  },
  getVerificationHistory: () => request('/archive/verification-history'),
};
