import { Home, Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white relative overflow-hidden">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top section with logo and newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12 pb-12 border-b border-gray-200">
          {/* Brand section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6 group cursor-pointer">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-xl shadow-lg group-hover:shadow-orange-500/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Home className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">Rexon</span>
            </div>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Rexon is redefining real estate in India. Get commercial property buying and selling help from a team of experts committed to your success.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3">
              <a href="mailto:contact@rexon.com" className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors duration-300 group text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors duration-300">
                  <Mail className="h-4 w-4 text-blue-600 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300" />
                </div>
                <span>contact@rexon.com</span>
              </a>
              <a href="tel:+911234567890" className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors duration-300 group text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors duration-300">
                  <Phone className="h-4 w-4 text-blue-600 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300" />
                </div>
                <span>+91 123 456 7890</span>
              </a>
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <span>Mumbai, India</span>
              </div>
            </div>
          </div>
          
          {/* Newsletter section */}
          <div className="lg:col-span-2">
            <h3 className="text-blue-900 font-bold mb-3 text-lg">Stay Updated</h3>
            <p className="text-slate-600 text-sm mb-4">
              Subscribe to our newsletter for the latest commercial property listings and market insights.
            </p>
            <div className="flex gap-3 max-w-md">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-3 rounded-lg border-2 border-blue-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Links section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-blue-900 font-bold mb-4 text-sm flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></span>
              Buy & Sell
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Buy Property</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Sell Property</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Property Valuation</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Sold Properties</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Market Trends</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-blue-900 font-bold mb-4 text-sm flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></span>
              Resources
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Blog</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Guides</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Help Center</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">News</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Market Reports</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-blue-900 font-bold mb-4 text-sm flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></span>
              Company
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">About Us</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Careers</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Contact</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Investors</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition-all duration-300 hover:translate-x-1 inline-block">Press</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-blue-900 font-bold mb-4 text-sm flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></span>
              Follow Us
            </h3>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-orange-500 hover:bg-gradient-to-br hover:from-orange-500 hover:to-orange-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/30 group">
                <Facebook className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-orange-500 hover:bg-gradient-to-br hover:from-orange-500 hover:to-orange-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/30 group">
                <Twitter className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-orange-500 hover:bg-gradient-to-br hover:from-orange-500 hover:to-orange-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/30 group">
                <Linkedin className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-orange-500 hover:bg-gradient-to-br hover:from-orange-500 hover:to-orange-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/30 group">
                <Instagram className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-xs">
            <a href="#" className="text-slate-500 hover:text-orange-500 transition-colors duration-300">Privacy Policy</a>
            <a href="#" className="text-slate-500 hover:text-orange-500 transition-colors duration-300">Terms of Service</a>
            <a href="#" className="text-slate-500 hover:text-orange-500 transition-colors duration-300">Cookie Policy</a>
            <a href="#" className="text-slate-500 hover:text-orange-500 transition-colors duration-300">Accessibility</a>
          </div>
          <p className="text-xs text-slate-500">
            © 2024 Rexon. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Decorative bottom border */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600"></div>
    </footer>
  );
}