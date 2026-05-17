import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown, Star, Eye, ExternalLink, Loader2, Save, Search, Zap } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const CODEMAO_PROXY = `${API_BASE_URL}/proxy/studio`;
const WORKSHOP_ID = 549;

const DISPLAY_COUNT = 8;

interface WorkItem {
  id: number;
  name: string;
  preview: string;
  praise_times: number;
  view_times: number;
  audited_at: number;
  user: { nickname: string; avatar_url: string };
}

interface WorkshopInfo {
  name: string;
  description: string;
  n_works: number;
  n_views: number;
  n_likes: number;
  total_score: number;
  level: number;
}

interface MemberItem {
  user_id: number;
  name: string;
  avatar_url: string;
  position: string;
  n_works: number;
  latest_work_at: number;
  description?: string;
  doing?: string;
  praiseTimes?: number;
  viewTimes?: number;
}

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

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

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
          {[{ id: 'about', label: '关于' }, { id: 'works', label: '作品' }, { id: 'members', label: '成员' }].map((link) => (
            <button key={link.id} onClick={() => scrollToSection(link.id)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors">
              {link.label}
            </button>
          ))}
        </nav>
        <a href="/" className="px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-lg">
          使用产品
        </a>
      </div>
    </motion.header>
  );
}

function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const targetDate = new Date('2027-01-15T00:00:00').getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-black dark:via-gray-950/50 dark:to-black" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-red-200/60 via-orange-200/50 to-amber-200/40 dark:from-red-800/30 dark:via-orange-800/25 dark:to-amber-800/20 rounded-full blur-[140px]" animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-rose-200/50 to-red-200/50 dark:from-rose-800/20 dark:to-red-800/20 rounded-full blur-[100px]" animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
        <motion.div className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px] bg-gradient-to-br from-orange-200/40 to-red-200/40 dark:from-orange-800/15 dark:to-red-800/15 rounded-full blur-[90px]" animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      </div>
      {loaded && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.img src="/studio-logo.svg" alt="" className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 mx-auto mb-10" initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          <motion.h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.05]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            冰网工作室
          </motion.h1>
          <motion.p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-4 font-light leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            用技术连接世界，让沟通更简单
          </motion.p>
          <motion.p className="text-sm text-gray-400 dark:text-gray-500 mb-8 font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            2020.1.15 — 至今
          </motion.p>
          <motion.div className="flex items-center justify-center gap-2 mb-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">距七周年还有</span>
            <div className="flex items-center gap-1.5">
              {[
                { value: timeLeft.days, label: '天' },
                { value: timeLeft.hours, label: '时' },
                { value: timeLeft.minutes, label: '分' },
                { value: timeLeft.seconds, label: '秒' },
              ].map((unit, i) => (
                <div key={unit.label} className="flex items-center gap-1.5">
                  <div className="flex items-baseline gap-0.5">
                    <motion.span key={unit.value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }} className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                      {String(unit.value).padStart(2, '0')}
                    </motion.span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{unit.label}</span>
                  </div>
                  {i < 3 && <span className="text-gray-300 dark:text-gray-600 font-light text-sm">:</span>}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <a href="/" className="px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-xl flex items-center justify-center gap-2 group">
              体验 Code Kitty IM
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="https://shequ.codemao.cn/work_shop/549" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium text-base hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center">
              编程猫工作室
            </a>
          </motion.div>
        </motion.div>
      )}
      <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
        <ChevronDown className="w-6 h-6 text-gray-400" />
      </motion.div>
    </section>
  );
}

function AboutSection({ info, loading }: { info: WorkshopInfo | null; loading: boolean }) {
  const mainDescription = info?.description?.split('\n').filter((l) => l.trim())[0] || '冰网工作室成立于2020年，致力于用前沿技术打造优秀的互联网产品。';
  const stats = info
    ? [
        { number: `${info.n_works.toLocaleString()}`, label: '投稿作品' },
        { number: `${(info.n_views / 1000).toFixed(0)}K+`, label: '总浏览量' },
        { number: `${new Date().getFullYear() - 2020}+`, label: '年发展历程' },
        { number: `${info.level}`, label: '工作室等级' },
      ]
    : [];

  return (
    <section id="about" className="py-24 md:py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection className="text-center mb-16 md:mb-20">
          <span className="inline-block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">关于</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">始于热爱，忠于品质</h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">{mainDescription}</p>
        </AnimatedSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mx-auto mb-2" />
                  <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mx-auto" />
                </div>
              ))
            : stats.map((stat, i) => (
                <AnimatedSection key={stat.label} delay={i} className="text-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{stat.number}</div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">{stat.label}</div>
                </AnimatedSection>
              ))}
        </div>
      </div>
    </section>
  );
}

interface WorksSectionProps {
  works: WorkItem[];
  loading: boolean;
  onDrop: (slotIndex: number, work: WorkItem) => void;
  dragWorkRef: React.MutableRefObject<WorkItem | null>;
}

function WorksSection({ works, loading, onDrop, dragWorkRef }: WorksSectionProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const work = dragWorkRef.current;
    if (work) {
      onDrop(index, work);
    }
  };

  return (
    <section id="works" className="py-24 md:py-32 px-6 bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection className="text-center mb-16 md:mb-20">
          <span className="inline-block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">作品</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">工作室优秀作品</h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">来自编程猫社区的真实作品数据，按热度排行展示</p>
        </AnimatedSection>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {works.map((work, i) => (
              <AnimatedSection key={work.id} delay={i * 0.08}>
                <motion.a
                  href={`https://shequ.codemao.cn/work/${work.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                  className="block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all h-full group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={work.preview} alt={work.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
                      <Star className="w-3 h-3" />
                      <span>{work.praise_times.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">{work.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={work.user.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{work.user.nickname}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Eye className="w-3 h-3" />
                        <span>{(work.view_times / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                </motion.a>
              </AnimatedSection>
            ))}
          </div>
        )}

        <AnimatedSection className="text-center mt-12">
          <a href="https://shequ.codemao.cn/work_shop/549" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-lg group">
            查看全部作品
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </AnimatedSection>
      </div>
    </section>
  );
}

function MembersSection({ members, loading }: { members: MemberItem[]; loading: boolean }) {
  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'LEADER': return '室长';
      case 'DEPUTYLEADER': return '副室长';
      default: return '';
    }
  };

  return (
    <section id="members" className="py-24 md:py-32 px-6 bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection className="text-center mb-16 md:mb-20">
          <span className="inline-block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">团队</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">工作室核心成员</h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">引领工作室发展方向的核心团队</p>
        </AnimatedSection>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
              {members.map((member, i) => (
                <AnimatedSection key={member.user_id} delay={i * 0.08}>
                  <motion.a
                    href={`https://shequ.codemao.cn/user/${member.user_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="block group"
                  >
                    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all w-[200px] h-[280px] flex flex-col">
                      <div className="pt-6 pb-2 px-4 text-center flex-shrink-0">
                        <img src={member.avatar_url} alt={member.name} className="w-20 h-20 rounded-2xl object-cover mx-auto group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      </div>
                      <div className="px-4 pb-4 pt-1 text-center flex-1 flex flex-col justify-between">
                        <div>
                          <div className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full mb-3">
                            {getPositionLabel(member.position)}
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{member.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2.5 min-h-[2.5rem]">{member.description || member.doing || '暂无简介'}</p>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                          <span>{member.n_works} 作品</span>
                          <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                          <span>{(member.praiseTimes || 0).toLocaleString()} 获赞</span>
                        </div>
                      </div>
                    </div>
                  </motion.a>
                </AnimatedSection>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/studio-logo.svg" alt="" className="w-6 h-6" />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">冰网工作室</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500"> 2020-2026 冰网工作室</span>
      </div>
    </footer>
  );
}

interface StudioConfigPreviewProps {
  onSave: (workIds: number[]) => Promise<void>;
  isSaving: boolean;
}

export default function StudioConfigPreview({ onSave, isSaving }: StudioConfigPreviewProps) {
  const [displayedWorks, setDisplayedWorks] = useState<WorkItem[]>([]);
  const [allWorks, setAllWorks] = useState<WorkItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [workshopInfo, setWorkshopInfo] = useState<WorkshopInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [worksLoading, setWorksLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedWorkIds, setSavedWorkIds] = useState<number[]>([]);
  const dragWorkRef = useRef<WorkItem | null>(null);

  const filteredAllWorks = allWorks.filter(
    (w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDrop = useCallback((slotIndex: number, work: WorkItem) => {
    setDisplayedWorks((prev) => {
      const next = [...prev];
      next[slotIndex] = work;
      return next;
    });
  }, []);

  const handleDragStart = useCallback((work: WorkItem) => {
    dragWorkRef.current = work;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const configRes = await fetch(`${API_BASE_URL}/studio/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const [infoRes, worksRes, membersRes] = await Promise.all([
          fetch(`${CODEMAO_PROXY}/web/shops/${WORKSHOP_ID}`),
          fetch(`${CODEMAO_PROXY}/web/works/subjects/${WORKSHOP_ID}/works?limit=50&sort=-n_likes`),
          fetch(`${CODEMAO_PROXY}/web/shops/${WORKSHOP_ID}/users?limit=6`),
        ]);

        let savedIds: number[] = [];
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.code === 200 && configData.data?.works?.ids) {
            savedIds = configData.data.works.ids;
            setSavedWorkIds(savedIds);
          }
        }

        if (infoRes.ok) {
          const data = await infoRes.json();
          setWorkshopInfo(data);
        }
        setInfoLoading(false);

        if (worksRes.ok) {
          const data = await worksRes.json();
          const works: WorkItem[] = data.items || [];
          setAllWorks(works);

          if (savedIds.length > 0) {
            const displayWorks = savedIds.map((id) => works.find((w) => w.id === id)).filter(Boolean) as WorkItem[];
            setDisplayedWorks(displayWorks);
          } else {
            setDisplayedWorks(works.slice(0, DISPLAY_COUNT));
          }
        }

        if (membersRes.ok) {
          const data = await membersRes.json();
          const coreMembers = (data.items || []).filter((m: MemberItem) => m.position === 'LEADER' || m.position === 'DEPUTYLEADER');
          const sortedMembers = coreMembers.sort((a: MemberItem, b: MemberItem) => {
            const order = { LEADER: 0, DEPUTYLEADER: 1 };
            return (order[a.position as keyof typeof order] ?? 3) - (order[b.position as keyof typeof order] ?? 3);
          });

          const memberInfoPromises = sortedMembers.map(async (member: MemberItem) => {
            try {
              const res = await fetch(`${CODEMAO_PROXY}/api/user/info/detail/${member.user_id}`);
              if (res.ok) {
                const userInfoData = await res.json();
                const userInfo = userInfoData.data?.userInfo;
                if (userInfo) {
                  return {
                    ...member,
                    description: userInfo.user?.description || '',
                    doing: userInfo.user?.doing || '',
                    praiseTimes: userInfo.praiseTimes || 0,
                    viewTimes: userInfo.viewTimes || 0,
                    collectionTimes: userInfo.collectionTimes || 0,
                    forkedTimes: userInfo.forkedTimes || 0,
                  };
                }
              }
            } catch (e) {
              console.error(`Failed to fetch user info for ${member.name}:`, e);
            }
            return member;
          });

          const membersWithInfo = await Promise.all(memberInfoPromises);
          setMembers(membersWithInfo);
        }
      } catch (e) {
        console.error('Failed to fetch studio data:', e);
        setInfoLoading(false);
      } finally {
        setWorksLoading(false);
        setMembersLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="h-full flex bg-white dark:bg-[#0A0C10]">
      <div className="flex-1 overflow-auto">
        <div className="bg-white dark:bg-black antialiased">
          <Navbar />
          <main>
            <HeroSection />
            <AboutSection info={workshopInfo} loading={infoLoading} />
            <WorksSection works={displayedWorks} loading={worksLoading} onDrop={handleDrop} dragWorkRef={dragWorkRef} />
            <MembersSection members={members} loading={membersLoading} />
          </main>
          <Footer />
        </div>
      </div>

      {/* 右侧备选栏 */}
      <div className="w-80 border-l border-black/10 dark:border-white/10 flex flex-col bg-white dark:bg-[#13161A]">
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-black dark:text-white">作品备选</h3>
            <span className="text-xs text-black/40 dark:text-white/40">{allWorks.length} 个作品</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" />
            <input
              type="text"
              placeholder="搜索作品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#007AFF] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {worksLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-black/5 dark:bg-white/5" />
                <div className="p-3">
                  <div className="h-3 w-3/4 bg-black/5 dark:bg-white/5 rounded mb-2" />
                  <div className="h-2 w-1/2 bg-black/5 dark:bg-white/5 rounded" />
                </div>
              </div>
            ))
          ) : filteredAllWorks.length === 0 ? (
            <div className="text-center py-8 text-black/40 dark:text-white/40 text-sm">暂无匹配作品</div>
          ) : (
            filteredAllWorks.map((work) => (
              <div
                key={work.id}
                draggable
                onDragStart={() => handleDragStart(work)}
                className="bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-[#007AFF] transition-all group"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={work.preview} alt={work.name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-[10px]">
                    <Star className="w-3 h-3" />
                    <span>{work.praise_times.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-black dark:text-white mb-1 line-clamp-1">{work.name}</h4>
                  <div className="flex items-center justify-between text-black/40 dark:text-white/40">
                    <div className="flex items-center gap-1.5">
                      <img src={work.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                      <span className="text-[10px] truncate max-w-[60px]">{work.user.nickname}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <Eye className="w-2.5 h-2.5" />
                      <span>{(work.view_times / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-black/10 dark:border-white/10 space-y-2">
          <button
            onClick={() => {
              const workIds = displayedWorks.map((w) => w.id);
              onSave(workIds);
            }}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={16} />
                保存作品配置
              </>
            )}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-black/30 dark:text-white/30">
            <Zap size={12} />
            <span>拖拽右侧作品到页面中替换</span>
          </div>
        </div>
      </div>
    </div>
  );
}
