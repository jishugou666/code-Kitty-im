import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { Code, Users, Globe, Sparkles, ArrowRight, MessageSquare, Shield, Zap, ChevronDown } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] } }
};

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-gray-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/studio-logo.svg" alt="冰网工作室" className="w-8 h-8" />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">冰网工作室</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['about', 'products', 'features', 'contact'].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors capitalize"
            >
              {item === 'about' ? '关于' : item === 'products' ? '产品' : item === 'features' ? '特色' : '联系'}
            </button>
          ))}
        </div>
        <a
          href="/"
          className="px-5 py-2 text-sm font-medium bg-[#FF5252] text-white rounded-full hover:bg-[#FF4444] transition-all hover:shadow-lg hover:shadow-red-500/25"
        >
          使用产品
        </a>
      </div>
    </motion.nav>
  );
}

function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-red-50 via-white to-white dark:from-gray-950 dark:via-black dark:to-black">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200/30 dark:bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-200/30 dark:bg-orange-900/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 text-center px-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.img
          src="/studio-logo.svg"
          alt="冰网工作室"
          className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-8"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          冰网工作室
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-4 max-w-2xl mx-auto"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
        >
          用技术连接世界，让沟通更简单
        </motion.p>

        <motion.p
          className="text-sm text-gray-400 dark:text-gray-500 mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={0.6}
        >
          2020.1.15 — 至今
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={0.8}
        >
          <a
            href="/"
            className="px-8 py-3.5 bg-[#FF5252] text-white rounded-full font-medium hover:bg-[#FF4444] transition-all hover:shadow-xl hover:shadow-red-500/25 flex items-center justify-center gap-2"
          >
            体验 Code Kitty IM
            <ArrowRight className="w-4 h-4" />
          </a>
          <button
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center"
          >
            了解更多
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-6 h-6 text-gray-400" />
      </motion.div>
    </section>
  );
}

function AboutSection() {
  const stats = [
    { number: '6+', label: '年发展历程' },
    { number: '10K+', label: '活跃用户' },
    { number: '99.9%', label: '服务可用性' },
    { number: '24/7', label: '技术支持' },
  ];

  return (
    <section id="about" className="py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-20">
          <p className="text-sm font-semibold text-[#FF5252] uppercase tracking-widest mb-4">关于我们</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            始于热爱，忠于品质
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            冰网工作室成立于2020年，致力于用前沿技术打造优秀的互联网产品。
            我们相信技术的力量可以让沟通变得更加简单、高效和有趣。
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 0.1} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  const products = [
    {
      icon: MessageSquare,
      name: 'Code Kitty IM',
      tagline: '现代即时通讯',
      description: '支持单聊、群聊、朋友圈的完整即时通讯平台，采用 React + Node.js 构建，支持多端同步。',
      gradient: 'from-blue-500 to-blue-600',
      features: ['端到端加密', '多端同步', '实时推送', '群组管理'],
    },
  ];

  return (
    <section id="products" className="py-32 px-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-20">
          <p className="text-sm font-semibold text-[#FF5252] uppercase tracking-widest mb-4">我们的产品</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            精心打造每一个产品
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            我们以极致的态度打磨产品细节，追求最佳用户体验
          </p>
        </AnimatedSection>

        {products.map((product, i) => (
          <AnimatedSection key={product.name} delay={i * 0.2}>
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <product.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {product.name}
                  </h3>
                  <p className="text-lg text-[#FF5252] font-medium mb-4">{product.tagline}</p>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {product.features.map((f) => (
                      <span
                        key={f}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF5252] text-white rounded-full font-medium hover:bg-[#FF4444] transition-all hover:shadow-lg hover:shadow-red-500/25 w-fit"
                  >
                    立即体验
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 md:p-12 flex items-center justify-center min-h-[400px]">
                  <div className="relative">
                    <div className="w-64 h-96 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl border border-blue-200/30 dark:border-blue-500/20 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <p className="text-blue-500 font-semibold">Code Kitty IM</p>
                        <p className="text-blue-400 text-sm mt-1">即时通讯</p>
                      </div>
                    </div>
                    <motion.div
                      className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-900"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Code, title: '前沿技术', description: '采用 React 18、TypeScript、Node.js 等现代技术栈，确保产品的高性能和可维护性' },
    { icon: Shield, title: '安全可靠', description: '多层安全防护，包括 JWT 认证、数据加密、防 SQL 注入等，保障用户数据安全' },
    { icon: Zap, title: '极致性能', description: '优化的数据库查询、Redis 缓存、CDN 加速，确保毫秒级响应速度' },
    { icon: Globe, title: '全球部署', description: '基于 Vercel、Render、TiDB Cloud 的全球基础设施，覆盖全球用户' },
    { icon: Sparkles, title: '用户体验', description: '精心打磨的界面设计和微交互动画，提供流畅自然的操作体验' },
    { icon: Users, title: '持续迭代', description: '基于用户反馈持续优化产品，快速响应需求，保持产品竞争力' },
  ];

  return (
    <section id="features" className="py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-20">
          <p className="text-sm font-semibold text-[#FF5252] uppercase tracking-widest mb-4">核心优势</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            为什么选择我们
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <AnimatedSection key={feature.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.3 }}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF5252] to-[#FF8A65]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <AnimatedSection>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            加入 Code Kitty IM，体验全新的即时通讯方式
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-8 py-3.5 bg-white text-[#FF5252] rounded-full font-semibold hover:bg-gray-100 transition-all hover:shadow-xl flex items-center justify-center gap-2"
            >
              免费开始使用
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/jishugou666/code-Kitty-im"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-white/20 text-white rounded-full font-medium hover:bg-white/30 transition-all border border-white/30 flex items-center justify-center"
            >
              GitHub 开源
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/studio-logo.svg" alt="冰网工作室" className="w-8 h-8" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">冰网工作室</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/jishugou666/code-Kitty-im" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              GitHub
            </a>
            <span className="text-sm text-gray-400">© 2020-2026 冰网工作室. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Studio() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ProductsSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
