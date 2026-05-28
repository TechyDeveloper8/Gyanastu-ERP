import React, { useState, useEffect } from 'react';
import { Save, Globe, Edit3, Layout } from 'lucide-react';
import { api } from '../../services/api';

const CMSManager: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home_hero');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Initial Mock State used as fallback or skeleton
  const [content, setContent] = useState({
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
    },
    about_header: {
      title: "About Gyanastu",
      subtitle: "Building the next generation of technology leaders through innovation, practical learning, and industry integration."
    },
    about_vision: {
      vision: "To be the global benchmark in vocational training and skill development, creating a workforce that drives the digital economy.",
      mission: "To provide accessible, affordable, and high-quality education that bridges the gap between academic learning and industry requirements."
    },
    about_growth: {
      title: "Our Growth Story"
    },
    contact_header: {
      title: "Get in Touch",
      subtitle: "Have questions about our courses or franchises? We're here to help."
    },
    contact_info: {
      phone: "+91 98765 43210",
      email: "info@gyanastu.com",
      address: "123 Tech Park, Cyber City, New Delhi"
    },
    courses_header: {
      title: "Our Programs",
      subtitle: "Explore our wide range of industry-oriented courses designed to skill you up for the future."
    }
  });

  useEffect(() => {
    const fetchCMS = async () => {
      try {
        setFetching(true);
        const data: any = await api.getCMSContent();
        if (data && data.length > 0) {
          const cmsData: any = { ...content }; // start with default shape
          data.forEach((item: any) => {
            if (item.id && item.content) {
              cmsData[item.id] = { ...cmsData[item.id], ...item.content };
            }
          });
          setContent(cmsData);
        }
      } catch (err) {
        console.error("Failed to fetch CMS content:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchCMS();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Create an array of update promises for all sections
      const sections = Object.keys(content);
      await Promise.all(
        sections.map(sectionId =>
          api.updateCMSContent(sectionId, {
            id: sectionId,
            section: sectionId,
            content: content[sectionId as keyof typeof content]
          })
        )
      );
      alert("Website content updated successfully!");
    } catch (err) {
      console.error("Failed to save CMS content:", err);
      alert("Failed to save content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Website Content Manager (CMS)</h2>
          <p className="text-gray-500 text-sm">Update website text and settings dynamically without coding.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-accent text-white px-6 py-2 rounded-lg font-bold hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          {loading ? 'Publishing...' : <><Save className="w-4 h-4" /> Publish Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-700 mb-4 px-2">Pages & Sections</h3>
          <div className="space-y-2">
            <button
              onClick={() => setActiveSection('home_hero')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'home_hero' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Home (Hero)
            </button>
            <button
              onClick={() => setActiveSection('home_features')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'home_features' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Home (Features)
            </button>
            <button
              onClick={() => setActiveSection('home_courses')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'home_courses' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Home (Top Courses)
            </button>
            <button
              onClick={() => setActiveSection('home_franchise')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'home_franchise' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Home (Franchise)
            </button>
            <button
              onClick={() => setActiveSection('about_header')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'about_header' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              About (Header)
            </button>
            <button
              onClick={() => setActiveSection('about_vision')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'about_vision' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              About (Vision & Mission)
            </button>
            <button
              onClick={() => setActiveSection('about_growth')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'about_growth' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              About (Growth Story)
            </button>
            <button
              onClick={() => setActiveSection('contact_header')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'contact_header' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Contact (Header)
            </button>
            <button
              onClick={() => setActiveSection('contact_info')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'contact_info' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Contact (Details)
            </button>
            <button
              onClick={() => setActiveSection('courses_header')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'courses_header' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Courses (Header)
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-6 text-primary border-b border-gray-100 pb-4">
            <Edit3 className="w-5 h-5" />
            <h3 className="font-bold text-lg capitalize">{activeSection.replace('_', ' ')} Section</h3>
          </div>

          <div className="space-y-6">
            {Object.entries(content[activeSection as keyof typeof content]).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 capitalize">{key}</label>
                {value.toString().length > 50 ? (
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700"
                    value={value}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700"
                    value={value}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 bg-blue-50 p-4 rounded-lg flex items-start gap-3">
            <Globe className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-bold text-blue-800">Live Preview</p>
              <p className="text-xs text-blue-600">Changes made here will reflect instantly on the public website after clicking 'Publish Changes'.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSManager;