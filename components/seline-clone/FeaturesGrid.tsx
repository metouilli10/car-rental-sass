import Link from "next/link";
import { LayoutDashboard, GitCommit, MessageSquare, ArrowUpRight, ArrowRight, Search, X, User, Filter, Receipt, ListFilter, Heart, ScanFace, GraduationCap } from "lucide-react";
import Image from "next/image";

export function FeaturesGrid() {
  return (
    <section className="py-24 bg-[#FAFAF9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Dashboard Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-8 right-8 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
              no setup required
            </div>
            
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Dashboard</h3>
            <p className="text-gray-600 mb-4 leading-relaxed max-w-sm">
              Easy-to-use website analytics. Gain a clear view of where your visitors come from and how they interact with your website.
            </p>
            
            <Link href="#" className="inline-flex items-center text-blue-500 font-medium hover:text-blue-600 mb-10">
              Explore example dashboard <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>

            {/* Dashboard Visual Mockup */}
            <div className="relative mt-4 bg-white border border-gray-100 rounded-xl shadow-sm p-4 w-full max-w-md mx-auto transform group-hover:scale-[1.02] transition-transform duration-500">
                <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Total Visits</div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-gray-900">1,234</span>
                                <span className="text-xs text-green-500 font-medium mb-1">↗ 12.5%</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">Visit Duration</div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-gray-900">2m 5s</span>
                                <span className="text-xs text-green-500 font-medium mb-1">↗ 8.3%</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-[1.5] bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-semibold text-gray-900">Sources</span>
                            <ArrowUpRight className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 bg-blue-50/50 p-1.5 rounded text-xs text-gray-700">
                                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">f</div>
                                facebook.com
                            </div>
                            <div className="flex items-center gap-2 bg-orange-50/50 p-1.5 rounded text-xs text-gray-700">
                                <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center text-[8px] font-bold text-orange-600">r</div>
                                reddit.com
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded text-xs text-gray-700">
                                <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center text-[8px] font-bold text-white">X</div>
                                x.com
                            </div>
                            <div className="flex items-center gap-2 bg-green-50/50 p-1.5 rounded text-xs text-gray-700">
                                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-[8px] font-bold text-green-600">G</div>
                                google.com
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Journeys Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-8 right-8 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
              no setup required
            </div>
            
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
              <GitCommit className="w-6 h-6 rotate-90" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Journeys</h3>
            <p className="text-gray-600 mb-10 leading-relaxed max-w-sm">
              Study each individual visitor and their journey through your website. Send in custom events to gain the full picture.
            </p>

            {/* Journeys Visual Mockup */}
            <div className="relative mt-auto bg-white border border-gray-100 rounded-xl shadow-sm p-6 w-full max-w-md mx-auto transform group-hover:scale-[1.02] transition-transform duration-500">
                <div className="text-xs text-gray-400 mb-4 font-mono">Thursday, 21 Mar 24</div>
                <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                    <div className="relative">
                        <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-orange-400 border-2 border-white ring-1 ring-gray-100"></div>
                        <div className="flex justify-between items-start">
                            <div className="text-sm font-semibold text-gray-900">user: signed up</div>
                            <span className="text-xs text-gray-400">2 props ⌄</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-1 ring-gray-100"></div>
                        <div className="flex justify-between items-start">
                            <div className="text-sm font-medium text-gray-700">/sign-up</div>
                            <span className="text-xs text-gray-400">85s</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-1 ring-gray-100"></div>
                        <div className="flex justify-between items-start">
                            <div className="text-sm font-medium text-gray-700">/blog/web-analytics</div>
                            <span className="text-xs text-gray-400">45s</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white ring-1 ring-gray-100"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">G</div>
                            <div className="text-xs text-gray-500">google.com <span className="ml-2">10:19 AM, lasting 92s</span></div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Chat with Seline AI Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden lg:col-span-2 group">
            <div className="absolute top-8 right-8 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
              no setup required
            </div>
            
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Chat with Seline AI</h3>
            <p className="text-gray-600 mb-10 leading-relaxed max-w-2xl">
              Seline can query your data, answer analytics-related questions, spit out CSVs, aggregate pageviews, create funnels, and more. Think of it as a personal analytics assistant available 24/7.
            </p>

            {/* Chat Visual Mockup */}
            <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm w-full max-w-3xl mx-auto overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-500">
                {/* Chat Header */}
                <div className="border-b border-gray-100 p-3 flex justify-between items-center bg-gray-50/50">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 font-medium">
                        <span>78 messages left</span>
                        <span className="flex items-center gap-1 cursor-pointer hover:text-gray-600"><span className="text-[10px]">✏️</span> New chat</span>
                        <span className="flex items-center gap-1 cursor-pointer hover:text-gray-600"><span className="text-[10px]">↘️</span> Minimize</span>
                    </div>
                </div>

                {/* Chat Body */}
                <div className="p-8 bg-white min-h-[240px] flex flex-col items-center justify-center">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full max-w-2xl mx-auto mb-8">
                        <button className="text-blue-500 text-sm font-medium hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-right">Which custom events should we track?</button>
                        <button className="text-blue-500 text-sm font-medium hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-left">What are our busiest hours?</button>
                        
                        <button className="text-blue-500 text-sm font-medium hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-right">How well our blog converts?</button>
                        <button className="text-blue-500 text-sm font-medium hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-left">Send me a CSV with last 30 days of data</button>
                        
                        <button className="text-blue-500 text-sm font-medium hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-right">Where our users drop off?</button>
                        <button className="text-blue-500 text-sm font-medium hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-left">What are our most popular features?</button>
                        
                        <button className="text-blue-500 text-sm font-medium hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-right">How to add Seline to my next.js app?</button>
                        <button className="text-blue-500 text-sm font-medium hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-left">What is bounce rate?</button>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-black overflow-hidden mb-8 shadow-md ring-2 ring-gray-100">
                        <Image src="/seline-assets/killer-feature.png" alt="AI" width={32} height={32} className="object-cover" />
                    </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Ask Seline..." 
                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
                            readOnly
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
          </div>

          {/* Profiles Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-8 right-8 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
              optional
            </div>
            
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
              <User className="w-6 h-6" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Profiles, churn analytics</h3>
            <p className="text-gray-600 mb-4 leading-relaxed max-w-sm">
              Identify your users with custom attributes to kick off the user-centric product analytics part of Seline. See engaged and about to churn users.
            </p>
            
            <Link href="#" className="inline-flex items-center text-blue-500 font-medium hover:text-blue-600 mb-10">
              Take a look at profiles <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>

            {/* Profiles Visual Mockup */}
            <div className="relative mt-4 w-full max-w-md mx-auto h-[240px]">
                {/* Annotation */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-center w-full z-20">
                    <div className="relative inline-block">
                        <Image src="/seline-assets/arrow-curved.svg" alt="" width={30} height={30} className="absolute -top-6 -left-8 rotate-[-45deg] opacity-40" />
                        <span className="font-serif italic text-gray-400 text-sm">our "killer feature" for software as a service</span>
                    </div>
                </div>

                {/* Card 1 - Background */}
                <div className="absolute top-12 left-0 w-[240px] bg-white border border-gray-100 rounded-xl shadow-sm p-4 transform -rotate-3 scale-95 opacity-60 z-0">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="font-bold text-gray-900">Martha Falls</div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        <span>🇸🇪 Sweden</span>
                        <span>iOS, Safari</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Plan</span>
                            <span className="font-medium">Free</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Company</span>
                            <span className="font-medium">Fals Inc</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Role</span>
                            <span className="font-medium">Marketing</span>
                        </div>
                    </div>
                </div>

                {/* Card 2 - Foreground */}
                <div className="absolute top-0 right-0 w-[260px] bg-white border border-gray-100 rounded-xl shadow-md p-5 transform group-hover:scale-[1.02] transition-transform duration-500 z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="font-bold text-gray-900 text-lg">Bruce Wayne</div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                        <span>🇺🇸 United States</span>
                        <span>macOS, Chrome</span>
                    </div>
                    
                    <div className="mb-6">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">FIELDS 5 ↓</div>
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Plan</span>
                                <span className="font-medium">Pro</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Company</span>
                                <span className="font-medium">Wayne Corp</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Role</span>
                                <span className="font-medium">Engineering</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ACTIVITY</div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                        </div>
                        <div className="grid grid-cols-12 gap-0.5">
                            {Array.from({ length: 48 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1.5 h-1.5 rounded-sm ${Math.random() > 0.3 ? 'bg-green-400' : 'bg-gray-100'}`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Funnels Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-8 right-8 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
              optional
            </div>
            
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
              <Filter className="w-6 h-6" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Funnels</h3>
            <p className="text-gray-600 mb-4 leading-relaxed max-w-sm">
              Monitor the performance of your marketing campaigns. Identify where your visitors drop off.
            </p>
            
            <Link href="#" className="inline-flex items-center text-blue-500 font-medium hover:text-blue-600 mb-10">
              Seline's guide to funnels <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>

            {/* Funnels Visual Mockup */}
            <div className="relative mt-auto bg-white border border-gray-100 rounded-xl shadow-sm p-6 w-full max-w-md mx-auto transform group-hover:scale-[1.02] transition-transform duration-500">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                    </div>
                    <span className="font-semibold text-gray-900">Blog Traffic to Revenue funnel</span>
                </div>
                <div className="text-xs text-gray-500 mb-6">0.8% total conversion rate</div>

                <div className="flex items-end justify-between h-40 gap-4">
                    {/* Step 1 */}
                    <div className="flex-1 flex flex-col justify-end group/bar">
                        <div className="text-center text-xs font-bold text-gray-900 mb-1">2123</div>
                        <div className="w-full bg-blue-500 rounded-t-sm h-[140px] relative"></div>
                        <div className="mt-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
                            <div className="font-medium text-gray-500 mb-0.5">step 1</div>
                            <div className="truncate">/blog/*</div>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-300 mb-12">›</div>

                    {/* Step 2 */}
                    <div className="flex-1 flex flex-col justify-end group/bar">
                        <div className="text-center text-xs text-gray-400 mb-1">-74.9%</div>
                        <div className="text-center text-xs font-bold text-gray-900 mb-1">532</div>
                        <div className="w-full bg-blue-300 rounded-t-sm h-[60px] relative"></div>
                        <div className="mt-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
                            <div className="font-medium text-gray-500 mb-0.5">step 2</div>
                            <div className="truncate">user: signed...</div>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-300 mb-12">›</div>

                    {/* Step 3 */}
                    <div className="flex-1 flex flex-col justify-end group/bar">
                        <div className="text-center text-xs text-gray-400 mb-1">-98.8%</div>
                        <div className="text-center text-xs font-bold text-gray-900 mb-1">17</div>
                        <div className="w-full bg-blue-100 rounded-t-sm h-[10px] relative"></div>
                        <div className="mt-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
                            <div className="font-medium text-gray-500 mb-0.5">step 3</div>
                            <div className="truncate">project: upg...</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

        </div>

        {/* Testimonials Row */}
        <div className="grid md:grid-cols-2 gap-12 mt-24 border-t border-gray-100 pt-16 mb-24">
            {/* Testimonial 1 */}
            <div className="flex flex-col items-start text-left">
                <div className="flex text-[#FFB321] mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                <p className="text-[14px] text-gray-700 mb-6 leading-relaxed">
                    "Seline has the holy trifecta of everything I want from 21st century analytics. Beautiful design, GDPR-compliance, uncompromising modern analytics features like visitor journeys and custom funnels. <span className="bg-blue-50 text-blue-900 font-medium px-1 rounded">I want all my sites on Seline."</span>
                </p>
                <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                            <Image src="/seline-assets/avatar-ari.jpg" alt="Ari Dutilh" width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-sm">Ari Dutilh</div>
                        <div className="text-gray-500 text-xs">Special Projects Lead, ODF</div>
                    </div>
                </div>
            </div>

            {/* Testimonial 2 */}
            <div className="flex flex-col items-start text-left">
                <div className="flex text-[#FFB321] mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                <p className="text-[14px] text-gray-700 mb-6 leading-relaxed">
                    "We switched from Google Analytics, <span className="bg-blue-50 text-blue-900 font-medium px-1 rounded">tried PostHog and eventually gave up...</span> I like Seline because of the simplicity, and I use it almost every day."
                </p>
                <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                            <Image src="/seline-assets/avatar-jack.jpg" alt="Jack Qi" width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-sm">Jack Qi</div>
                        <div className="text-gray-500 text-xs">Co-Founder, Edcafe</div>
                    </div>
                </div>
            </div>
        </div>

        {/* New Feature Row: Revenue & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Tracking Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-8 right-8 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    optional
                </div>
                
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
                    <Receipt className="w-6 h-6" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Revenue tracking and attribution</h3>
                <p className="text-gray-600 mb-4 leading-relaxed max-w-sm">
                    Track your revenue and see which referrers and UTMs bring you the most value. Works great for e-commerce and SaaS. Stripe integration available.
                </p>
                
                <Link href="#" className="inline-flex items-center text-blue-500 font-medium hover:text-blue-600 mb-10">
                    Revenue tracking <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>

                {/* Revenue Visual Mockup */}
                <div className="relative mt-4 w-full max-w-md mx-auto h-[200px]">
                    <div className="absolute bottom-0 right-0 w-full max-w-[320px] bg-white border border-gray-100 rounded-xl shadow-sm p-4 z-10">
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-2xl font-bold text-gray-900">$42,076</span>
                            <span className="text-xs text-green-500 font-medium">↗ 15.7%</span>
                            <span className="text-xs text-gray-400">vs previous 30 days</span>
                        </div>
                        {/* Simple line chart visualization */}
                        <div className="h-16 flex items-end gap-1 mb-4">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className="flex-1 bg-blue-100 rounded-t-sm"
                                    style={{ height: `${20 + Math.random() * 80}%` }}
                                ></div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Sources List - Behind */}
                    <div className="absolute bottom-4 left-0 w-[240px] bg-white border border-gray-100 rounded-xl shadow-sm p-4 z-20">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-semibold text-gray-900">Sources</span>
                            <span className="text-[10px] text-gray-400">5 referrers</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-bold">f</div>
                                    <span>facebook.com</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-green-100 rounded-full overflow-hidden">
                                        <div className="w-[80%] h-full bg-green-400"></div>
                                    </div>
                                    <span className="text-gray-500">159</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[8px] font-bold">r</div>
                                    <span>reddit.com</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-green-100 rounded-full overflow-hidden">
                                        <div className="w-[75%] h-full bg-green-400"></div>
                                    </div>
                                    <span className="text-gray-500">155</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extensive Filters Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-8 right-8 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    no setup required
                </div>
                
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
                    <ListFilter className="w-6 h-6" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Extensive filters</h3>
                <p className="text-gray-600 mb-10 leading-relaxed max-w-sm">
                    Filter your data by custom attributes, UTM parameters, referrers, and more.
                </p>

                {/* Filters Visual Mockup */}
                <div className="relative mt-auto bg-white border border-gray-100 rounded-xl shadow-sm p-6 w-full max-w-md mx-auto transform group-hover:scale-[1.02] transition-transform duration-500">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">FILTER BY</div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <LayoutDashboard className="w-3 h-3 text-gray-400" /> Page
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <GitCommit className="w-3 h-3 text-gray-400 rotate-90" /> Event
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">🏳</span> Country
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">💻</span> Browser
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">📱</span> Device
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">🖥</span> OS
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">🔗</span> Referrer
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">CUSTOM</div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">📄</span> Fields
                                </div>
                            </div>
                            
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">UTMs</div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">@</span> Campaign
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">@</span> Source
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">@</span> Medium
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Small Feature Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {/* Human-coded */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
                    <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Human-coded</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Seline is built and actively maintained by developers with decades of experience in the field. It is secure, reliable, fast and coded with love rather than vibes.
                </p>
            </div>

            {/* Advanced bot detection */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
                    <ScanFace className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Advanced bot detection</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                    In the era of AI and scraping, filtering out bot traffic is a must. No tool does it perfectly, but we aim to be among the best.
                </p>
            </div>

            {/* Founded in 2024 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-6 text-white">
                    <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Founded in 2024</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Seline is a relatively new yet seasoned analytics platform, now tracking 100s of millions of events for thousands of websites.
                </p>
            </div>
        </div>

        {/* Final Testimonial */}
        <div className="text-center max-w-2xl mx-auto">
            <p className="text-gray-600 mb-6">
                <span className="bg-blue-50 text-blue-900 font-medium px-1 rounded">"Seline looks so good!</span> The power of small teams..." <span className="text-gray-400">— x.com</span>
            </p>
            <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    <Image src="/seline-assets/avatar-guillermo.jpg" alt="Guillermo Rauch" width={40} height={40} className="object-cover" />
                </div>
                <div className="text-left">
                    <div className="font-bold text-gray-900 text-sm">Guillermo Rauch</div>
                    <div className="text-gray-500 text-xs">CEO, Vercel</div>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
}
