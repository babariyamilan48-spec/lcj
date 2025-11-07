'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  HelpCircle,
  FileText,
  Users
} from 'lucide-react';
import ModernNavbar from './layout/ModernNavbar';
import ModernFooter from './layout/ModernFooter';
import { modernToast } from '@/utils/toast';

interface ModernContactPageProps {
  onBack?: () => void;
}

const ModernContactPage: React.FC<ModernContactPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Import the contact service
      const { contactService } = await import('@/services/contactService');
      
      // Submit the form data
      const response = await contactService.submitContact({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        inquiry_type: formData.inquiryType as any
      });
      
      if (response.success) {
        modernToast.contact.submitSuccess();
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          inquiryType: 'general'
        });
      } else {
        modernToast.contact.submitError(response.error);
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      modernToast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'અમને ઇમેઇલ કરો',
      description: 'અમને ઇમેઇલ મોકલો અને અમે 24 કલાકમાં જવાબ આપીશું',
      contact: 'lifetransformjourney@gmail.com',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Phone,
      title: 'અમને કૉલ કરો',
      description: 'અમારી સહાય ટીમ સાથે સીધા વાત કરો',
      contact: '+91 6354571342',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: MapPin,
      title: 'અમને મળો',
      description: 'વ્યવસાયિક કલાકો દરમિયાન અમારા ઓફિસમાં આવો',
      contact: 'F-402, ABC-2, Sudamachock, Motavarachha, Surat, Gujarat',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Clock,
      title: 'વ્યવસાયિક કલાકો',
      description: 'અમે આ સમય દરમિયાન મદદ કરવા માટે અહીં છીએ',
      contact: 'Mon-Fri: 9AM-6PM EST',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const faqs = [
    {
      question: 'મૂલ્યાંકન કેટલો સમય લે છે?',
      answer: 'તમે પસંદ કરો છો તે પરીક્ષણના પ્રકારના આધારે, મોટાભાગના મૂલ્યાંકનો પૂર્ણ કરવા માટે 15-45 મિનિટ લે છે.'
    },
    {
      question: 'શું મારા પરિણામો ગોપનીય છે?',
      answer: 'હા, એકદમ. અમે તમારા ડેટાને સુરક્ષિત કરવા માટે એન્ટરપ્રાઇઝ-ગ્રેડ સુરક્ષા વાપરીએ છીએ અને તમારી સ્પષ્ટ સંમતિ વિના ક્યારેય તમારા પરિણામો શેર કરતા નથી.'
    },
    {
      question: 'શું હું મૂલ્યાંકન ફરીથી લઈ શકું છું?',
      answer: 'હા, ચોક્કસ પરિણામોની ખાતરી માટે 30-દિવસની રાહ જોવાના સમય પછી તમે મોટાભાગના મૂલ્યાંકનો ફરીથી લઈ શકો છો.'
    },
    {
      question: 'શું તમે કારકિર્દી સલાહ આપો છો?',
      answer: 'હા, અમે તમારા પરિણામોનું અર્થઘટન કરવામાં અને તમારા કારકિર્દી માર્ગની યોજના બનાવવામાં મદદ કરવા માટે વ્યાવસાયિક કારકિર્દી સલાહ સેવાઓ પ્રદાન કરીએ છીએ.'
    }
  ];

  const inquiryTypes = [
    { value: 'general', label: 'સામાન્ય પૂછપરછ' },
    { value: 'technical', label: 'ટેકનિકલ સહાય' },
    { value: 'billing', label: 'બિલિંગ પ્રશ્ન' },
    { value: 'partnership', label: 'પાર્ટનરશિપ તક' },
    { value: 'feedback', label: 'પ્રતિસાદ' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar currentScreen="contact" />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-gujarati text-center">
              સંપર્ક કરો
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              અમારા મૂલ્યાંકનો વિશે પ્રશ્નો છે? તમારા પરિણામો સાથે મદદની જરૂર છે? 
              તમારા કારકિર્દી વિકાસ સફરમાં અમે તમારી મદદ કરવા માટે અહીં છીએ.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300 min-h-[200px] flex flex-col justify-between"
                >
                  <div className="flex flex-col h-full">
                    <div className={`w-16 h-16 bg-gradient-to-r ${method.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{method.title}</h3>
                    <p className="text-gray-600 mb-4 text-sm flex-grow">{method.description}</p>
                    <p className="text-orange-600 font-medium text-sm break-words leading-relaxed mt-auto">{method.contact}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-2xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">અમને સંદેશ મોકલો</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      પૂરું નામ *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="તમારું પૂરું નામ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ઇમેઇલ સરનામું *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="તમારું@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    પૂછપરછનો પ્રકાર
                  </label>
                  <select
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    {inquiryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    વિષય *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="આ શેના વિશે છે?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    સંદેશ *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="અમને કહો કે અમે તમારી કેવી રીતે મદદ કરી શકીએ..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>મોકલી રહ્યા છીએ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>સંદેશ મોકલો</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Contact Info and FAQ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Contact Info */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">સંપર્ક માહિતી</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">ઇમેઇલ</p>
                      <p className="text-gray-600">lifetransformjourney@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">ફોન</p>
                      <p className="text-gray-600">+91 6354571342</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">સરનામું</p>
                      <p className="text-gray-600">F-402, ABC-2, Sudamachock<br />Motavarachha, Surat, Gujarat</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">વ્યવસાયિક કલાકો</p>
                      <p className="text-gray-600">Mon-Fri: 9AM-6PM EST</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">વારંવાર પૂછાતા પ્રશ્નો</h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              હજુ પણ પ્રશ્નો છે?
            </h2>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              અમારી સહાય ટીમ તમારા મૂલ્યાંકન અનુભવમાંથી મહત્તમ લાભ મેળવવામાં તમારી મદદ કરવા માટે અહીં છે.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-5 h-5 inline mr-2" />
                લાઇવ ચેટ સહાય
              </motion.button>
              <motion.button
                onClick={onBack}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl text-lg hover:bg-white hover:text-orange-600 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 inline mr-2" />
                ઘરે પાછા જાઓ
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default ModernContactPage;
