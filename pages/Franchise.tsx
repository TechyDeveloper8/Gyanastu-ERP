import React, { useState } from 'react';
import { CheckCircle, Briefcase, DollarSign, Users } from 'lucide-react';
import { api } from '../services/api';

const Franchise: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    investment: '5-10L',
    city: '',
    state: '',
    experience: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createFranchiseEnquiry({
        full_name: formData.name,
        email: formData.email,
        mobile: formData.phone,
        location_interest: formData.location,
        investment_budget: formData.investment,
        city: formData.city,
        state: formData.state,
        business_experience: formData.experience,
        message: formData.message,
        source: 'Website Franchise Page'
      });
      setSubmitted(true);
    } catch (err) {
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-primary mb-2">Application Received</h2>
          <p className="text-gray-600 mb-6">Thank you for your interest in the Gyanastu franchise. Our team will review your details and contact you within 48 hours.</p>
          <button onClick={() => setSubmitted(false)} className="text-accent font-bold hover:underline">Return to Form</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Partner With Us</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join the fastest growing education network. Build a profitable business with high ROI.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {[
              { icon: <Briefcase className="w-8 h-8 text-white" />, title: "Proven Model", desc: "A tested business model with over 50+ successful centers.", color: "bg-blue-500" },
              { icon: <DollarSign className="w-8 h-8 text-white" />, title: "High ROI", desc: "Low investment setup with quick break-even period.", color: "bg-green-500" },
              { icon: <Users className="w-8 h-8 text-white" />, title: "Marketing Support", desc: "Centralized branding and lead generation assistance.", color: "bg-purple-500" },
              { icon: <CheckCircle className="w-8 h-8 text-white" />, title: "Training", desc: "Comprehensive training for you and your faculty.", color: "bg-orange-500" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className={`w-14 h-14 ${item.color} rounded-lg flex items-center justify-center mb-6`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-heading font-bold text-primary mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            <div className="bg-primary text-white p-10 md:w-1/3 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-heading font-bold mb-4">Inquiry Form</h3>
                <p className="text-gray-300 text-sm mb-8">Fill out the details and take the first step towards your entrepreneurial journey.</p>
                
                <div className="space-y-4">
                  <div className="text-sm">
                    <p className="opacity-70 mb-1">Franchise Hotline</p>
                    <p className="font-bold text-lg">+91 98765 00000</p>
                  </div>
                   <div className="text-sm">
                    <p className="opacity-70 mb-1">Email</p>
                    <p className="font-bold">franchise@gyanastu.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 md:w-2/3">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input 
                      required
                      type="email" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Location</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Investment Budget</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.investment}
                      onChange={e => setFormData({...formData, investment: e.target.value})}
                    >
                      <option value="2-5L">₹2 Lakhs - ₹5 Lakhs</option>
                      <option value="5-10L">₹5 Lakhs - ₹10 Lakhs</option>
                      <option value="10L+">Above ₹10 Lakhs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Business Experience</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. 5 years in education"
                      value={formData.experience}
                      onChange={e => setFormData({...formData, experience: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message (Optional)</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-md transition-colors disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Franchise;