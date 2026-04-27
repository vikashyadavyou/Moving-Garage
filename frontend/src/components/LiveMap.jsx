import { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY
const MAP_STYLE = `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${MAP_API_KEY}`

/**
 * LiveMap — A reusable MapLibre GL map component powered by Geoapify tiles.
 *
 * Props:
 *   center       - [lng, lat] initial center
 *   zoom         - initial zoom level (default: 13)
 *   userLocation - { lat, lng } to show user pin
 *   mechanicLocation - { lat, lng } to show mechanic pin
 *   routeGeoJSON - GeoJSON LineString for route rendering
 *   className    - additional CSS classes
 *   style        - inline style overrides
 */
export default function LiveMap({
  center,
  zoom = 13,
  userLocation,
  mechanicLocation,
  routeGeoJSON,
  className = '',
  style = {},
}) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const mechanicMarker = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return
    if (!MAP_API_KEY) {
      console.warn('VITE_MAP_API_KEY is not set. Map will not render.')
      return
    }

    const initialCenter = center || [
      userLocation?.lng || 77.5946,
      userLocation?.lat || 12.9716,
    ]

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom,
      attributionControl: false,
    })

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    )
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', () => setMapReady(true))

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // User marker
  useEffect(() => {
    if (!map.current || !mapReady || !userLocation) return

    if (userMarker.current) {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat])
    } else {
      const el = document.createElement('div')
      el.className = 'map-marker-user'
      el.innerHTML = `
        <div style="
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        ">📍</div>
      `
      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Your Location'))
        .addTo(map.current)
    }
  }, [userLocation, mapReady])

  // Mechanic marker
  useEffect(() => {
    if (!map.current || !mapReady || !mechanicLocation) return

    if (mechanicMarker.current) {
      mechanicMarker.current.setLngLat([mechanicLocation.lng, mechanicLocation.lat])
    } else {
      const el = document.createElement('div')
      el.className = 'map-marker-mechanic'
      el.innerHTML = `
        <div style="
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        ">🔧</div>
      `
      mechanicMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([mechanicLocation.lng, mechanicLocation.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Mechanic'))
        .addTo(map.current)
    }
  }, [mechanicLocation, mapReady])

  // Route line
  useEffect(() => {
    if (!map.current || !mapReady || !routeGeoJSON) return

    const sourceId = 'route-source'
    const layerId = 'route-layer'

    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(routeGeoJSON)
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: routeGeoJSON,
      })
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      })
    }
  }, [routeGeoJSON, mapReady])

  // Fit bounds when both markers exist
  useEffect(() => {
    if (!map.current || !mapReady || !userLocation || !mechanicLocation) return

    const bounds = new maplibregl.LngLatBounds()
    bounds.extend([userLocation.lng, userLocation.lat])
    bounds.extend([mechanicLocation.lng, mechanicLocation.lat])
    map.current.fitBounds(bounds, { padding: 60, maxZoom: 15 })
  }, [userLocation, mechanicLocation, mapReady])

  if (!MAP_API_KEY) {
    return (
      <div
        className={`rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${className}`}
        style={{ minHeight: 250, ...style }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-sm text-slate-500 font-medium">Map unavailable</p>
          <p className="text-xs text-slate-400 mt-1">
            Set VITE_MAP_API_KEY in .env to enable live maps
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className={`rounded-2xl overflow-hidden shadow-inner ${className}`}
      style={{ minHeight: 250, ...style }}
    />
  )
}
