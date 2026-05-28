import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, Award, TrendingUp } from 'lucide-react';
import { Course } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';

const Home: React.FC = () => {
  const [cms, setCms] = useState({
    home_hero: {
      welcome_text: "Welcome to Gyanastu",
      title: "Shape Your Future with Industry-Ready Skills",
      subtitle: "We provide comprehensive tech education, practical training, and recognized certifications to help you launch a successful career.",
      buttonText: "Explore Courses"
    },
    home_features: {
      title: "Why Choose Gyanastu?",
      subtitle: "We focus on holistic development, combining theoretical knowledge with practical application."
    },
    home_courses: {
      title: "Our Top Courses",
      subtitle: "Explore our most popular training programs."
    },
    home_franchise: {
      title: "Start Your Own Education Franchise",
      subtitle: "Partner with Gyanastu and build a profitable education business with our proven model and support system.",
      button_text: "Become a Partner"
    }
  });
  const [courses, setCourses] = useState<Course[]>([]);

  const fetchCourses = async () => {
    try {
      const data = await api.getCourses() as Course[];
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses', err);
    }
  };

  const fetchCMS = async () => {
    try {
      const data: any = await api.getCMSContent();
      setCms(prev => {
        const next = { ...prev };
        ['home_hero', 'home_features', 'home_courses', 'home_franchise'].forEach(sec => {
          const secData = data.find((d: any) => d.id === sec)?.content;
          if (secData) next[sec as keyof typeof next] = { ...next[sec as keyof typeof next], ...secData };
        });
        return next;
      });
    } catch (err) {}
  };

  useEffect(() => {
    fetchCMS();
    fetchCourses();
    socket.on('cms_updated', fetchCMS);
    return () => {
      socket.off('cms_updated', fetchCMS);
    };
  }, []);
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <span className="text-accent font-bold tracking-widest uppercase text-sm mb-4 block">{cms.home_hero.welcome_text}</span>
            <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight mb-6">
              {cms.home_hero.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl">
              {cms.home_hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/courses" className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-md font-bold transition-all text-center flex items-center justify-center gap-2">
                {cms.home_hero.buttonText} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/contact" className="bg-transparent border border-white hover:bg-white hover:text-primary text-white px-8 py-3 rounded-md font-bold transition-all text-center">
                Book Counseling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">{cms.home_features.title}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{cms.home_features.subtitle}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <CheckCircle className="w-10 h-10 text-accent" />, title: "Expert Faculty", desc: "Learn from industry veterans with years of real-world experience." },
              { icon: <Award className="w-10 h-10 text-accent" />, title: "Recognized Certification", desc: "Our certificates are valued by top employers across the globe." },
              { icon: <TrendingUp className="w-10 h-10 text-accent" />, title: "Career Support", desc: "100% placement assistance and interview preparation guidance." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-secondary p-8 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-heading font-bold text-primary mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
           <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-2">{cms.home_courses.title}</h2>
              <p className="text-gray-600">{cms.home_courses.subtitle}</p>
            </div>
            <Link to="/courses" className="hidden md:flex items-center gap-2 text-accent font-bold hover:text-accent-hover transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.length === 0 ? (
               <div className="col-span-1 md:col-span-3 text-center py-10 text-gray-500">Loading courses...</div>
            ) : courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className="relative overflow-hidden h-48">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                    {course.level}
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">{course.category}</div>
                  <h3 className="text-xl font-heading font-bold text-primary mb-3">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-primary font-bold">₹{course.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">{course.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
           <div className="mt-8 text-center md:hidden">
            <Link to="/courses" className="text-accent font-bold">View All Courses</Link>
          </div>
        </div>
      </section>

      {/* Franchise CTA */}
      <section className="py-20 bg-primary text-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">{cms.home_franchise.title}</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            {cms.home_franchise.subtitle}
          </p>
          <Link to="/franchise" className="bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-md font-bold transition-all inline-flex items-center gap-2">
            {cms.home_franchise.button_text} <Users className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;