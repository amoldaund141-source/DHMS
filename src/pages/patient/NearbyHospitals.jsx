import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import StatusPill from '@/components/ui/StatusPill'
import { useHospitals } from '@/hooks/useHospitals'

// Fix leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createHospitalIcon(status) {
  const color = status === 'critical' ? '#C0392B' : status === 'warning' ? '#D68A1F' : '#1B9C6E'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <text x="14" y="18" text-anchor="middle" font-size="10" font-family="IBM Plex Mono" font-weight="700" fill="${color}">+</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  })
}

function MapRecenter({ lat, lng }) {
  const map = useMap()
  useEffect(() => { map.flyTo([lat, lng], 13, { duration: 0.8 }) }, [lat, lng])
  return null
}

export default function NearbyHospitals() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const center = [18.6415, 72.8722] // Alibag (patient's location)

  const { data: hospitals = [] } = useHospitals()
  const filtered = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.location.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusFor = (h) =>
    h.bedOccupancy >= 90 ? 'critical' : h.stockStatus === 'critical' ? 'warning' : 'success'

  return (
    <div className="h-full flex flex-col gap-4 pb-4">
      <div>
        <h2 className="font-display font-semibold text-xl text-ink">{t('patient.nearbyHospitals')}</h2>
        <p className="font-body text-sm text-body/70 mt-0.5">Raigad District — {hospitals.length} facilities</p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-body/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="search" placeholder={`${t('common.search')} hospitals…`} className="form-input pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
        {/* Hospital list */}
        <div className="lg:col-span-2 flex flex-col gap-2 overflow-y-auto scrollbar-hide max-h-[500px] lg:max-h-full pr-1">
          {filtered.map((h, i) => {
            const statusVariant = getStatusFor(h)
            const avail = h.beds.general.total - h.beds.general.occupied + h.beds.semi.total - h.beds.semi.occupied
            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelected(h)}
                className={`card p-4 cursor-pointer transition-all ${selected?.id === h.id ? 'ring-2 ring-primary' : 'card-hover'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-body font-semibold text-sm text-ink truncate">{h.name}</h3>
                    <p className="font-body text-2xs text-body/60 mt-0.5">{h.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-mono font-semibold ${h.type === 'CHC' ? 'bg-info-tint text-info' : 'bg-primary/10 text-primary'}`}>{h.type}</span>
                    <StatusPill variant={statusVariant} label={statusVariant === 'critical' ? 'Full' : statusVariant === 'warning' ? 'Low' : 'Available'} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-2xs font-body text-body/60">
                  <span><span className="font-mono tabular text-ink">{h.distance}</span> km</span>
                  <span>
                    {avail > 0
                      ? <><span className="font-mono tabular text-success">{avail}</span> beds free</>
                      : <span className="text-critical">{t('patient.noBeds')}</span>
                    }
                  </span>
                  <span><span className="font-mono tabular text-ink">{h.doctorsPresent}</span> doctors</span>
                </div>
                <Link
                  to={`/patient/hospital/${h.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2.5 inline-flex items-center gap-1 text-primary text-xs font-body hover:underline"
                >
                  {t('patient.viewDetails')} →
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Map */}
        <motion.div
          className="lg:col-span-3 rounded-xl overflow-hidden border border-border shadow-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ minHeight: 360 }}
        >
          <MapContainer
            center={center}
            zoom={10}
            style={{ width: '100%', height: '100%', minHeight: 360 }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selected && <MapRecenter lat={selected.lat} lng={selected.lng} />}
            {filtered.map((h) => (
              <Marker
                key={h.id}
                position={[h.lat, h.lng]}
                icon={createHospitalIcon(getStatusFor(h))}
                eventHandlers={{ click: () => setSelected(h) }}
              >
                <Popup>
                  <div className="p-1">
                    <p className="font-body font-semibold text-ink text-sm">{h.name}</p>
                    <p className="font-body text-xs text-body/70 mt-0.5">{h.type} · {h.location}</p>
                    <p className="font-mono text-xs mt-1 text-ink tabular">{h.bedOccupancy}% beds occupied</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>
      </div>
    </div>
  )
}
