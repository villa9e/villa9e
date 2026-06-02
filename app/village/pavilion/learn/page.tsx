'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '../page';

// ─── Pavilion / Learning & Courses ────────────────────────────────────────────

interface Course {
  id:          string;
  title:       string;
  instructor:  string;
  modules:     number;
  rating:      number;
  price:       number;
  enrolled:    boolean;
  progress:    number;
  category:    string;
  description: string;
}

const MOCK_COURSES: Course[] = [
  { id:'c1', title:'Goal GPS: 12-Week Sprint System', instructor:'Spirit AI', modules:8,  rating:4.9, price:0,  enrolled:true,  progress:65, category:'Personal',  description:'Master the Goal GPS framework to build, execute, and complete any major life goal in 12 weeks.' },
  { id:'c2', title:'Credit & Financial Foundation',  instructor:'Marcus Thompson', modules:12, rating:4.8, price:49, enrolled:true,  progress:20, category:'Finance',   description:'Build an unshakeable credit score and financial foundation from the ground up.' },
  { id:'c3', title:'Full-Stack Next.js Bootcamp',   instructor:'Kwame A.',         modules:24, rating:4.7, price:99, enrolled:false, progress:0,  category:'Tech',      description:'Build production-ready web apps with Next.js 14, TypeScript, Supabase, and Tailwind.' },
  { id:'c4', title:'Launch Your Brand in 30 Days',  instructor:'Nia James',        modules:10, rating:4.6, price:79, enrolled:false, progress:0,  category:'Business',  description:'From zero to a compelling brand identity and go-to-market strategy in one month.' },
  { id:'c5', title:'Functional Fitness Foundation', instructor:'Coach Darius',     modules:16, rating:4.5, price:39, enrolled:false, progress:0,  category:'Health',    description:'Build real-world strength, mobility, and endurance without a gym membership.' },
  { id:'c6', title:'Investing for Black Wealth',    instructor:'Aisha Brooke',     modules:14, rating:4.8, price:69, enrolled:false, progress:0,  category:'Finance',   description:'Index funds, real estate, and building generational wealth from $100/month.' },
  { id:'c7', title:'Creative Direction Masterclass',instructor:'Jordan Ellis',     modules:9,  rating:4.7, price:89, enrolled:false, progress:0,  category:'Creative',  description:'Learn creative direction, visual storytelling, and portfolio-worthy projects.' },
  { id:'c8', title:'Mindset Reset: 21-Day Program', instructor:'Spirit AI',        modules:21, rating:4.9, price:0,  enrolled:false, progress:0,  category:'Personal',  description:'Daily habits, journaling, and reflection practices for lasting mindset transformation.' },
];

const CATEGORIES = ['All', 'Business', 'Health', 'Tech', 'Creative', 'Finance', 'Personal'];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="11" height="11" viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth={2}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function EnrolledCourseRow({ course, isNight }: { course: Course; isNight: boolean }) {
  const cardBg = isNight ? '#1A2448' : '#FFFFFF';
  const border = isNight ? '#1E2448' : '#C5CAE9';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      style={{ borderRadius: 16, background: cardBg, border: `1px solid ${border}`, padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center' }}
    >
      {/* Icon */}
      <div style={{ width: 56, height: 56, borderRadius: 14, background: isNight ? 'rgba(41,82,232,0.18)' : 'rgba(41,82,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2952E8" strokeWidth={1.8} strokeLinecap="round">
          <path d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
        </svg>
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: text, marginBottom: 2, lineHeight: 1.3 }}>{course.title}</p>
        <p style={{ fontSize: 12, color: muted, marginBottom: 8 }}>{course.instructor} · {course.modules} modules</p>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 3, background: '#2952E8' }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2952E8', whiteSpace: 'nowrap' }}>{course.progress}%</span>
        </div>
      </div>
      {/* Continue chevron */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isNight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} strokeWidth={2} strokeLinecap="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </motion.div>
  );
}

function BrowseCourseCard({ course, isNight }: { course: Course; isNight: boolean }) {
  const cardBg = isNight ? '#1A2448' : '#FFFFFF';
  const border = isNight ? '#1E2448' : '#C5CAE9';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const isFree = course.price === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      style={{ borderRadius: 16, overflow: 'hidden', background: cardBg, border: `1px solid ${border}`, cursor: 'pointer' }}
    >
      {/* Thumbnail */}
      <div style={{ height: 110, background: isNight ? 'rgba(41,82,232,0.15)' : 'rgba(41,82,232,0.07)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2952E8" strokeWidth={1.5} strokeLinecap="round">
          <path d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
        </svg>
        {/* Category tag */}
        <div style={{ position: 'absolute', top: 8, left: 8, background: isNight ? 'rgba(41,82,232,0.35)' : 'rgba(41,82,232,0.12)', borderRadius: 8, padding: '3px 9px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2952E8' }}>{course.category}</span>
        </div>
        {/* Price badge */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: isFree ? '#059669' : (isNight ? '#1A2448' : '#EEF2FF'), borderRadius: 10, padding: '3px 9px', border: `1px solid ${isFree ? '#059669' : '#C5CAE9'}` }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: isFree ? '#fff' : '#2952E8' }}>{isFree ? 'Free' : `$${course.price}`}</span>
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: '12px 13px' }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: text, marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</p>
        <p style={{ fontSize: 11, color: muted, marginBottom: 8 }}>{course.instructor}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StarRating rating={course.rating} />
          <span style={{ fontSize: 11, color: muted }}>{course.modules} modules</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function LearnPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const supabase = createClient();
  const [category, setCategory] = useState('All');
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);

  const bg = isNight ? '#080E24' : '#F5F6FF';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const border = isNight ? '#1E2448' : '#C5CAE9';

  // Try loading courses from estores / market
  useEffect(() => {
    (supabase as any).from('estore_products')
      .select('*')
      .eq('type', 'course')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: any) => {
        if (data?.length) {
          const mapped: Course[] = data.map((p: any) => ({
            id: p.id, title: p.name, instructor: 'Village Creator',
            modules: p.metadata?.modules ?? 8, rating: 4.7, price: p.price ?? 0,
            enrolled: false, progress: 0, category: p.metadata?.category ?? 'Business',
            description: p.description ?? '',
          }));
          setCourses([...MOCK_COURSES.filter(c => c.enrolled), ...mapped]);
        }
      })
      .catch(() => {});
  }, []);

  const enrolled = courses.filter(c => c.enrolled);
  const browse = courses.filter(c => !c.enrolled && (category === 'All' || c.category === category));

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(245,246,255,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: text }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <h1 style={{ flex: 1, fontSize: 17, fontWeight: 900, color: text, margin: 0 }}>Learning</h1>
        <button style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${border}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: text }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </button>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* ── My Learning ── */}
        {enrolled.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: text, marginBottom: 12 }}>My Learning</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {enrolled.map(c => <EnrolledCourseRow key={c.id} course={c} isNight={isNight} />)}
            </div>
          </div>
        )}

        {/* ── Browse Courses ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: text, margin: 0 }}>Browse Courses</h2>
            <span style={{ fontSize: 12, color: isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>{browse.length} courses</span>
          </div>

          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${category === cat ? '#2952E8' : border}`,
                  background: category === cat ? '#2952E8' : 'transparent',
                  color: category === cat ? '#fff' : (isNight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'),
                  cursor: 'pointer',
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Course grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {browse.map(c => <BrowseCourseCard key={c.id} course={c} isNight={isNight} />)}
            {browse.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0' }}>
                <p style={{ color: isNight ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', fontSize: 14 }}>No courses in this category yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PavilionNav active="learn" />
    </div>
  );
}
