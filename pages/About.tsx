import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';

const About: React.FC = () => {
  const [cms, setCms] = useState({
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
    }
  });

  const fetchCMS = async () => {
    try {
      const data: any = await api.getCMSContent();
      setCms(prev => {
        const next = { ...prev };
        ['about_header', 'about_vision', 'about_growth'].forEach(sec => {
          const secData = data.find((d: any) => d.id === sec)?.content;
          if (secData) next[sec as keyof typeof next] = { ...next[sec as keyof typeof next], ...secData };
        });
        return next;
      });
    } catch (err) {}
  };

  useEffect(() => {
    fetchCMS();
    socket.on('cms_updated', fetchCMS);
    return () => {
      socket.off('cms_updated', fetchCMS);
    };
  }, []);
  return (
    <div className="animate-fade-in">
      <section className="bg-primary text-white py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">{cms.about_header.title}</h1>
          <p className="text-xl max-w-3xl mx-auto text-gray-300">{cms.about_header.subtitle}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
             <div>
               <img 
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                alt="Our Campus" 
                className="rounded-2xl shadow-2xl"
               />
             </div>
             <div>
               <h2 className="text-3xl font-heading font-bold text-primary mb-6">Our Vision & Mission</h2>
               <div className="space-y-6">
                 <div>
                   <h3 className="text-xl font-bold text-accent mb-2">Vision</h3>
                   <p className="text-gray-600 leading-relaxed">{cms.about_vision.vision}</p>
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-accent mb-2">Mission</h3>
                   <p className="text-gray-600 leading-relaxed">{cms.about_vision.mission}</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
         <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold text-primary mb-12">{cms.about_growth.title}</h2>
            <div className="max-w-4xl mx-auto relative">
               <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
               
               {[
                 { year: '2018', title: 'Inception', desc: 'Started with a small center in New Delhi with 20 students.' },
                 { year: '2020', title: 'Digital Expansion', desc: 'Launched online learning platform and ERP system during the pandemic.' },
                 { year: '2022', title: 'Franchise Model', desc: 'Expanded to 10+ cities through our franchise partner network.' },
                 { year: '2024', title: 'Going Global', desc: 'Aiming for international accreditation and 100+ centers.' }
               ].map((item, idx) => (
                 <div key={idx} className={`relative flex items-center justify-between mb-8 ${idx % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                    <div className="w-5/12"></div>
                    <div className="z-10 bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-4 border-white shadow-md">
                      {idx + 1}
                    </div>
                    <div className={`w-5/12 bg-secondary p-6 rounded-lg shadow-sm text-left ${idx % 2 === 0 ? 'text-right' : ''}`}>
                       <span className="text-accent font-bold text-lg block mb-1">{item.year}</span>
                       <h3 className="font-bold text-primary mb-2">{item.title}</h3>
                       <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}

export default About;