"use client";

import { ThemeToggle } from "@/core/components/theme-toggle";
import SplitText from "@/core/components/SplitText";
import { AnimatedBackground } from "@/core/components/AnimatedBackground";
import { useScrollAnimation } from "@/core/hooks/useScrollAnimation";
import { useRef, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { LottieAnimation } from "@/components/lottie-animation";
import sellAnimationData from "@/lib/animations/sell-animation.json";
import { Button } from "@/components/ui/button";
import { TrendingUp, Package, BarChart3, Wrench, FileText, ShoppingCart, Building2, QrCode, DollarSign, ClipboardList } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

function SuccessMessage() {
  const searchParams = useSearchParams();
  const signupSuccess = searchParams.get("signup") === "success";
  const [showSuccess, setShowSuccess] = useState(signupSuccess);

  useEffect(() => {
    if (signupSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [signupSuccess]);

  if (!showSuccess) return null;

  return (
    <div className="fixed top-4 right-2 sm:right-4 z-50 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-5 max-w-[calc(100vw-1rem)] sm:max-w-none">
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="text-xs sm:text-sm">Account created successfully! You can now sign in.</span>
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState({
    activeUsers: 10000,
    uptime: 99.9,
    support: "24/7",
    totalProducts: 0,
    totalSuppliers: 0,
    totalProjects: 0,
  });

  // Fetch landing page stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/landing/stats", {
          cache: 'no-store', // Ensure fresh data on each load
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched stats:", data); // Debug log
          setStats(data);
        } else {
          console.error("Failed to fetch stats:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Animation refs
  const badgeRef = useScrollAnimation({
    from: { opacity: 0, scale: 0.8, y: 20 },
    to: { opacity: 1, scale: 1, y: 0 },
    duration: 0.6,
    ease: "back.out(1.7)",
  });

  const descriptionRef = useScrollAnimation({
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 },
    duration: 0.8,
    delay: 0.2,
  });

  // Buttons should be visible immediately, so we'll animate them on mount
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buttonsRef.current) {
      gsap.fromTo(
        buttonsRef.current.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.4,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    }
  }, []);


  const dashboardRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Dashboard animation
  useGSAP(
    () => {
      if (!dashboardRef.current) return;

      gsap.fromTo(
        dashboardRef.current,
        { opacity: 0, scale: 0.9, y: 50, rotationX: -15 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotationX: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: dashboardRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      // Animate dashboard cards
      const cards = dashboardRef.current.querySelectorAll(".dashboard-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: dashboardRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    },
    { scope: dashboardRef }
  );

  // Features section animation
  useGSAP(
    () => {
      if (!featuresRef.current) return;

      const cards = featuresRef.current.querySelectorAll(".feature-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );
    },
    { scope: featuresRef }
  );

  // Benefits section animation
  useGSAP(
    () => {
      if (!benefitsRef.current) return;

      const items = benefitsRef.current.querySelectorAll(".benefit-item");
      gsap.fromTo(
        items,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: benefitsRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );

      const metrics = benefitsRef.current.querySelectorAll(".metric-card");
      gsap.fromTo(
        metrics,
        { opacity: 0, scale: 0.8, rotationY: -20 },
        {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: benefitsRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );
    },
    { scope: benefitsRef }
  );

  // CTA section animation
  useGSAP(
    () => {
      if (!ctaRef.current) return;

      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      const ctaButtons = ctaRef.current.querySelectorAll("button");
      gsap.fromTo(
        ctaButtons,
        { opacity: 0, scale: 0.9, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    },
    { scope: ctaRef }
  );
  return (
    <div className="min-h-screen bg-white/95 dark:bg-gray-900/95 transition-colors relative">
      <AnimatedBackground />

      {/* Success Message */}
      <Suspense fallback={null}>
        <SuccessMessage />
      </Suspense>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                QSales
              </h1>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xs:inline">
                Inventory Management
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/login"
                className="hidden md:block px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="hidden md:block px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </a>
              <ThemeToggle />
              <a
                href="/login"
                className="md:hidden px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 sm:pt-8 lg:pt-10 pb-16 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <div
                ref={badgeRef as React.RefObject<HTMLDivElement>}
                className="inline-block px-3 py-1 mb-4 sm:mb-6 text-xs sm:text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
              >
                Streamline Your Inventory
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight [font-size:0]">
                <SplitText
                  text="QSales"
                  className="text-blue-600 dark:text-blue-400 text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                  tag="span"
                  delay={50}
                  duration={0.6}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                />
                <SplitText
                  text=" Inventory Management"
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                  tag="span"
                  delay={50}
                  duration={0.6}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                />
              </h1>
              <p
                ref={descriptionRef as React.RefObject<HTMLParagraphElement>}
                className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed"
              >
                QSales is a comprehensive inventory management system designed for businesses that handle operational equipment, for-sale products, and package bundles. Track equipment with serial numbers, manage supplier relationships, create project proposals, and streamline your entire inventory workflow.
              </p>
              <div
                ref={buttonsRef as React.RefObject<HTMLDivElement>}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base px-6 sm:px-8 py-6 sm:py-7"
                >
                  Get Started
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 text-sm sm:text-base px-6 sm:px-8 py-6 sm:py-7 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="relative -mt-16 sm:-mt-24 lg:-mt-32" ref={dashboardRef}>
              <div className="w-full h-full min-h-[200px] sm:min-h-[300px] lg:min-h-[400px] flex items-center justify-center">
                <LottieAnimation
                  animationData={sellAnimationData}
                  className="w-full h-full"
                  loop={true}
                  autoplay={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <SplitText
              text="Powerful Features"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 block"
              tag="h2"
              delay={30}
              duration={0.8}
              ease="power3.out"
              splitType="words"
              from={{ opacity: 0, y: 30 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Everything you need to manage your inventory efficiently
            </p>
          </div>
          <div ref={featuresRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                icon: Wrench,
                title: "Operational Equipment Management",
                description:
                  "Track operational equipment with serial numbers, quantities, conditions, and damage status. Monitor equipment usage across projects.",
              },
              {
                icon: Package,
                title: "For-Sale Products Catalog",
                description:
                  "Manage your product inventory with supplier information, costs, SRP, locations, and detailed descriptions. Track quantities and box quantities.",
              },
              {
                icon: ShoppingCart,
                title: "Package & Bundle Deals",
                description:
                  "Create and manage package bundles with multiple products. Set custom pricing and track bundle inventory separately.",
              },
              {
                icon: ClipboardList,
                title: "Project Proposals",
                description:
                  "Create detailed project proposals with equipment lists, pricing, and client information. Track proposal status and manage approvals.",
              },
              {
                icon: Building2,
                title: "Supplier Management",
                description:
                  "Maintain a comprehensive supplier directory with contact information, status tracking, and supplier profiles for easy reference.",
              },
              {
                icon: FileText,
                title: "Sales Orders & Delivery",
                description:
                  "Manage delivery receipts, track order status, and monitor sales orders with detailed delivery information and file attachments.",
              },
              {
                icon: QrCode,
                title: "QR & Barcode Generation",
                description:
                  "Generate QR codes and barcodes for all inventory items. Print labels and track items efficiently with scanning capabilities.",
              },
              {
                icon: DollarSign,
                title: "Cost Tracking & Updates",
                description:
                  "Track cost history for equipment and products. Update costs over time and view pricing trends with comprehensive cost analytics.",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description:
                  "Get insights into inventory trends, equipment usage, project metrics, and cost analysis with comprehensive dashboard analytics.",
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="feature-card bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
      >
        <div className="container mx-auto max-w-7xl">
          <div ref={benefitsRef} className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <SplitText
                text="Why Choose QSales?"
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 block"
                tag="h2"
                delay={30}
                duration={0.8}
                ease="power3.out"
                splitType="words"
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="left"
              />
              <div className="space-y-4 sm:space-y-6">
                {[
                  {
                    title: "Centralized Inventory Control",
                    description:
                      "Manage operational equipment, for-sale products, and package bundles all in one place. Track serial numbers, quantities, conditions, and locations with ease.",
                  },
                  {
                    title: "Streamlined Project Management",
                    description:
                      "Create project proposals, assign equipment to projects, and track usage. Generate professional proposals with detailed equipment lists and pricing.",
                  },
                  {
                    title: "Complete Supply Chain Visibility",
                    description:
                      "Manage suppliers, track costs, monitor delivery receipts, and maintain a complete client directory. Get full visibility into your supply chain operations.",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="benefit-item flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
                <div className="metric-card bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 shadow-lg">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Key Metrics
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      {
                        label: "Total Products",
                        value: stats.totalProducts.toString(),
                        width: stats.totalProducts > 0 ? `${Math.min((stats.totalProducts / 100) * 100, 100)}%` : "0%",
                        color: "bg-blue-600"
                      },
                      {
                        label: "Active Suppliers",
                        value: stats.totalSuppliers.toString(),
                        width: stats.totalSuppliers > 0 ? `${Math.min((stats.totalSuppliers / 50) * 100, 100)}%` : "0%",
                        color: "bg-green-600"
                      },
                      {
                        label: "Project Proposals",
                        value: stats.totalProjects.toString(),
                        width: stats.totalProjects > 0 ? `${Math.min((stats.totalProjects / 25) * 100, 100)}%` : "0%",
                        color: "bg-purple-600"
                      },
                    ].map((metric, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            {metric.label}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {metric.value}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${metric.color} h-2 rounded-full transition-all`}
                            style={{ width: metric.width }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-100/80 dark:bg-gray-800/70 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center">
          <SplitText
            text="Ready to Transform Your Inventory Management?"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 block px-4"
            tag="h2"
            delay={40}
            duration={0.8}
            ease="power3.out"
            splitType="words"
            from={{ opacity: 0, y: 30 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
          />
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4">
            Join businesses using QSales to manage operational equipment, track products, create project proposals, and streamline their entire inventory workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg">
              Start Free Trial
            </button>
            <button className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-gray-900 dark:text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">QSales</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                The modern inventory management system for growing businesses.
              </p>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Company</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-300 dark:border-gray-800 pt-6 sm:pt-8 text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400">
            <p>© 2024 QSales. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
