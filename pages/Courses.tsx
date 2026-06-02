import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Search, Filter, Loader } from 'lucide-react';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');

  const [cms, setCms] = useState({
    courses_header: {
      title: "Our Programs",
      subtitle: "Explore our wide range of industry-oriented courses designed to skill you up for the future."
    }
  });

  const fetchCMS = async () => {
    try {
      const data: any = await api.getCMSContent();
      const secData = data.find((d: any) => d.id === 'courses_header')?.content;
      if (secData) setCms({ courses_header: secData });
    } catch (err) {}
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data: any = await api.getCourses();
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCMS();
    socket.on('course_added', fetchCourses);
    socket.on('course_updated', fetchCourses);
    socket.on('course_deleted', fetchCourses);
    socket.on('cms_updated', fetchCMS);
    return () => {
      socket.off('course_added', fetchCourses);
      socket.off('course_updated', fetchCourses);
      socket.off('course_deleted', fetchCourses);
      socket.off('cms_updated', fetchCMS);
    };
  }, []);

  const filteredCourses = courses.filter(course => {
    // only show active courses to public
    if (course.status && course.status !== 'Active') return false;

    const matchesSearch = (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (course.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const courseLevel = course.level || 'Beginner';
    const matchesLevel = filterLevel === 'All' || courseLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="py-12 md:py-20 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-4">{cms.courses_header.title}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">{cms.courses_header.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter:</span>
            </div>
            <select 
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {loading && courses.length === 0 ? (
          <div className="py-20 flex justify-center"><Loader className="animate-spin text-primary w-8 h-8" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <div key={course.id || course._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
                  <div className="relative overflow-hidden h-56">
                    <img src={course.thumbnail || 'https://placehold.co/400x250'} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                      {course.category}
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-heading font-bold text-primary mb-3">{course.title}</h3>
                    <div className="flex gap-2 mb-4">
                       <span className="text-xs bg-secondary text-gray-600 px-2 py-1 rounded">{course.level || 'Beginner'}</span>
                       <span className="text-xs bg-secondary text-gray-600 px-2 py-1 rounded">{course.duration}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-6 flex-grow">{course.description}</p>
                    
                    {(course.learningOutcomes && course.learningOutcomes.length > 0) && (
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">What you'll learn:</h4>
                        <div className="flex flex-wrap gap-1">
                          {course.learningOutcomes.slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] border border-gray-200 px-2 py-0.5 rounded-full text-gray-500">{tag}</span>
                          ))}
                          {course.learningOutcomes.length > 3 && <span className="text-[10px] text-gray-400 px-1">+{course.learningOutcomes.length - 3} more</span>}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                      <span className="text-2xl font-heading font-bold text-accent">₹{(course.price || 0).toLocaleString()}</span>
                      <button className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <h3 className="text-xl text-gray-500">No courses found matching your criteria.</h3>
                <button 
                  onClick={() => {setSearchTerm(''); setFilterLevel('All');}}
                  className="mt-4 text-accent font-bold hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;