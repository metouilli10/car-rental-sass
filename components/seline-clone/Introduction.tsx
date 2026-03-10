import Image from "next/image";
import Link from "next/link";
import { FileText, LayoutGrid, ShoppingBag, ArrowRight } from "lucide-react";

export function Introduction() {
  return (
    <section className="pt-20 pb-24 bg-[#FAFAF9] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Headline Section */}
        <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-[36px] leading-[1.25] font-semibold text-gray-900 mb-6 tracking-tight max-w-5xl">
                Start seeing where your online business isn’t <br className="hidden md:block" />
                converting. <span className="text-gray-400 font-normal">Be it a </span>
                <span className="inline-flex items-center align-middle mx-1 bg-gray-100 px-2 py-1 rounded-md text-gray-500 text-[28px] font-semibold border border-gray-200/60 whitespace-nowrap">
                    <FileText className="w-5 h-5 mr-2 text-gray-400" />
                    static website
                </span>
                <span className="text-gray-400 font-normal">, </span>
                <span className="inline-flex items-center align-middle mx-1 bg-gray-100 px-2 py-1 rounded-md text-gray-500 text-[28px] font-semibold border border-gray-200/60 whitespace-nowrap">
                    <LayoutGrid className="w-5 h-5 mr-2 text-gray-400" />
                    web application
                </span>
                <span className="text-gray-400 font-normal">, or </span>
                <br className="hidden md:block" />
                <span className="inline-flex items-center align-middle mx-1 bg-gray-100 px-2 py-1 rounded-md text-gray-500 text-[28px] font-semibold border border-gray-200/60 whitespace-nowrap">
                    <ShoppingBag className="w-5 h-5 mr-2 text-gray-400" />
                    e-commerce store
                </span>
                <span className="text-gray-400 font-normal">.</span>
            </h2>
            
            <p className="text-[16px] text-gray-600 mb-10 leading-relaxed max-w-3xl">
                Add Seline in 3 minutes, or request a demo or simply message us if you need any assistance. We’ve helped 10s of companies set up <span className="italic font-serif text-gray-600">insightful</span> tracking.
            </p>

            <div className="flex flex-wrap gap-4 mt-6 mb-16">
                <Link
                    href="#"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-base font-bold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                    Add to your website
                    <span className="bg-blue-400/40 text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 uppercase tracking-wide">A</span>
                </Link>
                <Link
                    href="#"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-bold rounded-xl transition-all shadow-sm border border-gray-200"
                >
                    Get a demo
                    <div className="w-5 h-5 rounded-full bg-gray-300 overflow-hidden ml-1">
                        <Image src="/seline-assets/avatar-demo.jpg" alt="" width={20} height={20} className="object-cover" />
                    </div>
                </Link>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-2 gap-12 mt-12 mb-24">
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
                        "Previously, I had all of my sites hooked up to Google Analytics, like most people. <span className="bg-blue-50 text-blue-900 font-medium px-1 rounded">But I never looked at the reports.</span> Now, I find myself dropping in and looking at the stats several times a day. It's very easy to digest and understand."
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                             <Image src="/seline-assets/avatar-chris.jpg" alt="Chris Williams" width={40} height={40} className="object-cover" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-sm">Chris Williams</div>
                            <div className="text-gray-500 text-xs">Founder, Cloudscope</div>
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
                        "It just works, no need to navigate endless dashboards or worry about compliance issues. That simplicity <span className="bg-blue-50 text-blue-900 font-medium px-1 rounded">saves us time and helps us stay focused on building our business.</span>"
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                             <Image src="/seline-assets/avatar-kevin.jpg" alt="Kevin Steba" width={40} height={40} className="object-cover" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-sm">Kevin Steba</div>
                            <div className="text-gray-500 text-xs">Founder, Seino</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Why Seline Section */}
        <div className="max-w-5xl mx-auto mt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Features
            </div>
            
            <h3 className="text-[32px] font-semibold text-gray-400 mb-12 md:whitespace-nowrap">
                There are hundreds of analytics tools out there. <span className="text-gray-900">Why Seline?</span>
            </h3>

            <div className="grid md:grid-cols-2 gap-12 text-lg text-gray-600 leading-relaxed">
                <div>
                    <p className="mb-6">
                        Seline's cherry-picked toolkit is similar to Google Analytics, but real-time, simple, privacy-first, and designed for daily use. Including an intuitive all-in-one dashboard, packaged with visitor journey insights and funnels on top of it.
                    </p>
                </div>
                <div>
                    <p className="mb-6">
                        If you have a SaaS you only need to identify your users to start with our user-centric product analytics — think Amplitude or Mixpanel, but actually digestible, easy to use, and <span className="italic font-serif">naturally</span> insightful. <span className="bg-blue-50 text-blue-900 font-medium px-1 rounded">Run Seline standalone or alongside your current stack.</span>
                    </p>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
                 <p className="text-sm text-gray-400">
                    <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-xs font-mono mr-2">* no setup required</span>
                    means you only need to add our whisper-thin (~2kb) html snippet to your website for the feature to work.
                 </p>
            </div>
        </div>

      </div>
    </section>
  );
}
