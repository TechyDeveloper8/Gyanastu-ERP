import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import {
  Book, Users, LayoutDashboard, DollarSign, Award,
  Settings, Shield, LogOut, Briefcase, FileText, Menu, X, CreditCard, Calendar, Activity, AlertCircle, ArrowRight, User as UserIcon, PieChart, MessageSquare, Globe, Archive, Upload, History
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import FranchiseManager from '../components/dashboard/FranchiseManager';
import StudentManager from '../components/dashboard/StudentManager';
import CertificateManager from '../components/dashboard/CertificateManager';
import IDCardView from '../components/dashboard/IDCardView';
import CourseManager from '../components/dashboard/CourseManager';

import FacultyManager from '../components/dashboard/FacultyManager';
import FranchiseOverview from '../components/dashboard/FranchiseOverview';
import FeeManager from '../components/dashboard/FeeManager';
import FacultyOverview from '../components/dashboard/FacultyOverview';
import AttendanceManager from '../components/dashboard/AttendanceManager';
import StudyMaterialManager from '../components/dashboard/StudyMaterialManager';
import MyBatches from '../components/dashboard/MyBatches';
import BatchManager from '../components/dashboard/BatchManager';
import BatchAllocation from '../components/dashboard/BatchAllocation';
import AttendanceReports from '../components/dashboard/AttendanceReports';
import StudentOverview from '../components/dashboard/StudentOverview';
import StudentCourseView from '../components/dashboard/StudentCourseView';
import StudentAttendanceView from '../components/dashboard/StudentAttendanceView';
import StudentFeeView from '../components/dashboard/StudentFeeView';
import StudentCertificateView from '../components/dashboard/StudentCertificateView';
import StudentProfileView from '../components/dashboard/StudentProfileView';
import CMSManager from '../components/dashboard/CMSManager';
import StudentEnquiryManager from '../components/dashboard/StudentEnquiryManager';
import FranchiseEnquiryManager from '../components/dashboard/FranchiseEnquiryManager';
import EnquiryAnalytics from '../components/dashboard/EnquiryAnalytics';
import ReportsAnalytics from '../components/dashboard/ReportsAnalytics';
import FacultyIDCardView from '../components/dashboard/FacultyIDCardView';
import ArchiveStudentList from '../components/dashboard/ArchiveStudentList';
import ArchiveBulkImport from '../components/dashboard/ArchiveBulkImport';
import ArchiveVerificationHistory from '../components/dashboard/ArchiveVerificationHistory';
import ArchiveDashboard from '../components/dashboard/ArchiveDashboard';

const OverviewStats = ({ role, setTab }: { role: UserRole, setTab: (t: string) => void }) => {
  const [stats, setStats] = useState({
    students: 0, franchises: 0, courses: 0, certificates: 0, revenue: 0, recentAdmissions: [], chartData: []
  });

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats() as typeof stats;
      setStats(data);
    } catch (err) { console.error('Stats fetch failed', err); }
  };

  useEffect(() => {
    fetchStats();
    socket.on('dashboard_update', fetchStats);
    socket.on('fee_paid', fetchStats);
    socket.on('student_added', fetchStats);
    socket.on('course_added', fetchStats);
    socket.on('franchise_added', fetchStats);
    return () => {
      socket.off('dashboard_update', fetchStats);
      socket.off('fee_paid', fetchStats);
      socket.off('student_added', fetchStats);
      socket.off('course_added', fetchStats);
      socket.off('franchise_added', fetchStats);
    };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary">
          Welcome back, {role === UserRole.SUPER_ADMIN ? 'Administrator' : role === UserRole.FACULTY ? 'Instructor' : 'Partner'}
        </h2>
        <p className="text-gray-500">Here's what's happening in your institute today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><Users /></div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Total Students</p>
              <h3 className="text-2xl font-bold">{stats.students}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg text-green-600"><DollarSign /></div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Revenue</p>
              <h3 className="text-2xl font-bold">₹{(stats.revenue || 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><Briefcase /></div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Total Courses</p>
              <h3 className="text-2xl font-bold">{stats.courses}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg text-orange-600"><Award /></div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Certifications</p>
              <h3 className="text-2xl font-bold">{stats.certificates}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Revenue Overview (Last 5 Days)</h3>
          <select className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs">
            <option>All Franchises</option>
          </select>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#24346D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null;

  const renderContent = () => {
    if (activeTab === 'overview') {
      if (user.role === UserRole.FRANCHISE_ADMIN && user.franchiseId) return <FranchiseOverview franchiseId={user.franchiseId} />;
      if (user.role === UserRole.FACULTY) return <FacultyOverview />;
      if (user.role === UserRole.STUDENT) return <StudentOverview />;
      return <OverviewStats role={user.role} setTab={setActiveTab} />;
    }

    switch (activeTab) {
      case 'franchises': return <FranchiseManager />;
      case 'students': return <StudentManager userRole={user.role} franchiseId={user.franchiseId} />;
      case 'courses': return user.role === UserRole.SUPER_ADMIN ? <CourseManager /> : <div>Access Denied</div>;
      case 'faculty': return <FacultyManager />;
      case 'certificates': return user.role === UserRole.SUPER_ADMIN ? <CertificateManager /> : <div>Access Denied</div>;

      case 'fees': return <FeeManager franchiseId={user.franchiseId} />;
      case 'cms': return user.role === UserRole.SUPER_ADMIN ? <CMSManager /> : <div>Access Denied</div>;
      case 'enquiries-student': return user.role === UserRole.SUPER_ADMIN ? <StudentEnquiryManager /> : <div>Access Denied</div>;
      case 'enquiries-franchise': return user.role === UserRole.SUPER_ADMIN ? <FranchiseEnquiryManager /> : <div>Access Denied</div>;
      case 'enquiries-analytics': return user.role === UserRole.SUPER_ADMIN ? <EnquiryAnalytics /> : <div>Access Denied</div>;
      case 'reports': return <ReportsAnalytics />;
      case 'batches': return user.role === UserRole.FRANCHISE_ADMIN ? <BatchManager /> : <div>Access Denied</div>;
      case 'batch-allocation': return user.role === UserRole.FRANCHISE_ADMIN ? <BatchAllocation /> : <div>Access Denied</div>;
      case 'attendance-reports': return <AttendanceReports />;
      case 'attendance': return <AttendanceManager />;
      case 'materials': return <StudyMaterialManager />;
      case 'my-batches': return <MyBatches />;
      case 'my-courses': return <StudentCourseView />;
      case 'my-attendance': return <StudentAttendanceView />;
      case 'my-fees': return <StudentFeeView />;
      case 'my-certificates': return <StudentCertificateView />;
      case 'id-card': return <IDCardView student={user as any} />;
      case 'faculty-id-card': return <FacultyIDCardView faculty={user as any} />;
      case 'archive-list': return <ArchiveStudentList />;
      case 'archive-import': return <ArchiveBulkImport />;
      case 'archive-history': return <ArchiveVerificationHistory />;
      case 'archive-dashboard': return <ArchiveDashboard />;
      case 'profile': return <StudentProfileView />;
      default: return <div className="p-10 text-center text-gray-500">Module under maintenance.</div>;
    }
  };

  const getNavItems = () => {
    const common = [{ id: 'overview', label: 'Dashboard', icon: <LayoutDashboard /> }];
    if (user.role === UserRole.SUPER_ADMIN) {
      return [...common,
      { id: 'franchises', label: 'Franchises', icon: <Shield /> },
      { id: 'students', label: 'Students', icon: <Users /> },
      { id: 'divider-enquiries', label: 'ENQUIRIES / CRM', icon: null, isDivider: true },
      { id: 'enquiries-student', label: 'Student Enquiries', icon: <MessageSquare /> },
      { id: 'enquiries-franchise', label: 'Franchise Enquiries', icon: <Briefcase /> },
      { id: 'enquiries-analytics', label: 'Enquiry Analytics', icon: <PieChart /> },
      { id: 'divider-main', label: 'MAIN SYSTEM', icon: null, isDivider: true },
      { id: 'courses', label: 'Courses', icon: <Book /> },
      { id: 'faculty', label: 'Faculty', icon: <Briefcase /> },
      { id: 'certificates', label: 'Certificates', icon: <Award /> },
      { id: 'reports', label: 'Reports', icon: <PieChart /> },
      { id: 'attendance-reports', label: 'Attendance Reports', icon: <Calendar /> },
      { id: 'cms', label: 'Website CMS', icon: <Globe /> },
      { id: 'divider-archive', label: 'OLD STUDENT RECORDS', icon: null, isDivider: true },
      { id: 'archive-list', label: 'Student Archive', icon: <Archive /> },
      { id: 'archive-import', label: 'Bulk Import', icon: <Upload /> },
      { id: 'archive-history', label: 'Verification Log', icon: <History /> },
      ];
    }
    if (user.role === UserRole.FRANCHISE_ADMIN) {
      return [...common,
      { id: 'students', label: 'My Students', icon: <Users /> },
      { id: 'faculty', label: 'My Faculty', icon: <Briefcase /> },
      { id: 'fees', label: 'Fee Management', icon: <DollarSign /> },
      { id: 'divider-academic', label: 'ACADEMIC MANAGEMENT', icon: null, isDivider: true },
      { id: 'batches', label: 'Batch Management', icon: <Book /> },
      { id: 'batch-allocation', label: 'Student Batch Allocation', icon: <Users /> },
      { id: 'attendance', label: 'Attendance Management', icon: <Calendar /> },
      { id: 'attendance-reports', label: 'Attendance Reports', icon: <PieChart /> },
      ];
    }
    if (user.role === UserRole.FACULTY) {
      return [...common,
      { id: 'my-batches', label: 'My Batches', icon: <Users /> },
      { id: 'attendance', label: 'Mark Attendance', icon: <Calendar /> },
      { id: 'materials', label: 'Study Materials', icon: <Book /> },
      { id: 'faculty-id-card', label: 'Digital ID Card', icon: <CreditCard /> },
      ];
    }
    if (user.role === UserRole.STUDENT) {
      return [...common,
      { id: 'my-courses', label: 'My Course', icon: <Book /> },
      { id: 'my-attendance', label: 'Attendance', icon: <Calendar /> },
      { id: 'my-fees', label: 'Fees & Payment', icon: <DollarSign /> },
      { id: 'id-card', label: 'Digital ID Card', icon: <CreditCard /> },
      { id: 'my-certificates', label: 'Certificates', icon: <Award /> },
      { id: 'profile', label: 'My Profile', icon: <UserIcon /> },
      ];
    }
    return common;
  };

  return (
    <div className="min-h-screen bg-secondary flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex-shrink-0 shadow-xl`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg"><Book className="w-6 h-6 text-primary" /></div>
            <div>
              <h1 className="font-heading font-bold text-lg tracking-wide">ERP Portal</h1>
              <p className="text-[10px] text-gray-300 uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
            {getNavItems().map(item => {
              if ((item as any).isDivider) {
                return (
                  <div key={item.id} className="pt-4 pb-1 px-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                  </div>
                );
              }
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-accent text-white shadow-md font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}>
                  {item.icon} {item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-3 mb-4">
              <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full border-2 border-accent" />
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-bold transition-colors">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-grow flex flex-col min-h-screen">
        <header className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="text-primary"><Menu /></button>
          <span className="font-heading font-bold text-primary">Gyanastu ERP</span>
          <div className="w-8"></div>
        </header>
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;