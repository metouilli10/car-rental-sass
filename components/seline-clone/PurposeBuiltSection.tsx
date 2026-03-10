import Link from "next/link";
import Image from "next/image";
import {
  Flag,
  Feather,
  LineChart,
  Cloud,
  Lock,
  Zap,
  Puzzle,
  Shield,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Flag,
    title: "Independent",
    description:
      "Seline is a tool we long wanted to build and use ourselves. It is completely self-funded, and we have no interest in taking any form of Investments or other binding partnerships.",
  },
  {
    icon: Feather,
    title: "Lightweight",
    description:
      "Ensure great performance for your visitors - our script weighs only ~2kb, making it 23x times lighter than Google Analytics script.",
  },
  {
    icon: LineChart,
    title: "Google Analytics alternative",
    description:
      "Seline is a simple and privacy-friendly alternative to Google Analytics. We focused on building a tool that you'll actually love using.",
  },
  {
    icon: Cloud,
    title: "Free",
    description: (
      <>
        We have a fair free plan suitable for small-scale businesses. We are not asking for credit card info during the sign up and we don&apos;t have trial periods. Learn more at our{" "}
        <Link href="#" className="text-blue-500 hover:text-blue-600 underline">pricing page</Link>.
      </>
    ),
  },
  {
    icon: Lock,
    title: "Secure",
    description:
      "We are an EU-based company with our servers and data storage hosted in Germany. Every request is https encrypted.",
  },
  {
    icon: Zap,
    title: "Fast",
    description: (
      <>
        We ensured that our dashboard is delivered in a blink of an eye. We use{" "}
        <Link href="#" className="text-blue-500 hover:text-blue-600 underline">ClickHouse</Link>{" "}
        database for storing events, which is much faster than traditional data warehouses.
      </>
    ),
  },
  {
    icon: Puzzle,
    title: "Easy to integrate",
    description:
      "Add our tiny script and you are ready to go, there's no need for any development knowledge. Works with all popular tools and frameworks such as Framer, Next.js, WordPress and Webflow.",
  },
  {
    icon: Shield,
    title: "Privacy-friendly",
    description:
      "We don't use third-party cookies or store any personal data. We don't share or sell your data to third-party companies.",
  },
  {
    icon: Sparkles,
    title: "Custom events",
    description:
      "Track custom events on your website, such as button clicks, form submissions, or any other interactions. Use them to understand your visitors better.",
  },
];

export function PurposeBuiltSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16 max-w-2xl mx-auto">
          Purpose-built analytics for the mindful web
        </h2>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-6 text-blue-500">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {typeof feature.description === "string"
                  ? feature.description
                  : feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-12">
          <div className="flex flex-col items-start text-left">
            <div className="flex text-[#FFB321] mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-[14px] text-gray-700 mb-6 leading-relaxed">
              &quot;As a founder, I&apos;ve used several analytics platforms, but Seline stands out for several reasons. What I like most about Seline is how it{" "}
              <span className="font-semibold text-gray-900">
                combines incredible power with exceptional user-friendliness - a rare combination in analytics tools.
              </span>
              &quot;
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                <Image
                  src="/seline-assets/avatar.png"
                  alt="John Madrak"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">
                  John Madrak
                </div>
                <div className="text-gray-500 text-xs">
                  Founder, Waddling Technology
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start text-left">
            <div className="flex text-[#FFB321] mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-[14px] text-gray-700 mb-6 leading-relaxed">
              &quot;I use Seline at my Shopify store. Although Shopify has its own analytics, I{" "}
              <Link href="#" className="text-blue-500 hover:text-blue-600 underline">
                find Seline more convenient
              </Link>
              . Its flexible filters let me analyze data from different regions. I can also view statistics by UTM tags, which helps when I launch Google Ads.&quot;
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                <Image
                  src="/seline-assets/avatar.png"
                  alt="Kate Prokopyeva"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">
                  Kate Prokopyeva
                </div>
                <div className="text-gray-500 text-xs">
                  Founder, Ekaproeka store
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
