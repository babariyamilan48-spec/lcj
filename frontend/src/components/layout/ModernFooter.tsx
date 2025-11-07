'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Github,
  Heart,
  Shield,
  Award,
  Users,
  BookOpen,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import Logo from '../ui/Logo';

const ModernFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'પ્લેટફોર્મ',
      links: [
        { name: 'કારકિર્દી મૂલ્યાંકન', href: '/home' },
        { name: 'વ્યક્તિત્વ પરીક્ષણો', href: '/tests/personality' },
        { name: 'બુદ્ધિ પરીક્ષણો', href: '/tests/iq' },
        { name: 'યોગ્યતા પરીક્ષણો', href: '/tests/aptitude' },
        { name: 'કારકિર્દી માર્ગદર્શન', href: '/guidance' },
      ]
    },
    {
      title: 'સંસાધનો',
      links: [
        { name: 'અમારા વિશે', href: '/about' },
        { name: 'કેવી રીતે કામ કરે છે', href: '/how-it-works' },
        { name: 'સંશોધન', href: '/research' },
        { name: 'બ્લોગ', href: '/blog' },
        { name: 'મદદ કેન્દ્ર', href: '/help' },
      ]
    },
    {
      title: 'સહાય',
      links: [
        { name: 'અમારો સંપર્ક કરો', href: '/contact' },
        { name: 'ગોપનીયતા નીતિ', href: '/privacy' },
        { name: 'સેવાની શરતો', href: '/terms' },
        { name: 'કૂકી નીતિ', href: '/cookies' },
        { name: 'વારંવાર પૂછાતા પ્રશ્નો', href: '/faq' },
      ]
    },
    {
      title: 'કંપની',
      links: [
        { name: 'અમારી ટીમ', href: '/team' },
        { name: 'કારકિર્દી', href: '/careers' },
        { name: 'પાર્ટનર્સ', href: '/partners' },
        { name: 'પ્રેસ', href: '/press' },
        { name: 'નિવેશકો', href: '/investors' },
      ]
    }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com', color: 'hover:text-orange-600' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com', color: 'hover:text-orange-400' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com', color: 'hover:text-orange-700' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com', color: 'hover:text-pink-600' },
    { name: 'GitHub', icon: Github, href: 'https://github.com', color: 'hover:text-gray-800' },
  ];

  const features = [
    { icon: Shield, text: 'સુરક્ષિત અને ખાનગી' },
    { icon: Award, text: 'વૈજ્ઞાનિક રીતે માન્ય' },
    { icon: Users, text: 'નિષ્ણાત સહાય' },
    { icon: BookOpen, text: 'વ્યાપક અહેવાલો' },
    { icon: BarChart3, text: 'વિગતવાર વિશ્લેષણ' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="mb-6">
                <Logo 
                  size="lg"
                  variant="full"
                  className="[&_h1]:text-white [&_p]:text-gray-400"
                />
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed max-w-md">
                અમારા વ્યાપક મનોવૈજ્ઞાનિક મૂલ્યાંકન પ્લેટફોર્મ સાથે તમારી સાચી ક્ષમતા શોધો. 
                તમારા કારકિર્દી વિકાસ અને વ્યક્તિગત વિકાસ માટે વ્યક્તિગત સૂચનો મેળવો.
              </p>

              {/* Features */}
              <div className="space-y-2">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-center space-x-2 text-sm text-gray-300"
                    >
                      <Icon className="w-4 h-4 text-orange-400" />
                      <span>{feature.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
              className="space-y-4"
            >
              <h4 className="text-lg font-semibold text-white">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: (sectionIndex * 0.1) + (linkIndex * 0.05) }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white text-sm transition-colors duration-200 hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 pt-8 border-t border-gray-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">ઇમેઇલ</p>
                <p className="text-sm text-gray-400">lifetransformjourney@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">ફોન</p>
                <p className="text-sm text-gray-400">+91 6354571342</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">સરનામું</p>
                <p className="text-sm text-gray-400">F-402, ABC-2, Sudamachock<br />Motavarachha, Surat, Gujarat</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-2 text-sm text-gray-400"
            >
              <span>© {currentYear} LCJ કારકિર્દી મૂલ્યાંકન. બધા અધિકારો સુરક્ષિત.</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>તમારા કારકિર્દી વિકાસ માટે પ્રેમથી બનાવેલું</span>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-4"
            >
              <span className="text-sm text-gray-400">અમને ફોલો કરો:</span>
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 ${social.color} transition-colors duration-200`}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ModernFooter;
