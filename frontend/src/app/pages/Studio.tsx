import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, useMotionValue, useTransform } from 'motion/react';
import { ArrowRight, MessageSquare, Shield, Zap, Globe, Sparkles, ChevronDown, Star, Heart, Code, Layers, Smartphone, Lock } from 'lucide-react';

/* ========== 动画定义 ========== */
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

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

/* ========== 导航栏 ========== */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const navLinks = [
    { id: 'about', label: '关于' },
    { id: 'products', label: '产品' },
    { id: 'features', label: '特色' },
    { id: 'contact', label: '联系' },
  ];

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? 'bg-white/75 dark:bg-black/75 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.05)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/studio-logo.svg" alt="" className="w-8 h-8" />
          <span className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">冰网工作室</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <a
          href="/"
          className="px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-lg"
        >
          使用产品
        </a>
      </div>
    </motion.header>
  );
}

/* ========== Hero 区域 ========== */
function HeroSection() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-black dark:via-gray-950/50 dark:to-black" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-red-100/40 to-orange-100/40 dark:from-red-900/10 dark:to-orange-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-purple-100/30 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {loaded && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <motion.img
              src="/studio-logo.svg"
              alt=""
              className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-10"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.05]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              冰网工作室
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-4 font-light leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              用技术连接世界，让沟通更简单
            </motion.p>

            <motion.p
              className="text-sm text-gray-400 dark:text-gray-500 mb-12 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              2020.1.15 — 至今
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <a
                href="/"
                className="px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                体验 Code Kitty IM
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="https://github.com/jishugou666/code-Kitty-im"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium text-base hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center"
              >
                GitHub 开源
              </a>
            </motion.div>
          </motion.div>
        )}
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer"
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-6 h-6 text-gray-400" />
      </motion.div>
    </section>
  );
}

/* ========== 关于区域 ========== */
function AboutSection() {
  const stats = [
    { number: '6+', label: '年发展历程' },
    { number: '10K+', label: '活跃用户' },
    { number: '99.9%', label: '服务可用性' },
    { number: '24/7', label: '技术支持' },
  ];

  return (
    <section id="about" className="py-24 md:py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection className="text-center mb-16 md:mb-20">
          <span className="inline-block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">关于</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            始于热爱，忠于品质
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            冰网工作室成立于2020年，致力于用前沿技术打造优秀的互联网产品。我们相信技术的力量可以让沟通变得更加简单、高效和有趣。
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i} className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                {stat.number}
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">{stat.label}</div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== 产品区域 ========== */
function ProductsSection() {
  return (
    <section id="products" className="py-24 md:py-32 px-6 bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection className="text-center mb-16 md:mb-20">
          <span className="inline-block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">产品</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            精心打造每一个产品
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            我们以极致的态度打磨产品细节，追求最佳用户体验
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800">
            <div className="grid md:grid-cols-2">
              <div className="p-8 sm:p-10 md:p-14 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  Code Kitty IM
                </h3>
                <p className="text-base text-blue-500 font-medium mb-4">现代即时通讯平台</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                  支持单聊、群聊、朋友圈的完整即时通讯平台，采用 React + Node.js + MySQL 构建，已上线运营。
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {['端到端加密', '多端同步', '实时推送', '群组管理'].map((f) => (
                    <span key={f} className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-lg group"
                  >
                    立即体验
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                  <a
                    href="https://github.com/jishugou666/code-Kitty-im"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors underline underline-offset-4"
                  >
                    查看源码
                  </a>
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 p-8 sm:p-10 md:p-14 flex items-center justify-center min-h-[360px] md:min-h-[440px]">
                <div className="relative">
                  <motion.div
                    className="w-56 h-80 sm:w-64 sm:h-96 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2rem] shadow-2xl shadow-blue-500/30 flex items-center justify-center relative overflow-hidden"
                    initial={{ opacity: 0, y: 30, rotateY: -10 }}
                    whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                    <div className="relative text-center text-white z-10">
                      <MessageSquare className="w-14 h-14 mx-auto mb-4 opacity-90" />
                      <p className="text-lg font-semibold mb-1">Code Kitty</p>
                      <p className="text-sm opacity-70">即时通讯</p>
                    </div>
                    <div className="absolute top-4 left-4 right-4 h-6 bg-white/20 rounded-full" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-3 -right-3 w-6 h-6 bg-green-400 rounded-full border-4 border-white dark:border-gray-900 shadow-lg"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ========== 特色区域 ========== */
function FeaturesSection() {
  const features = [
    { icon: Code, title: '前沿技术', description: 'React 18 + TypeScript + Node.js 现代技术栈' },
    { icon: Lock, title: '安全可靠', description: 'JWT 认证、数据加密、多层安全防护' },
    { icon: Zap, title: '极致性能', description: '优化的数据库查询、CDN 加速、毫秒级响应' },
    { icon: Globe, title: '全球部署', description: 'Vercel + Render + TiDB Cloud 全球基础设施' },
    { icon: Smartphone, title: '全端适配', description: '桌面端 + 移动端完整适配，流畅体验' },
    { icon: Layers, title: '持续迭代', description: '基于用户反馈快速迭代，保持产品竞争力' },
  ];

  return (
    <section id="features" className="py-24 md:py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection className="text-center mb-16 md:mb-20">
          <span className="inline-block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">特色</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            为什么选择我们
          </h2>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <AnimatedSection key={feature.title} delay={i}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="p-6 md:p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none transition-shadow h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
                  <feature.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== CTA 区域 ========== */
function CTASection() {
  return (
    <section id="contact" className="py-24 md:py-32 px-6 bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-[800px] mx-auto text-center">
        <AnimatedSection>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            准备好开始了吗？
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            加入 Code Kitty IM，体验全新的即时通讯方式
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              免费开始使用
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="https://github.com/jishugou666/code-Kitty-im"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium text-base hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center"
            >
              GitHub 开源
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ========== 页脚 ========== */
function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/studio-logo.svg" alt="" className="w-6 h-6" />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">冰网工作室</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="https://github.com/jishugou666/code-Kitty-im" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            GitHub
          </a>
          <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">© 2020-2026 冰网工作室</span>
        </div>
      </div>
    </footer>
  );
}

/* ========== 主组件 ========== */
export default function Studio() {
  return (
    <div className="min-h-screen bg-white dark:bg-black antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ProductsSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
