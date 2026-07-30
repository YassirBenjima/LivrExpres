import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function DispatchMapPage({ navigate, currentUser }) {
  const [drivers, setDrivers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Live GPS tracking state for current driver
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const watchIdRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Dynamically load Leaflet CSS & JS script
  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          setLeafletReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Fetch driver locations & parcels from backend API
  const fetchMapData = async () => {
    try {
      const response = await fetch('/api/driver/locations');
      const data = await response.json();
      if (data.success) {
        setDrivers(data.drivers || []);
        setParcels(data.parcels || []);
      }
    } catch (err) {
      console.error('Error loading dispatch map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 15000); // refresh every 15 sec
    return () => clearInterval(interval);
  }, []);

  // Geolocation watch driver position
  useEffect(() => {
    if (isGpsActive) {
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentCoords({ latitude, longitude });
            setGpsError(null);

            // Send GPS to backend API
            try {
              await fetch('/api/driver/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude })
              });
            } catch (e) {
              console.error('Failed to post GPS location:', e);
            }
          },
          (err) => {
            console.warn('Geolocation warning:', err.message);
            setGpsError('Accès GPS indisponible ou refusé');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setGpsError('La géolocalisation n\'est pas supportée par votre navigateur');
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setCurrentCoords(null);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isGpsActive]);

  // Initialize & Update Leaflet Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || !window.L) return;

    const L = window.L;

    // Create Leaflet map instance if not existing
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([33.5731, -7.5898], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // Custom Driver HTML Icon
    const createDriverIcon = (name, isLive) => {
      return L.divIcon({
        className: 'custom-driver-pin',
        html: `
          <div style="
            background: ${isLive ? '#059669' : '#2563eb'};
            color: white;
            padding: 5px 9px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid white;
            white-space: nowrap;
          ">
            <span>🚚</span>
            <span>${name.split(' ')[0]}</span>
            ${isLive ? '<span style="width: 7px; height: 7px; background: #34d399; border-radius: 50%; display: inline-block;"></span>' : ''}
          </div>
        `,
        iconSize: [120, 30],
        iconAnchor: [60, 15]
      });
    };

    // Custom Parcel HTML Icon
    const createParcelIcon = (code) => {
      return L.divIcon({
        className: 'custom-parcel-pin',
        html: `
          <div style="
            background: #d97706;
            color: white;
            padding: 3px 7px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            border: 1px solid white;
            white-space: nowrap;
          ">
            📦 ${code}
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });
    };

    // Filter drivers
    const filteredDrivers = drivers.filter(d => {
      const matchCity = selectedCity === 'ALL' || d.city.toLowerCase() === selectedCity.toLowerCase();
      const matchQuery = !searchQuery || d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || d.phone.includes(searchQuery);
      return matchCity && matchQuery;
    });

    // Render Driver Markers
    filteredDrivers.forEach(driver => {
      if (driver.latitude && driver.longitude) {
        const marker = L.marker([driver.latitude, driver.longitude], {
          icon: createDriverIcon(driver.fullName, driver.isLive)
        });

        const popupContent = `
          <div style="font-family: inherit; padding: 4px; min-width: 180px;">
            <div style="font-weight: 700; font-size: 13px; color: #111827; margin-bottom: 2px;">
              🚚 ${driver.fullName}
            </div>
            <div style="font-size: 11px; color: #4b5563; margin-bottom: 6px;">
              📍 Ville: <strong>${driver.city}</strong>
            </div>
            <div style="font-size: 11px; color: #047857; margin-bottom: 6px; font-weight: 600;">
              📦 Colis en tournée : ${driver.activeParcels}
            </div>
            <div style="font-size: 10px; color: #6b7280; margin-bottom: 8px;">
              🕒 Dernière sync : ${driver.lastUpdated}
            </div>
            <a href="tel:${driver.phone}" style="
              display: inline-block;
              background: #059669;
              color: white;
              text-decoration: none;
              font-size: 11px;
              font-weight: 600;
              padding: 4px 10px;
              border-radius: 6px;
              width: 100%;
              text-align: center;
            ">
              📞 Appeler (${driver.phone})
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersGroup.addLayer(marker);
      }
    });

    // Filter & Render Parcels
    const filteredParcels = parcels.filter(p => {
      const matchCity = selectedCity === 'ALL' || p.city.toLowerCase() === selectedCity.toLowerCase();
      const matchQuery = !searchQuery || p.code.toLowerCase().includes(searchQuery.toLowerCase()) || p.recipient.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchQuery;
    });

    filteredParcels.forEach(parcel => {
      if (parcel.latitude && parcel.longitude) {
        const marker = L.marker([parcel.latitude, parcel.longitude], {
          icon: createParcelIcon(parcel.code)
        });

        const popupContent = `
          <div style="font-family: inherit; padding: 4px; min-width: 170px;">
            <div style="font-weight: 700; font-size: 12px; color: #d97706; margin-bottom: 2px;">
              📦 ${parcel.code}
            </div>
            <div style="font-size: 11px; color: #1f2937; margin-bottom: 4px;">
              👤 Client : <strong>${parcel.recipient}</strong>
            </div>
            <div style="font-size: 11px; color: #4b5563; margin-bottom: 4px;">
              📍 Ville : <strong>${parcel.city}</strong>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 6px;">
              💵 Prix : ${parcel.price} DH
            </div>
            <span style="
              display: inline-block;
              background: #f3f4f6;
              color: #374151;
              font-size: 10px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
            ">
              Statut: ${parcel.statut}
            </span>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersGroup.addLayer(marker);
      }
    });

  }, [leafletReady, drivers, parcels, selectedCity, searchQuery]);

  return (
    <DashboardLayout navigate={navigate} activeItem="dispatch-map">
      <div className="container-fixed p-4 md:p-6 space-y-6">
        
        {/* Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <i className="ki-filled ki-map text-emerald-600 text-2xl"></i>
              Carte de Suivi Livreurs & Dispatch En Direct
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Visualisez la géolocalisation GPS en temps réel des livreurs et les colis en cours de livraison.
            </p>
          </div>

          {/* GPS Live Broadcasting Toggle Widget */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-xs">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isGpsActive ? 'bg-emerald-500 animate-ping' : 'bg-zinc-400'}`}></span>
                Suivi GPS Livreur
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isGpsActive ? 'Position transmise en direct' : 'Mode désactivé'}
              </span>
            </div>

            <button
              onClick={() => setIsGpsActive(!isGpsActive)}
              className={`kt-btn kt-btn-sm font-medium transition-all ${
                isGpsActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isGpsActive ? 'Arrêter GPS' : '📍 Activer Mon GPS'}
            </button>
          </div>
        </div>

        {gpsError && (
          <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-lg flex items-center gap-2">
            <i className="ki-filled ki-information-2 text-base shrink-0"></i>
            <span>{gpsError}</span>
          </div>
        )}

        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl shrink-0">
              <i className="ki-filled ki-truck"></i>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {drivers.filter(d => d.isLive).length || drivers.length}
              </div>
              <div className="text-xs text-muted-foreground">Livreurs en tournée</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <i className="ki-filled ki-box"></i>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{parcels.length}</div>
              <div className="text-xs text-muted-foreground">Colis sur la carte</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl shrink-0">
              <i className="ki-filled ki-geolocation"></i>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">8 Villes</div>
              <div className="text-xs text-muted-foreground">Couverture GPS Maroc</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center text-xl shrink-0">
              <i className="ki-filled ki-pulse"></i>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 text-sm flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Temps Réel
              </div>
              <div className="text-xs text-muted-foreground">Sync automatique (15s)</div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-semibold text-foreground whitespace-nowrap">Filtrer par ville :</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="kt-input text-xs h-9 font-medium"
            >
              <option value="ALL">Toutes les villes (Maroc)</option>
              <option value="Casablanca">Casablanca</option>
              <option value="Rabat">Rabat</option>
              <option value="Marrakech">Marrakech</option>
              <option value="Tanger">Tanger</option>
              <option value="Agadir">Agadir</option>
              <option value="Fès">Fès</option>
              <option value="Meknès">Meknès</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-72">
            <div className="relative w-full">
              <i className="ki-filled ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
              <input
                type="text"
                placeholder="Rechercher livreur ou N° colis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="kt-input h-9 text-xs pl-8 w-full"
              />
            </div>
          </div>
        </div>

        {/* Leaflet Interactive Map View */}
        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden relative" style={{ height: '580px' }}>
          <div ref={mapContainerRef} className="w-full h-full z-10 flex items-center justify-center bg-muted/20">
            {!leafletReady && (
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <i className="ki-filled ki-loading animate-spin text-lg"></i>
                Chargement de la carte interactive Leaflet...
              </div>
            )}
          </div>

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-4 right-4 z-[999] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl text-xs space-y-1.5">
            <div className="font-semibold text-foreground mb-1 border-b border-border pb-1">Légende de la carte :</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              <span className="text-muted-foreground">Livreur GPS Actif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
              <span className="text-muted-foreground">Livreur En Tournée</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-600 inline-block"></span>
              <span className="text-muted-foreground">Colis En Cours</span>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
