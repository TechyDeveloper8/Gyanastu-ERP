import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';

const Contact: React.FC = () => {
  const [cms, setCms] = useState({
    contact_header: {
      title: "Get in Touch",
      subtitle: "Have questions about our courses or franchises? We're here to help."
    },
    contact_info: {
      phone: "+91 98765 43210",
      email: "info@gyanastu.com",
      address: "123 Tech Park, Cyber City, New Delhi"
    }
  });
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', course: '', address: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createStudentEnquiry({
        student_name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        course_interest: formData.course,
        address: formData.address,
        message: formData.message,
        source: 'Website Contact Page'
      });
      setSuccess(true);
      setFormData({ name: '', email: '', mobile: '', course: '', address: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchCMS = async () => {
    try {
      const data: any = await api.getCMSContent();
      setCms(prev => {
        const next = { ...prev };
        ['contact_header', 'contact_info'].forEach(sec => {
          const secData = data.find((d: any) => d.id === sec)?.content;
          if (secData) next[sec as keyof typeof next] = { ...next[sec as keyof typeof next], ...secData };
        });
        return next;
      });
    } catch (err) { }
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
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">{cms.contact_header.title}</h1>
          <p className="text-xl max-w-2xl mx-auto text-gray-300">{cms.contact_header.subtitle}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* Contact Info */}
            <div className="col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 h-full">
                <h3 className="text-xl font-heading font-bold text-primary mb-6">Contact Information</h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-primary rounded-lg">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Head Office</p>
                      <p className="text-sm text-gray-600">{cms.contact_info.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-primary rounded-lg">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Phone</p>
                      <p className="text-sm text-gray-600">{cms.contact_info.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-primary rounded-lg">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Email</p>
                      <p className="text-sm text-gray-600">{cms.contact_info.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-primary rounded-lg">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Office Hours</p>
                      <p className="text-sm text-gray-600">Mon - Sat: 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map & Form */}
            <div className="col-span-1 md:col-span-2 space-y-8">
              {/* Fake Map */}
              <div className="bg-gray-200 w-full h-64 rounded-xl flex items-center justify-center text-gray-500 font-bold text-lg shadow-inner">
                <MapPin className="w-6 h-6 mr-2" /> Google Maps Integration Placeholder
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative">
                {success && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Message Sent!</h3>
                    <p className="text-gray-600 mt-2">We will get back to you shortly.</p>
                  </div>
                )}
                <h3 className="text-xl font-heading font-bold text-primary mb-6">Send us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required type="text" placeholder="Your Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <input required type="text" placeholder="Mobile Number" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required type="email" placeholder="Your Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <input type="text" placeholder="Course Interest (Optional)" value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <input type="text" placeholder="Your Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <textarea rows={4} placeholder="Your Message" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                  <button type="submit" disabled={submitting} className="bg-primary text-white font-bold px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;