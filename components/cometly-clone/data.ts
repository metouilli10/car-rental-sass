import { 
  BarChart3, 
  MessageSquare, 
  Server, 
  PieChart, 
  RefreshCcw, 
  Zap, 
  Building2, 
  MousePointerClick, 
  Link, 
  Activity 
} from "lucide-react";

export const navLinks = [
  { label: "Product", hasDropdown: true },
  { label: "Solutions", hasDropdown: true },
  { label: "Resources", hasDropdown: true },
  { label: "Customers", hasDropdown: false },
  { label: "Pricing", hasDropdown: false },
];

export const heroData = {
  heading: "Smarter Marketing Attribution. Use AI to Turn Data Into Action.",
  subheading: "Cometly transforms your marketing and sales data into insights, decisions, and scalable results by accurately attributing every conversion to its true source.",
  ctaPrimary: "Get Started",
  ctaSecondary: "Book a demo",
  trustText: "Trusted by thousands of companies"
};

export const features = [
  {
    icon: BarChart3,
    title: "AI Ads Manager",
    description: "Manage and optimize ad campaigns with accurate data. Control budgets and make better scaling decisions using AI.",
    isNew: false,
  },
  {
    icon: MessageSquare,
    title: "AI Chat",
    description: "Use AI to chat with your ad and conversion data for actionable insights and recommendations.",
    isNew: true,
  },
  {
    icon: Server,
    title: "Server-Side Tracking",
    description: "Built in server-side tracking with easy one click integrations for all tools in your marketing and sales stack.",
    isNew: false,
  },
  {
    icon: PieChart,
    title: "Multi-Touch Attribution",
    description: "View data with a variety of attribution models and windows. Uncover how hidden touchpoints in your marketing assist conversions.",
    isNew: false,
  },
  {
    icon: Activity,
    title: "Analytics",
    description: "Build custom reports and dashboards to measure organic, paid, email, outbound, and any other source.",
    isNew: false,
  },
  {
    icon: RefreshCcw,
    title: "Conversion Sync",
    description: "One-click setup to sync accurate and enriched conversion data with the ad platforms to get better ad results.",
    isNew: false,
  },
];

export const howItWorksSteps = [
  {
    icon: MousePointerClick,
    title: "Capture website activity",
    description: "Install the Cometly Pixel on your website and automatically start tracking all activity (visits, form fills, etc.) from your website users.",
  },
  {
    icon: Link,
    title: "Connect your marketing & sales tools",
    description: "Connect your ad accounts, CRM, and payment tools in just a few clicks to start tracking the actions that matter most.",
  },
  {
    icon: Zap,
    title: "Activate Conversion Sync",
    description: "With Cometly’s built-in server-side tracking, you can sync conversions to ad platforms with a single toggle — no devs needed.",
  },
  {
    icon: Activity,
    title: "Analyze & act on accurate data",
    description: "Start analyzing your data in real time. Find out exactly which channels, ads, or campaigns are working so you can make smarter decisions.",
  },
  {
    icon: MessageSquare,
    title: "Use AI to chat with your data",
    description: "Use AI to ask questions about your ad performance and get clear, helpful insights that improve your results — fast.",
  },
];

export const testimonials = [
  {
    quote: "Better ad targeting. Better funnel insights. Better CPA control. We've scaled our ad spend 40% since implementing Cometly and it's definitely one of the tools in our tech stack that's given us the confidence to do so. Not to mention they've been incredible partners to our team, with hands-on support and an authentic investment in our success.",
    name: "Jonathan Ronzio",
    role: "Co-founder & CMO, Trainual",
    company: "Trainual",
  },
  {
    quote: "Cometly has been a game-changer and it's perfect for seeing all paid channels in one unified dashboard, making it easy to track and analyze performance across platforms. Their support team is outstanding. Thanks to Cometly, we’ve streamlined our attribution tracking and gained valuable insights into conversion tracking on multiple ad platforms.",
    name: "Baris Zeren",
    role: "CEO, Book Your Data",
    company: "Book Your Data",
  },
  {
    quote: "Our team relies on Cometly to track and attribute various KPIs, including revenue, to the correct marketing sources. Cometly has enabled us to view our paid media spend in a single, comprehensive view. The Cometly team went above and beyond to help us get set up, ensuring a seamless integration with our existing systems.",
    name: "Rexell Espinosa",
    role: "Growth Marketing, Design Pickle",
    company: "Design Pickle",
  },
  {
    quote: "Cometly has streamlined our ad reporting and eliminated numerous internal processes, saving my team valuable time. Beyond the efficiency gains, we've seen a significant boost in performance by leveraging Cometly's direct data feedback to ad platforms, bypassing the need for complex server-side tracking setups.",
    name: "Aleric Heck",
    role: "Founder & CEO, AdOutreach",
    company: "AdOutreach",
  },
  {
    quote: "Cometly has been an invaluable tool that delivers rock-solid advertising attribution and tracking. It has allowed us to scale and make strategic advertising decisions, knowing that our conversion data is accurate across the entire customer journey.",
    name: "David Trachsel",
    role: "Head of Growth, SaaSRise",
    company: "SaaSRise",
  },
  {
    quote: "With the ability to track clicks, conversions, and other key metrics across multiple channels and campaigns, I am able to quickly identify what is working and what is not, and make data-driven decisions to optimize my campaigns.",
    name: "Dustin Cucciarre",
    role: "Head of Marketing, Clicks Geek",
    company: "Clicks Geek",
  },
];

export const footerColumns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "AI Ads Manager", "AI Chat", "Server-Side Tracking", "Multi-Touch Attribution", "Analytics", "Conversion Sync"],
  },
  {
    title: "Company",
    links: ["About Us", "Customers", "Case Studies", "Contact Us"],
  },
  {
    title: "Resources",
    links: ["Blog", "Help Center", "Academy", "Guides", "Community", "Developer Docs"],
  },
  {
    title: "Solutions",
    links: ["SaaS", "Agencies", "Ecommerce"],
  },
];

export const sectionHeadings = {
  features: {
    title: "Measure conversions and revenue from every marketing source",
    subtitle: "Unify all your marketing data into one platform for smarter, faster decisions."
  },
  testimonials: {
    title: "Don't just take our word for it",
    subtitle: "Hear from the top marketers in the world using Cometly to scale their ad campaigns"
  },
  analytics: {
    title: "Finally Understand What’s Driving Your Growth",
    subtitle: "See the real impact of your ads, emails, and campaigns — all in one place. Build custom reports to track what actually moves revenue."
  },
  howItWorks: {
    title: "Launch With Expert Help",
    subtitle: "Getting started with Cometly is fast but you’re not doing it alone. We partner with your team from day one to ensure everything is implemented correctly."
  },
  integrations: {
    title: "Connect your marketing & sales stack",
    subtitle: "Connect your tools, connect your teams. With over 100 apps already available in our directory, your team’s favourite tools are just a click away."
  },
  cta: {
    title: "See Cometly in Action",
    subtitle: "Get a live walkthrough of how Cometly helps marketing teams get clear, accurate attribution — and make smarter decisions that drive growth."
  }
};
