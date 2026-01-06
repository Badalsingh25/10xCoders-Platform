import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import axios from 'axios';
import ProgressMap from "./ProgressMap";
import {
  ArrowRight,
  Code,
  BookOpen,
  BarChart2,
  Terminal,
  Cpu,
  Globe,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  FileText,
  Bot,
  Users,
  Award
} from "lucide-react";

const Home = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const heroRef = useRef(null);
  const navigate = useNavigate();

  // Parallax effect using framer-motion
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Extract token from URL if redirected from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    let storedToken = localStorage.getItem('token');

    if (token) {
      storedToken = token;
      localStorage.setItem('user', JSON.stringify({ token }));
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (storedToken) {
      setIsLoggedIn(true);
      fetchUserStats(storedToken);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchUserStats = async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/users/me`, config);
      if (data && data.dashboardStats) {
        setUserStats(data.dashboardStats);
      }
    } catch (error) {
      console.error("Failed to fetch user stats for home page", error);
    }
  };

  const categories = [
    { id: "all", name: "All Tools" },
    { id: "learn", name: "Learning" },
    { id: "career", name: "Career" },
    { id: "practice", name: "Practice" }
  ];

  const cards = [
    {
      title: "Kanban Board",
      description: "Organize your tasks and manage your projects efficiently",
      color: "from-sky-400 to-blue-500",
      textColor: "text-sky-800",
      bgColor: "bg-gradient-to-br from-sky-50 to-blue-100",
      icon: <Terminal size={28} />,
      link: "/todo",
      category: "practice",
      popular: true
    },
    {
      title: "AI Personal Tutor",
      description: "24/7 AI mentor for code explanations, interview prep, and doubts.",
      color: "from-blue-400 to-indigo-500",
      textColor: "text-blue-800",
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
      icon: <Bot size={28} />,
      link: "/ai-tutor",
      category: "career",
      new: true
    },
    {
      title: "Career Agent",
      description: "Get personalized career advice and job matches",
      color: "from-blue-400 to-indigo-500",
      textColor: "text-blue-800",
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
      icon: <Code size={28} />,
      link: "/career",
      category: "career",
      new: true
    },
    {
      title: "AI Quiz Engine",
      description: "AI-generated quizzes to test your skills and find weak areas.",
      color: "from-pink-400 to-rose-500",
      textColor: "text-pink-800",
      bgColor: "bg-gradient-to-br from-pink-50 to-rose-100",
      icon: <Award size={28} />,
      link: "/quiz",
      category: "practice",
      new: true
    },
    {
      title: "Community & AI Doubt Solver",
      description: "Ask doubts, discuss with peers, and get instant AI solutions from images.",
      color: "from-violet-400 to-purple-500",
      textColor: "text-violet-800",
      bgColor: "bg-gradient-to-br from-violet-50 to-purple-100",
      icon: <Users size={28} />,
      link: "/community",
      category: "community",
      new: true
    },
    {
      title: "Personalized Roadmaps",
      description: "Custom learning paths tailored to your specific career goals",
      color: "from-purple-400 to-violet-500",
      textColor: "text-purple-800",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-100",
      icon: <BookOpen size={28} />,
      link: "/roadmaps",
      category: "learn"
    },


    {
      title: "AI Code Translator",
      description: "Instantly translate code between languages and get detailed explanations.",
      color: "from-rose-500 to-red-600",
      textColor: "text-rose-800",
      bgColor: "bg-gradient-to-br from-rose-50 to-red-100",
      icon: <Globe size={28} />,
      link: "/translate",
      category: "practice",
      new: true
    },
    {
      title: "Courses",
      description: "Structured learning from beginner to advanced with expert instructors",
      color: "from-indigo-500 to-blue-500",
      textColor: "text-indigo-800",
      bgColor: "bg-gradient-to-br from-indigo-50 to-blue-100",
      icon: <BarChart2 size={28} />,
      link: "/courses",
      category: "learn",
      popular: true
    },
    {
      title: "Resume Maker",
      description: "Create tech-focused resumes that get noticed by top companies",
      color: "from-sky-400 to-blue-500",
      textColor: "text-sky-800",
      bgColor: "bg-gradient-to-br from-sky-50 to-blue-100",
      icon: <Terminal size={28} />,
      link: "/resume",
      category: "career"
    },
    {
      title: "Resume Enhancer",
      description: "AI-powered resume improvements and feedback from industry experts",
      color: "from-amber-400 to-orange-500",
      textColor: "text-amber-800",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-100",
      icon: <Cpu size={28} />,
      link: "/enhance",
      category: "career"
    },
    {
      title: "Interview Preparation",
      description: "Practice with real interview questions from top tech companies",
      color: "from-emerald-400 to-green-500",
      textColor: "text-emerald-800",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-100",
      icon: <MessageSquare size={28} />,
      link: "/interview",
      category: "career",
      new: true
    },
    {
      title: "Typing Speed Enhancer",
      description: "Improve your coding speed and accuracy with specialized exercises",
      color: "from-rose-400 to-pink-500",
      textColor: "text-rose-800",
      bgColor: "bg-gradient-to-br from-rose-50 to-pink-100",
      icon: <Code size={28} />,
      link: "/type",
      category: "practice"
    },
    {
      title: "Coding Practice",
      description: "Sharpen your skills with hundreds of real-world coding challenges",
      color: "from-rose-400 to-pink-500",
      textColor: "text-rose-800",
      bgColor: "bg-gradient-to-br from-rose-50 to-pink-100",
      icon: <Globe size={28} />,
      link: "/code",
      category: "practice",
      popular: true
    },
    {
      title: "PDF Tools",
      description: "Merge PDFs and manage documents used in your learning journey",
      color: "from-indigo-400 to-fuchsia-500",
      textColor: "text-indigo-800",
      bgColor: "bg-gradient-to-br from-indigo-50 to-fuchsia-100",
      icon: <FileText size={28} />,
      link: "/pdf-tools",
      category: "practice",
      new: true
    }
  ];

  const filteredCards = activeCategory === "all"
    ? cards
    : cards.filter(card => card.category === activeCategory);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } }
  };

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Frontend Developer at Google",

      text: "10xCoders transformed my career. The personalized roadmap helped me go from junior to senior developer in just 8 months."
    },
    {
      name: "Michael Chen",
      role: "Full Stack Engineer",

      text: "The interview preparation was spot on. I landed offers from three top tech companies after just 6 weeks of practice."
    },
    {
      name: "Priya Sharma",
      role: "Machine Learning Engineer",

      text: "The AI career agent matched me with opportunities I never would have found otherwise. Now I'm working at my dream company!"
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, rgba(79, 70, 229, 0.3) 0%, transparent 60%),
                             radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, rgba(37, 99, 235, 0.3) 0%, transparent 40%),
                             radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Animated blobs */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-bl from-indigo-600 to-blue-500 opacity-10 blur-3xl"
        style={{ translateY: scrollY * 0.3 }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      <motion.div
        className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-10 blur-3xl"
        style={{ translateY: scrollY * -0.2 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.14, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-tl from-purple-400 to-indigo-500 opacity-10 blur-3xl"
        style={{ translateY: scrollY * 0.1 }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.1, 0.13, 0.1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2
        }}
      />

      {/* Hero Section */}
      <motion.div
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative z-10 px-4 pt-32 pb-12 max-w-7xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-block mb-4 px-6 py-2 bg-indigo-100 backdrop-blur-sm rounded-full shadow-sm">
            <span className="text-indigo-700 font-medium flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-pulse"></span>
              Level Up Your Coding Skills
            </span>
          </div>

          <h1 className="font-extrabold text-gray-900 text-5xl md:text-6xl lg:text-7xl tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">10xCoders</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Your all-in-one platform to learn, practice, and advance your programming career. Personalized learning paths, career guidance, and expert mentorship - all in one place.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center"
              onClick={() => navigate(isLoggedIn ? "/courses" : "/login")}
            >
              <span>Start Coding Now</span>
              <ChevronRight size={18} className="ml-1" />
            </button>
            <button
              className="px-8 py-3 rounded-full bg-white text-gray-800 font-medium border border-gray-300 hover:bg-gray-100 transition-all duration-300 flex items-center justify-center"
              onClick={() => navigate(isLoggedIn ? "/roadmaps" : "/login")}
            >
              <span>Explore Paths</span>
              <ArrowRight size={18} className="ml-1" />
            </button>
          </div>



        </motion.div>
      </motion.div>

      {/* Features Section */}
      <div id="features" className="relative z-10 px-4 py-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-bold text-3xl md:text-4xl text-gray-900">
            What would you like to learn today?
          </h2>
          <div className="mt-2 h-1 w-20 bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Explore our comprehensive suite of tools designed to accelerate your coding journey and tech career
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${activeCategory === category.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          <AnimatePresence>
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.title}
                variants={item}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25 }}
                onHoverStart={() => setHoveredCard(card.title)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Link
                  to={card.link}
                  className={`${card.bgColor} rounded-2xl overflow-hidden group transition-all duration-500 transform hover:scale-105 hover:shadow-xl flex flex-col h-full relative`}
                  aria-label={`Explore ${card.title}`}
                >
                  {/* Badge for new or popular items */}
                  {card.new && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      NEW
                    </div>
                  )}
                  {card.popular && !card.new && (
                    <div className="absolute top-4 right-4 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      POPULAR
                    </div>
                  )}

                  <div className="p-6 flex flex-col h-full">
                    <div className={`w-12 h-12 mb-4 rounded-lg flex items-center justify-center bg-gradient-to-r ${card.color} text-white shadow-md transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      {card.icon}
                    </div>
                    <h3 className={`font-bold text-xl ${card.textColor}`}>{card.title}</h3>
                    <p className={`mt-2 ${card.textColor} opacity-80`}>{card.description}</p>
                    <div className="mt-auto pt-4 flex items-center font-medium">
                      <span className={`${card.textColor}`}>Explore</span>
                      <ArrowRight
                        size={16}
                        className={`ml-2 transition-transform duration-300 ${hoveredCard === card.title ? "translate-x-1" : ""
                          } ${card.textColor}`}
                      />
                    </div>
                  </div>
                  <div className={`h-1 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${card.color}`}></div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Progress Map Section */}
      <ProgressMap stats={userStats} />

      {/* Stats Section */}
      <div className="relative z-10 px-4 py-16 bg-gradient-to-b from-gray-50 via-indigo-50/50 to-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto rounded-3xl overflow-hidden backdrop-blur-md bg-white shadow-lg border border-gray-200"
        >
          <div className="px-6 py-12 md:px-10 md:py-16 text-center">
            <h2 className="font-bold text-2xl md:text-3xl text-gray-900 mb-10">
              Join thousands transforming their careers with 10xCoders
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">50K+</p>
                <p className="text-gray-600 mt-2">Active Coders</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">1000+</p>
                <p className="text-gray-600 mt-2">Coding Challenges</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">300+</p>
                <p className="text-gray-600 mt-2">Course Modules</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">92%</p>
                <p className="text-gray-600 mt-2">Placement Rate</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" className="relative z-10 px-4 py-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-bold text-3xl md:text-4xl text-gray-900">
            What our members say
          </h2>
          <div className="mt-2 h-1 w-20 bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Hear from developers who transformed their careers with our platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">{testimonial.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      {!isLoggedIn && (
        <div className="relative z-10 px-4 py-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="px-6 py-12 md:px-10 md:py-16 text-center text-white relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white blur-3xl"></div>
                <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-white blur-3xl"></div>
              </div>

              <h2 className="font-bold text-2xl md:text-4xl text-white mb-4">
                Ready to become a better developer?
              </h2>
              <p className="text-white text-opacity-90 max-w-2xl mx-auto mb-8">
                Join thousands of developers who are transforming their careers with personalized learning paths, expert mentorship, and cutting-edge tools.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full bg-white text-indigo-600 font-medium shadow-lg transform transition-all duration-300 hover:shadow-white/20"
                onClick={() => navigate("/login")}
              >
                Get Started Free
              </motion.button>
              <p className="mt-4 text-sm text-white text-opacity-80">
                No credit card required. Start with our free plan today.
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pricing Section */}
      {!isLoggedIn && (
        <div id="pricing" className="relative z-10 px-4 py-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-bold text-3xl md:text-4xl text-gray-900">
              Simple, transparent pricing
            </h2>
            <div className="mt-2 h-1 w-20 bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Choose the plan that's right for your learning journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200"
            >
              <h3 className="font-bold text-xl text-gray-900">Free</h3>
              <p className="mt-2 text-gray-600">Perfect for beginners</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Limited coding challenges
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Basic roadmaps
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Community support
                </li>
              </ul>
              <button className="w-full px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-300" onClick={() => navigate("/login")}>
                Get Started
              </button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-b from-indigo-50 to-white p-8 rounded-2xl shadow-xl border border-indigo-100 relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                MOST POPULAR
              </div>
              <h3 className="font-bold text-xl text-indigo-800">Pro</h3>
              <p className="mt-2 text-indigo-700">For serious learners</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-indigo-800">$19</span>
                <span className="text-indigo-700">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center text-indigo-800">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Unlimited coding challenges
                </li>
                <li className="flex items-center text-indigo-800">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Personalized roadmaps
                </li>
                <li className="flex items-center text-indigo-800">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  All courses included
                </li>
                <li className="flex items-center text-indigo-800">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Resume builder tools
                </li>
                <li className="flex items-center text-indigo-800">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Priority email support
                </li>
              </ul>
              <button className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105" onClick={() => navigate("/login")}>
                Subscribe Now
              </button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200"
            >
              <h3 className="font-bold text-xl text-gray-900">Enterprise</h3>
              <p className="mt-2 text-gray-600">For teams and businesses</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Everything in Pro plan
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Team collaboration tools
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Custom learning paths
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  1-on-1 mentorship
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Dedicated support manager
                </li>
              </ul>
              <button className="w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-medium transition-all duration-300">
                Contact Sales
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Blog Section */}


      {/* Newsletter Section */}
      <div className="relative z-10 px-4 py-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-3xl overflow-hidden shadow-lg border border-gray-200 p-8 md:p-12"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-bold text-2xl md:text-3xl text-gray-900 mb-4">
              Stay updated with the latest in coding
            </h2>
            <p className="text-gray-600 mb-8">
              Subscribe to our newsletter to receive coding tips, career advice, and updates on new features
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30">
                Subscribe
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12 md:py-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  10xCoders
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Your all-in-one platform to learn, practice, and advance your programming career.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  <Github size={20} />
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">Platform</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Roadmaps</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Courses</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Career Tools</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Practice</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Press</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Support</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} 10xCoders. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;