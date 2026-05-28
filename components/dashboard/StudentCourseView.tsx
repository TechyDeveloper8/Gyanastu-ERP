import React, { useState, useEffect } from 'react';
import { StudentProfile, Course, Batch, StudyMaterial } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, FileText, Video, Download, CheckCircle, Clock, Upload, Link as LinkIcon, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../services/api';

const StudentCourseView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'syllabus' | 'materials' | 'assignments'>('syllabus');
  
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Hardcode assignments to empty array until backend is implemented
  const assignments: any[] = [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [students, courses, batches] = await Promise.all([
          api.getStudents(),
          api.getCourses(),
          api.getBatches()
        ]);
        
        const myProfile = (students as StudentProfile[]).find(s => s.email === user?.email);
        if (myProfile) {
          setProfile(myProfile);
          const myCourse = (courses as Course[]).find(c => c.id === myProfile.courseId) || null;
          setCourse(myCourse);
          const myBatch = (batches as Batch[]).find(b => b.id === myProfile.batchId) || null;
          setBatch(myBatch);
          
          if (myBatch) {
             const mats = await api.getMaterials(myBatch.id) as StudyMaterial[];
             setMaterials(mats);
          }
        }
      } catch (err) {
        console.error('Failed to load course view data', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) {
      fetchData();
    }
  }, [user]);

  if (loading) return <div className="flex justify-center items-center h-64"><Loader className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!course) return <div className="p-8 text-center text-gray-500">No course enrollment found.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Course Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-primary relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
             <img src={course.thumbnail} alt={course.title} className="w-24 h-24 rounded-lg border-4 border-white shadow-md object-cover" />
          </div>
        </div>
        <div className="pt-14 pb-6 px-6">
           <h1 className="text-2xl font-heading font-bold text-gray-800">{course.title}</h1>
           <p className="text-gray-500 mt-1">{course.description}</p>
           
           <div className="flex gap-4 mt-4 text-sm">
             <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">{course.level} Level</span>
             <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-bold">{course.duration}</span>
             <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold">Batch: {batch?.name || 'Pending'}</span>
           </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-xl shadow-sm">
        <button 
          onClick={() => setActiveTab('syllabus')}
          className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'syllabus' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <BookOpen className="w-4 h-4" /> Syllabus & Outcomes
        </button>
        <button 
          onClick={() => setActiveTab('materials')}
          className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'materials' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FileText className="w-4 h-4" /> Study Materials
        </button>
        <button 
          onClick={() => setActiveTab('assignments')}
          className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'assignments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <CheckCircle className="w-4 h-4" /> Assignments
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
             <div className="mb-6">
               <h3 className="font-bold text-lg text-gray-800 mb-4">Learning Outcomes</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {course.learningOutcomes.map((outcome, idx) => (
                   <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                     <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                     <span className="text-gray-700 text-sm">{outcome}</span>
                   </div>
                 ))}
               </div>
             </div>

             <div>
               <h3 className="font-bold text-lg text-gray-800 mb-4">Course Curriculum</h3>
               <div className="space-y-3">
                 {[1, 2, 3, 4].map((module) => (
                   <div key={module} className="border border-gray-200 rounded-lg p-4 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-primary uppercase">Module {module}</span>
                        <span className="text-xs text-gray-400">2 Weeks</span>
                      </div>
                      <h4 className="font-bold text-gray-800">Advanced Topics in {course.category} - Part {module}</h4>
                      <p className="text-sm text-gray-500 mt-1">Detailed exploration of core concepts and practical implementation strategies.</p>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-6">Class Resources</h3>
            {materials.length === 0 ? (
               <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                 <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p>No study materials uploaded for your batch yet.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {materials.map(mat => (
                   <div key={mat.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                          {mat.type === 'Video' ? <Video className="w-6 h-6" /> : 
                           mat.type === 'Link' ? <LinkIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">{mat.title}</h4>
                          <p className="text-xs text-gray-500">Posted on {mat.uploadDate} by {mat.uploadedBy}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-primary p-2">
                        <Download className="w-5 h-5" />
                      </button>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-6">Assessments & Projects</h3>
            {assignments.length === 0 ? (
               <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                 <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p>No active assignments due.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {assignments.map(assign => {
                    const submission = false;
                    const isLate = new Date(assign.dueDate) < new Date() && !submission;

                   return (
                     <div key={assign.id} className="border border-gray-200 rounded-lg p-6 hover:border-primary/30 transition-colors">
                       <div className="flex flex-col md:flex-row justify-between gap-4">
                         <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-lg text-gray-800">{assign.title}</h4>
                              {submission ? (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-bold">Submitted</span>
                              ) : isLate ? (
                                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold">Overdue</span>
                              ) : (
                                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-bold">Pending</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{assign.description}</p>
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {assign.dueDate}</span>
                              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Marks: {assign.totalMarks}</span>
                            </div>
                         </div>

                         <div className="md:text-right min-w-[150px]">
                           {submission ? (
                             <div className="bg-gray-50 p-3 rounded-lg text-left md:text-right">
                               <p className="text-xs text-gray-500 font-bold uppercase">Marks Obtained</p>
                               <p className="text-xl font-bold text-primary">Not Graded / {assign.totalMarks}</p>
                             </div>
                           ) : (
                             <button className="w-full md:w-auto bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 flex items-center justify-center gap-2">
                               <Upload className="w-4 h-4" /> Submit Work
                             </button>
                           )}
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentCourseView;