import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import StatusPill from '@/components/ui/StatusPill'
import { useStock, useUpdateStock } from '@/hooks/useStock'
import { useAuth } from '@/context/AuthContext'

const FILTER_OPTIONS = ['all', 'low', 'critical']

function Sparkline({ data }) {
  const points = data ?? []
  return (
    <ResponsiveContainer width={72} height={28}>
      <LineChart data={points.map((v, i) => ({ v, i }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function UpdateModal({ item, onClose, onSave }) {
  const { t } = useTranslation()
  const { register, handleSubmit } = useForm({ defaultValues: { qty: '' } })
  const onSubmit = (data) => { onSave(item.id, Number(data.qty)); onClose() }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="card p-6 w-full max-w-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h3 className="font-display font-semibold text-base text-ink mb-1">{t('stock.updateStock')}</h3>
        <p className="font-body text-xs text-body/70 mb-4">{item.medicine}</p>
        <p className="font-body text-xs text-body/60 mb-1">Current: <span className="font-mono tabular text-ink">{item.currentQty} {item.unit}</span></p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-4">
          <div>
            <label htmlFor="qty-input" className="block font-body text-xs font-medium text-ink mb-1.5">Add quantity ({item.unit})</label>
            <input id="qty-input" type="number" min="1" className="form-input" {...register('qty', { required: true, min: 1 })} />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1 justify-center">{t('common.save')}</button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">{t('common.cancel')}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function StockPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const hospitalId = user?.hospitalId || 1
  const { data: stock = [] } = useStock(hospitalId)
  const { mutate: updateStock } = useUpdateStock(hospitalId)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = stock.filter((s) => {
    const matchSearch = s.medicine.toLowerCase().includes(search.toLowerCase())
    let matchFilter = true
    if (filter === 'low') matchFilter = s.status === 'warning'
    else if (filter === 'critical') matchFilter = s.status === 'critical'
    return matchSearch && matchFilter
  })

  const handleSave = (id, qty) => {
    const item = stock.find(s => s.id === id)
    if (item) {
      updateStock({ itemId: id, data: { current_qty: item.currentQty + qty } })
    }
  }

  const summary = {
    healthy: stock.filter(s => s.status === 'success').length,
    low: stock.filter(s => s.status === 'warning').length,
    critical: stock.filter(s => s.status === 'critical').length,
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl text-ink">{t('stock.title')}</h2>
          <p className="font-body text-sm text-body/70 mt-0.5">Medicine inventory — Alibag PHC</p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        <div className="pill pill-success"><span className="pill-dot dot-success"/><span className="font-mono tabular">{summary.healthy}</span> Healthy</div>
        <div className="pill pill-warning"><span className="pill-dot dot-warning"/><span className="font-mono tabular">{summary.low}</span> Low</div>
        <div className="pill pill-critical"><span className="pill-dot dot-critical"/><span className="font-mono tabular">{summary.critical}</span> Critical</div>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-body/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder={`${t('common.search')} medicines…`}
            className="form-input pl-9 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 bg-mist rounded-lg p-1">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all capitalize ${
                filter === f ? 'bg-primary text-white shadow-sm' : 'text-body/60 hover:text-primary'
              }`}
            >
              {f === 'all' ? t('common.all') : f}
            </button>
          ))}
        </div>
      </div>

      {/* Stock table */}
      <motion.div
        className="card overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-mist/40">
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">{t('stock.medicine')}</th>
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">{t('stock.current')}</th>
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">{t('stock.threshold')}</th>
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">{t('stock.trend')}</th>
                <th className="text-left py-2.5 px-4 font-body text-2xs uppercase tracking-wider text-body/60">Status</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <motion.tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-mist/40 transition-colors"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td className="py-2.5 px-4 font-body text-sm text-ink">{item.medicine}</td>
                  <td className="py-2.5 px-4">
                    <span className={`font-mono text-sm tabular font-semibold ${
                      item.status === 'critical' ? 'text-critical' : item.status === 'warning' ? 'text-warning' : 'text-ink'
                    }`}>{item.currentQty}</span>
                    <span className="font-body text-2xs text-body/50 ml-1">{item.unit}</span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-sm tabular text-body/60">{item.threshold}</td>
                  <td className="py-2.5 px-4">
                    <Sparkline data={item.trend} />
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusPill
                      variant={item.status === 'success' ? 'success' : item.status === 'warning' ? 'warning' : 'critical'}
                      label={item.status === 'success' ? 'Healthy' : item.status === 'warning' ? 'Low' : 'Critical'}
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <button
                      onClick={() => setEditing(item)}
                      className="text-primary text-xs font-body hover:underline"
                    >
                      {t('stock.addStock')}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Update modal */}
      <AnimatePresence>
        {editing && (
          <UpdateModal item={editing} onClose={() => setEditing(null)} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  )
}
