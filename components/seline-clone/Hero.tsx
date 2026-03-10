import Link from "next/link";
import Image from "next/image";

const logos = [
  { name: "Third South Capital", src: "/seline-assets/logo-thirdsouth.svg" },
  { name: "Solo Founders", src: "/seline-assets/logo-solofounders.svg" },
  { name: "Onboardbase", src: "/seline-assets/logo-onboardbase.svg" },
  { name: "Vidext", src: "/seline-assets/logo-vidext.svg" },
  { name: "Seino", src: "/seline-assets/logo-seino.svg" },
  { name: "DLI", src: "/seline-assets/logo-dli.svg" },
  { name: "Edcafe", src: "/seline-assets/logo-edcafe.svg" },
];

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-20 overflow-hidden bg-[#FAFAF9]">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-[50%] max-w-[800px] aspect-square opacity-60">
            <Image 
                src="/seline-assets/line-left.png" 
                alt="" 
                fill 
                className="object-contain object-top-left"
                priority
            />
          </div>
          <div className="absolute top-0 right-0 w-[50%] max-w-[800px] aspect-square opacity-60">
            <Image 
                src="/seline-assets/line-right.png" 
                alt="" 
                fill 
                className="object-contain object-top-right"
                priority
            />
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Text Content - Stacked and Left Aligned */}
        <div className="flex flex-col items-start max-w-4xl text-left mb-16 lg:mb-24">
            {/* Main Headline */}
            <h1 className="text-5xl lg:text-[64px] font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
              The <span className="bg-blue-100 px-2 rounded-md inline-block text-gray-900">simple & actionable</span> <br />
              Google Analytics alternative
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium mt-2 max-w-2xl">
              See what your visitors actually do. Understand why. Fix what matters.
            </p>

            {/* CTAs */}
            <div className="flex gap-4 mt-4">
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-base font-bold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                Add to your website
                <span className="bg-blue-400/40 text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 uppercase tracking-wide">A</span>
              </Link>
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-base font-bold rounded-xl transition-all shadow-sm"
              >
                View live demo
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            {/* Logos (Social Proof) */}
            <div className="flex flex-wrap items-center gap-x-10 gap-y-6 opacity-50 grayscale mt-12 w-full">
              {logos.map((logo) => (
                <div key={logo.name} className="relative h-6 w-auto flex-shrink-0 flex items-center justify-center">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={100}
                    height={30}
                    className="object-contain h-6 w-auto"
                  />
                </div>
              ))}
            </div>

            {/* G2 Review */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-8">
                <div className="flex text-[#FFB321]">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                <span className="font-medium text-gray-400">on</span>
                <Image src="/seline-assets/logo-g2.svg" alt="G2" width={18} height={18} className="opacity-60" />
                <span className="text-gray-400">— &ldquo;Seline is the kind of product I&rsquo;m happy to open every day.&rdquo;</span>
            </div>
        </div>

        {/* Dashboard Image Container - Full Width Below */}
        <div className="relative max-w-6xl mx-auto">
            {/* Girl Illustration */}
            <div className="absolute -top-24 -right-4 lg:-top-40 lg:-right-12 w-40 h-40 lg:w-64 lg:h-64 z-20 pointer-events-none">
                 <Image 
                    src="/seline-assets/killer-feature.png" 
                    alt="Seline character"
                    width={256}
                    height={256}
                    className="w-full h-full object-contain drop-shadow-xl"
                 />
            </div>

            {/* Browser chrome / frame simulation */}
            <div className="relative rounded-2xl overflow-hidden shadow-[0_25px_80px_-20px_rgba(0,0,0,0.15)] border border-gray-200/60 bg-white ring-1 ring-black/5">
             <Image
                src="/seline-assets/m-funnels.png"
                alt="Seline Dashboard Funnels"
                width={3840}
                height={2160}
                className="w-full h-auto"
                priority
              />
            </div>
            
            {/* Tab Switcher */}
            <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200/60 ring-1 ring-gray-100">
                    <button className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-full">Dashboard</button>
                    <button className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-full">Visitors</button>
                    <button className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-full">Journeys</button>
                    <button className="px-5 py-2 text-sm font-bold text-white bg-gray-900 rounded-full shadow-sm">Funnels</button>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
}
