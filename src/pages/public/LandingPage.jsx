import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, animate } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import PulseLine from '@/components/ui/PulseLine'

// ── Animated ECG path ─────────────────────────────────────────────
function ECGHero() {
  return (
    <svg
      viewBox="0 0 900 120"
      className="w-full h-20 text-primary/30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <motion.path
        d="M0,60 L100,60 L120,60 L135,20 L150,100 L165,10 L185,90 L200,60 L300,60 L320,60 L335,25 L350,95 L365,15 L385,85 L400,60 L500,60 L520,60 L535,20 L550,100 L565,10 L585,90 L600,60 L700,60 L720,60 L735,25 L750,95 L765,15 L785,85 L800,60 L900,60"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.3 }}
      />
      {/* Glowing blip */}
      <motion.circle
        r="4"
        fill="var(--color-primary)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0], cx: [0, 900] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: 2.8 }}
        cy={60}
      />
    </svg>
  )
}

// ── Hub & Spoke Logistics Map ──────────────────────────────────────
const MAP_NODES = [
  { id: 'hq', x: 50, y: 50, type: 'hub' },
  { id: 'phc1', x: 25, y: 25, type: 'phc' },
  { id: 'phc2', x: 75, y: 30, type: 'phc' },
  { id: 'phc3', x: 40, y: 75, type: 'phc' },
  { id: 'sc1', x: 10, y: 15, type: 'sc' },
  { id: 'sc2', x: 15, y: 45, type: 'sc' },
  { id: 'sc3', x: 90, y: 15, type: 'sc' },
  { id: 'sc4', x: 85, y: 55, type: 'sc' },
  { id: 'sc5', x: 20, y: 85, type: 'sc' },
  { id: 'sc6', x: 65, y: 85, type: 'sc' },
];

const MAP_EDGES = [
  { source: 0, target: 1 },
  { source: 0, target: 2 },
  { source: 0, target: 3 },
  { source: 1, target: 4 },
  { source: 1, target: 5 },
  { source: 2, target: 6 },
  { source: 2, target: 7 },
  { source: 3, target: 8 },
  { source: 3, target: 9 },
];

function HubAndSpokeMap() {
  return (
    <div className="absolute right-16 top-1/2 -translate-y-1/2 w-[550px] h-[550px] hidden lg:block z-0 pointer-events-none" style={{ perspective: '1200px' }}>
      <motion.div
        className="w-full h-full relative origin-center"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ 
          rotateX: 60,
          rotateZ: [0, -360]
        }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        {/* Topographic Rings */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-12 rounded-full border border-white/10" style={{ borderStyle: 'dashed' }} />
        <div className="absolute inset-24 rounded-full border border-white/10" />
        <div className="absolute inset-36 rounded-full border border-white/10" style={{ borderStyle: 'dashed' }} />
        
        {/* Crosshair grid lines */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          {/* Edges */}
          {MAP_EDGES.map((edge, i) => {
            const source = MAP_NODES[edge.source];
            const target = MAP_NODES[edge.target];
            return (
              <g key={`edge-${i}`}>
                {/* Base line */}
                <line
                  x1={`${source.x}%`} y1={`${source.y}%`}
                  x2={`${target.x}%`} y2={`${target.y}%`}
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  opacity="0.5"
                />
                
                {/* Data flowing UP to Hub (cyan) */}
                <motion.circle
                  r="3.5"
                  fill="#5eead4"
                  className="drop-shadow-[0_0_8px_#5eead4]"
                  animate={{
                    cx: [`${target.x}%`, `${source.x}%`],
                    cy: [`${target.y}%`, `${source.y}%`],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 1.5 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                />
                
                {/* Supplies/Decisions flowing DOWN to spokes (white) */}
                <motion.circle
                  r="2.5"
                  fill="#ffffff"
                  className="drop-shadow-[0_0_5px_#ffffff]"
                  animate={{
                    cx: [`${source.x}%`, `${target.x}%`],
                    cy: [`${source.y}%`, `${target.y}%`],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                />
              </g>
            )
          })}
          {/* Nodes */}
          {MAP_NODES.map((node, i) => (
            <g key={`node-${i}`}>
              {/* Radar pulse around node */}
              <motion.circle
                cx={`${node.x}%`} cy={`${node.y}%`}
                r={node.type === 'hub' ? 14 : node.type === 'phc' ? 9 : 5}
                fill="none"
                stroke={node.type === 'hub' ? '#ffffff' : '#5eead4'}
                strokeWidth="1.5"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.7, 0, 0.7]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
              {/* Solid Node Core */}
              <circle
                cx={`${node.x}%`} cy={`${node.y}%`}
                r={node.type === 'hub' ? 7 : node.type === 'phc' ? 4.5 : 3}
                fill={node.type === 'hub' ? '#ffffff' : '#5eead4'}
                className={node.type === 'hub' ? 'drop-shadow-[0_0_12px_#ffffff]' : 'drop-shadow-[0_0_6px_#5eead4]'}
              />
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  )
}

// ── Stat counter card ─────────────────────────────────────────────
function HeroStat({ value, label, delay }) {
  const nodeRef = useRef(null)

  useEffect(() => {
    const numericStr = value.replace(/[^0-9]/g, '')
    const target = parseInt(numericStr, 10) || 0
    const suffix = value.replace(/[0-9,]/g, '')

    const controls = animate(1, target, {
      duration: 2,
      delay: delay + 0.2,
      ease: "easeOut",
      onUpdate(v) {
        if (nodeRef.current) {
          nodeRef.current.textContent = Math.floor(v).toLocaleString() + suffix
        }
      }
    })
    return () => controls.stop()
  }, [value, delay])

  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
      <p className="font-mono font-bold text-4xl text-white tabular" ref={nodeRef}>
        1{value.replace(/[0-9,]/g, '')}
      </p>
      <p className="font-body text-xs text-white/60 mt-1 uppercase tracking-wider">{label}</p>
    </motion.div>
  )
}

// ── Role card ─────────────────────────────────────────────────────
function RoleCard({ icon, title, desc, to, delay, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <Link
        to={to}
        className="group block card card-hover p-6 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        <h3 className="font-display font-semibold text-ink text-base mb-2">{title}</h3>
        <p className="font-body text-sm text-body/70 leading-relaxed">{desc}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-primary text-sm font-medium font-body">
          <span>Get started</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  )
}

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 min-h-[520px] flex flex-col justify-end">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
          }}
        />

        {/* 3D Logistics Hub & Spoke Map (Right Side) */}
        <HubAndSpokeMap />

        {/* Top nav */}
        <div className="relative flex items-center justify-between px-8 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="font-mono text-sm font-bold text-white">DH</span>
            </div>
            <div>
              <p className="font-display font-semibold text-white text-sm leading-tight">{t('app.shortName')}</p>
              <p className="font-body text-white/50 text-2xs">Raigad District</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="font-body text-sm text-white/80 hover:text-white transition-colors px-4 py-2">
              {t('auth.login')}
            </Link>
            <Link to="/register" className="btn-primary bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20">
              {t('auth.register')}
            </Link>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative px-8 pt-16 pb-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <PulseLine mode="indicator" className="text-green-300" />
              <span className="font-mono text-2xs text-white/80 uppercase tracking-widest">{t('dashboard.liveData')}</span>
            </span>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-white leading-tight mb-4">
              {t('app.name')}
            </h1>
            <p className="font-body text-lg text-white/70 max-w-xl leading-relaxed">
              {t('app.tagline')}
            </p>
          </motion.div>

          {/* ECG line */}
          <div className="mt-8">
            <ECGHero />
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-black/20 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-4xl mx-auto px-8 py-6 grid grid-cols-3 gap-8 divide-x divide-white/20">
            <HeroStat value="42" label="Facilities" delay={0.6} />
            <HeroStat value="186" label="Doctors" delay={0.7} />
            <HeroStat value="1,200+" label="Daily Patients" delay={0.8} />
          </div>
        </div>
      </div>

      {/* ── Role cards ── */}
      <div className="flex-1 px-6 py-16 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-semibold text-2xl text-ink mb-3">Choose your role to continue</h2>
          <p className="font-body text-body/70">Sign in to access your personalised health monitoring dashboard.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RoleCard
            delay={0.6}
            to="/login"
            color="bg-primary/10"
            title="District Admin"
            desc="Oversee all facilities, compare hospitals, view AI insights and manage district-wide health data."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
              </svg>
            }
          />
          <RoleCard
            delay={0.7}
            to="/login"
            color="bg-info-tint"
            title="Hospital Staff"
            desc="Track bed occupancy, medicine stock, doctor attendance, and manage today's appointments."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M9 21V7l3-4 3 4v14M9 12h6M12 9v6" />
              </svg>
            }
          />
          <RoleCard
            delay={0.8}
            to="/register"
            color="bg-success-tint"
            title="Patient"
            desc="Find nearby hospitals, check bed availability, book appointments with doctors near you."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="font-body text-sm text-body/60">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-8 flex items-center justify-between">
        <p className="font-body text-2xs text-body/50">
          © 2026 {t('app.shortName')} — Raigad District Health Department
        </p>
        <div className="flex items-center gap-1.5 text-2xs font-body text-body/40">
          <PulseLine mode="indicator" className="text-success" />
          <span>All systems operational</span>
        </div>
      </footer>
    </div>
  )
}
