import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { Loader, ArrowLeft, Clock, BarChart, BookOpen, Download, FileText } from 'lucide-react';

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Using the new getCourseById API method
        const data = await api.getCourseById(id) as Course;
        setCourse(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load course details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Course not found'}</h2>
        <Link to="/courses" className="text-primary hover:underline flex items-center gap-2 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={course.thumbnail || 'https://placehold.co/1200x600?text=Course+Image'} 
            alt={course.title}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/40"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <Link to="/courses" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Programs
          </Link>
          
          <div className="max-w-3xl">
            <div className="inline-block px-3 py-1 bg-accent rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
              {course.category}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight">
              {course.title}
            </h1>
            
            <div className="flex flex-wrap gap-6 text-sm font-medium">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <BarChart className="w-5 h-5 text-accent" />
                <span>Level: {course.level || 'Beginner'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Clock className="w-5 h-5 text-accent" />
                <span>Duration: {course.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Course Fee</span>
            <span className="text-4xl font-heading font-bold text-primary">Rs. {(course.price || 0).toLocaleString()}</span>
          </div>
          <div className="w-full md:w-auto">
            <Link to="/contact" className="block w-full md:w-auto text-center bg-accent hover:bg-accent-hover text-white font-bold py-4 px-10 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-1">
              Enroll Now
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column (Details) */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Description */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-heading font-bold text-primary mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-accent" />
                About This Course
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                {course.description}
              </p>
            </section>

            {/* Learning Outcomes */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-heading font-bold text-primary mb-6">What You Will Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="mt-1 w-2 h-2 rounded-full bg-accent flex-shrink-0"></div>
                      <span className="text-gray-700">{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Syllabus/Brochure PDF Viewer */}
            {course.syllabusUrl && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-heading font-bold text-primary flex items-center gap-3">
                    <FileText className="w-6 h-6 text-accent" />
                    Course Brochure & Syllabus
                  </h2>
                  <a 
                    href={course.syllabusUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent transition-colors bg-primary/5 px-4 py-2 rounded-lg"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
                </div>
                
                <div className="w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200" style={{ height: '700px' }}>
                  <object 
                    data={course.syllabusUrl} 
                    type="application/pdf" 
                    width="100%" 
                    height="100%"
                    className="w-full h-full"
                  >
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <FileText className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Your browser does not support inline PDFs.</p>
                      <a href={course.syllabusUrl} className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                        Download the Syllabus
                      </a>
                    </div>
                  </object>
                </div>
              </section>
            )}
            
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Quick Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-primary border-b border-gray-100 pb-4 mb-4">Course Details</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-semibold text-gray-800">{course.duration}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-500">Skill Level</span>
                    <span className="font-semibold text-gray-800">{course.level || 'Beginner'}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-500">Category</span>
                    <span className="font-semibold text-gray-800 bg-secondary/30 px-2 py-1 rounded text-sm">{course.category}</span>
                  </li>
                </ul>
              </div>

              {/* Need Help */}
              <div className="bg-gradient-to-br from-primary to-primary/90 text-white rounded-2xl shadow-lg p-6 text-center">
                <h3 className="text-xl font-heading font-bold mb-2">Need Guidance?</h3>
                <p className="text-white/80 text-sm mb-6">Our academic counselors are here to help you choose the right path.</p>
                <Link to="/contact" className="inline-block w-full bg-white text-primary font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors">
                  Contact Us
                </Link>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
