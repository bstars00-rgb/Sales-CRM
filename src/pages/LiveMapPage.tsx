import { useState, useEffect, useCallback, useMemo } from 'react'
import { RefreshCw, Clock, MapPin, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/kpiCalc'
import { mockCityData, mockRegionSummary, type CityData } from '@/mocks/livemap'

const REFRESH_OPTIONS = [
  { label: '30초', value: 30 },
  { label: '1분', value: 60 },
  { label: '3분', value: 180 },
  { label: '5분', value: 300 },
]

const REGION_COLORS: Record<string, { bg: string; ring: string; text: string; dot: string }> = {
  'East Asia': { bg: 'bg-blue-500', ring: 'ring-blue-400/50', text: 'text-blue-400', dot: '#3b82f6' },
  'SE Asia': { bg: 'bg-emerald-500', ring: 'ring-emerald-400/50', text: 'text-emerald-400', dot: '#22c55e' },
  'South Asia': { bg: 'bg-orange-500', ring: 'ring-orange-400/50', text: 'text-orange-400', dot: '#f97316' },
  'Middle East': { bg: 'bg-purple-500', ring: 'ring-purple-400/50', text: 'text-purple-400', dot: '#a855f7' },
  'Oceania': { bg: 'bg-cyan-500', ring: 'ring-cyan-400/50', text: 'text-cyan-400', dot: '#06b6d4' },
}

const REGION_NAME_KO: Record<string, string> = {
  'East Asia': '동아시아',
  'SE Asia': '동남아시아',
  'South Asia': '남아시아',
  'Middle East': '중동/중앙아시아',
  'Oceania': '오세아니아',
}

/** Convert lat/lng to percentage-based position on a Mercator-ish container.
 *  The viewport is focused on Asia-Pacific: lng 25-180, lat -45 to 50
 */
function toMapPosition(lat: number, lng: number) {
  const minLng = 25
  const maxLng = 185
  const minLat = -45
  const maxLat = 52

  const x = ((lng - minLng) / (maxLng - minLng)) * 100
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100

  return {
    left: `${Math.max(2, Math.min(98, x))}%`,
    top: `${Math.max(2, Math.min(98, y))}%`,
  }
}

function markerSize(recentBookings: number) {
  const min = 8
  const max = 24
  const scale = Math.min(1, recentBookings / 500)
  return min + (max - min) * scale
}

export default function LiveMapPage() {
  const [refreshInterval, setRefreshInterval] = useState(60)
  const [countdown, setCountdown] = useState(60)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [cities, setCities] = useState<CityData[]>(() => [...mockCityData])
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const simulateRefresh = useCallback(() => {
    setIsRefreshing(true)
    setCities((prev) =>
      prev.map((city) => ({
        ...city,
        recentBookings: Math.max(
          5,
          city.recentBookings + Math.floor(Math.random() * 21) - 10
        ),
      }))
    )
    setLastRefresh(Date.now())
    setCountdown(refreshInterval)
    setTimeout(() => setIsRefreshing(false), 600)
  }, [refreshInterval])

  useEffect(() => {
    setCountdown(refreshInterval)
  }, [refreshInterval])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          simulateRefresh()
          return refreshInterval
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [refreshInterval, simulateRefresh])

  const secondsAgo = Math.floor((Date.now() - lastRefresh) / 1000)

  const filteredCities = useMemo(() => {
    if (!selectedRegion) return cities
    return cities.filter((c) => c.region === selectedRegion)
  }, [cities, selectedRegion])

  const dimmedCities = useMemo(() => {
    if (!selectedRegion) return new Set<string>()
    return new Set(cities.filter((c) => c.region !== selectedRegion).map((c) => c.name))
  }, [cities, selectedRegion])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">실시간 예약 지도</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            아시아-태평양 30개 도시 실시간 예약 현황
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh interval selector */}
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm bg-transparent border-none outline-none cursor-pointer"
            >
              {REFRESH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Countdown */}
          <div className="text-xs text-muted-foreground tabular-nums min-w-[80px] text-center bg-card border rounded-lg px-3 py-2">
            갱신 {countdown}초
          </div>

          {/* Manual refresh */}
          <button
            onClick={simulateRefresh}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium',
              'hover:bg-accent transition-colors',
              isRefreshing && 'animate-pulse'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            새로고침
          </button>
        </div>
      </div>

      {/* Last refresh info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="w-3.5 h-3.5" />
        마지막 갱신: {secondsAgo}초 전
        <span className="ml-2">|</span>
        <span className="ml-2">
          총 예약 (24h):{' '}
          <span className="font-semibold text-foreground">
            {cities.reduce((s, c) => s + c.recentBookings, 0).toLocaleString()}건
          </span>
        </span>
      </div>

      {/* Map + Region Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        {/* World Map */}
        <div className="relative rounded-xl border overflow-hidden bg-[#0f172a]" style={{ aspectRatio: '2 / 1', minHeight: 420 }}>
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="10%" height="10%" patternUnits="objectBoundingBox">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Rough continent shapes using faint blobs */}
          <div className="absolute inset-0 pointer-events-none">
            {/* East Asia landmass */}
            <div className="absolute rounded-[40%] bg-white/[0.03]" style={{ top: '10%', left: '48%', width: '30%', height: '40%' }} />
            {/* SE Asia landmass */}
            <div className="absolute rounded-[35%] bg-white/[0.03]" style={{ top: '40%', left: '42%', width: '25%', height: '30%' }} />
            {/* South Asia landmass */}
            <div className="absolute rounded-[40%] bg-white/[0.03]" style={{ top: '20%', left: '28%', width: '20%', height: '35%' }} />
            {/* Middle East landmass */}
            <div className="absolute rounded-[30%] bg-white/[0.03]" style={{ top: '12%', left: '10%', width: '22%', height: '30%' }} />
            {/* Australia */}
            <div className="absolute rounded-[35%] bg-white/[0.03]" style={{ top: '65%', left: '68%', width: '22%', height: '25%' }} />
          </div>

          {/* City markers */}
          {mockCityData.map((city) => {
            const pos = toMapPosition(city.lat, city.lng)
            const liveCity = cities.find((c) => c.name === city.name) ?? city
            const size = markerSize(liveCity.recentBookings)
            const regionColor = REGION_COLORS[city.region]
            const isDimmed = dimmedCities.has(city.name)
            const isHovered = hoveredCity === city.name

            return (
              <div
                key={city.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: pos.left, top: pos.top, zIndex: isHovered ? 50 : 10 }}
                onMouseEnter={() => setHoveredCity(city.name)}
                onMouseLeave={() => setHoveredCity(null)}
              >
                {/* Pulse ring */}
                <div
                  className={cn(
                    'absolute rounded-full animate-ping',
                    regionColor.bg,
                    isDimmed ? 'opacity-0' : 'opacity-20'
                  )}
                  style={{
                    width: size + 8,
                    height: size + 8,
                    top: -(size + 8) / 2,
                    left: -(size + 8) / 2,
                    animationDuration: '2.5s',
                  }}
                />
                {/* Dot */}
                <div
                  className={cn(
                    'rounded-full border-2 border-white/30 cursor-pointer transition-all duration-200',
                    regionColor.bg,
                    isDimmed ? 'opacity-20 scale-75' : 'opacity-90',
                    isHovered && 'scale-150 opacity-100 ring-2 ring-white/50 shadow-lg shadow-current'
                  )}
                  style={{ width: size, height: size, marginTop: -size / 2, marginLeft: -size / 2 }}
                />

                {/* City label (always visible for large cities, on hover for others) */}
                {(liveCity.recentBookings > 200 || isHovered) && !isDimmed && (
                  <div
                    className={cn(
                      'absolute whitespace-nowrap text-[10px] font-medium text-white/70 pointer-events-none',
                      isHovered && 'text-white text-xs'
                    )}
                    style={{ top: size / 2 + 4, left: '50%', transform: 'translateX(-50%)' }}
                  >
                    {city.nameKo}
                  </div>
                )}

                {/* Tooltip */}
                {isHovered && (
                  <div
                    className="absolute z-50 pointer-events-none bg-popover/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 min-w-[200px]"
                    style={{ bottom: size / 2 + 12, left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <div className="text-xs space-y-1.5">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-3.5 h-3.5" style={{ color: regionColor.dot }} />
                        <span className="font-semibold text-sm">{city.nameKo}</span>
                        <span className="text-muted-foreground">{city.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TTV</span>
                        <span className="font-medium">{formatCurrency(liveCity.ttv)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room Nights</span>
                        <span className="font-medium">{liveCity.roomNights.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24h 예약</span>
                        <span className="font-semibold text-foreground">{liveCity.recentBookings}건</span>
                      </div>
                      <div className="flex items-center gap-1 pt-1 border-t">
                        <div className="w-2 h-2 rounded-full" style={{ background: regionColor.dot }} />
                        <span className="text-muted-foreground">{REGION_NAME_KO[city.region]}</span>
                      </div>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover/95 border-b border-r rotate-45" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(REGION_COLORS).map(([region, colors]) => (
              <div key={region} className="flex items-center gap-1.5 text-[10px] text-white/70">
                <div className={cn('w-2.5 h-2.5 rounded-full', colors.bg)} />
                {REGION_NAME_KO[region]}
              </div>
            ))}
          </div>

          {/* Refresh overlay */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/5 flex items-center justify-center animate-pulse">
              <RefreshCw className="w-8 h-8 text-white/30 animate-spin" />
            </div>
          )}
        </div>

        {/* Region Summary cards */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            지역별 요약
          </h3>
          {mockRegionSummary.map((region) => {
            const colors = REGION_COLORS[region.region]
            const isSelected = selectedRegion === region.region

            return (
              <button
                key={region.region}
                onClick={() =>
                  setSelectedRegion((prev) =>
                    prev === region.region ? null : region.region
                  )
                }
                className={cn(
                  'w-full text-left rounded-lg border p-3 transition-all duration-200',
                  'hover:shadow-md hover:border-primary/30',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'bg-card'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-3 h-3 rounded-full', colors.bg)} />
                  <span className="text-sm font-semibold">
                    {REGION_NAME_KO[region.region]}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {region.cityCount}개 도시
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">TTV</div>
                    <div className="font-semibold">{formatCurrency(region.totalTTV)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Room Nights</div>
                    <div className="font-semibold">{region.totalRoomNights.toLocaleString()}</div>
                  </div>
                </div>
              </button>
            )
          })}

          {selectedRegion && (
            <button
              onClick={() => setSelectedRegion(null)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
            >
              필터 해제
            </button>
          )}
        </div>
      </div>

      {/* City Detail Cards (filtered) */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {selectedRegion ? `${REGION_NAME_KO[selectedRegion]} 도시 현황` : '전체 도시 현황'} ({filteredCities.length}개)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filteredCities
            .sort((a, b) => b.recentBookings - a.recentBookings)
            .map((city) => {
              const colors = REGION_COLORS[city.region]
              return (
                <div
                  key={city.name}
                  className="bg-card border rounded-lg p-2.5 hover:shadow-sm transition-shadow"
                  onMouseEnter={() => setHoveredCity(city.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={cn('w-2 h-2 rounded-full', colors.bg)} />
                    <span className="text-xs font-semibold truncate">{city.nameKo}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{city.country}</div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-sm font-bold">{city.recentBookings}</span>
                    <span className="text-[10px] text-muted-foreground">건/24h</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {formatCurrency(city.ttv)}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
