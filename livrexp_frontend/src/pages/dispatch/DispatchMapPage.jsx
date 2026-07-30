import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function DispatchMapPage({ navigate, currentUser }) {
  const [drivers, setDrivers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Persistent GPS tracking state (Saved once in localStorage)
  const [isGpsActive, setIsGpsActive] = useState(() => {
    return localStorage.getItem('livrexp_gps_enabled') === 'true';
  });

  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const watchIdRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const cssId = 'leaflet-css-cdn';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const jsId = 'leaflet-js-cdn';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setLeafletReady(true);
      };
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

  // Fetch Driver & Parcel GPS locations from backend
  const fetchMapData = async () => {
    try {
      const response = await fetch('/api/driver/locations');
      const data = await response.json();
      if (data.success) {
        setDrivers(data.drivers || []);
        setParcels(data.parcels || []);
      }
    } catch (err) {
      console.error('Error fetching map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Toggle GPS & Save once in localStorage
  const toggleGps = () => {
    const nextState = !isGpsActive;
    setIsGpsActive(nextState);
    localStorage.setItem('livrexp_gps_enabled', nextState ? 'true' : 'false');
  };

  // Watch position when GPS is active
  useEffect(() => {
    if (isGpsActive) {
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentCoords({ latitude, longitude });
            setGpsError(null);

            try {
              await fetch('/api/driver/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude })
              });
            } catch (e) {
              console.error('Failed to update driver GPS:', e);
            }
          },
          (err) => {
            console.warn('GPS Warning:', err.message);
            setGpsError('Position GPS indisponible. Activez la géolocalisation sur votre navigateur/appareil.');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setGpsError('La géolocalisation n\'est pas prise en charge par ce navigateur.');
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

  // Render & Update Leaflet Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || !window.L) return;

    const L = window.L;

    // Initialize Map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([33.5731, -7.5898], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size to ensure full container rendering without gray tiles
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // Filter drivers
    const filteredDrivers = drivers.filter(d => {
      const matchCity = !selectedCity || d.city.toLowerCase() === selectedCity.toLowerCase();
      const matchQuery = !searchQuery || d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || d.phone.includes(searchQuery);
      return matchCity && matchQuery;
    });

    // Render Driver Markers
    filteredDrivers.forEach(driver => {
      if (driver.latitude && driver.longitude) {
        const isLive = driver.isLive;
        
        const driverDivIcon = L.divIcon({
          className: 'custom-driver-marker',
          html: `
            <div style="
              background-color: ${isLive ? '#10b981' : '#3b82f6'};
              color: #ffffff;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 600;
              box-shadow: 0 4px 14px rgba(0,0,0,0.3);
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              gap: 6px;
              white-space: nowrap;
            ">
              <span style="font-size: 12px;">🚚</span>
              <span>${driver.fullName}</span>
              ${isLive ? '<span style="width:6px; height:6px; background:#ffffff; border-radius:50%; display:inline-block;"></span>' : ''}
            </div>
          `,
          iconSize: [140, 32],
          iconAnchor: [70, 16]
        });

        const marker = L.marker([driver.latitude, driver.longitude], { icon: driverDivIcon });

        const popupContent = `
          <div style="font-family: inherit; padding: 6px; min-width: 190px;">
            <div style="font-weight: 700; font-size: 13px; color: #181c32; margin-bottom: 4px;">
              🚚 ${driver.fullName}
            </div>
            <div style="font-size: 11px; color: #5e6278; margin-bottom: 4px;">
              📍 Ville : <strong>${driver.city}</strong>
            </div>
            <div style="font-size: 11px; color: #10b981; font-weight: 600; margin-bottom: 6px;">
              📦 Colis en tournée : ${driver.activeParcels}
            </div>
            <div style="font-size: 10px; color: #a1a5b7; margin-bottom: 8px;">
              🕒 Dernière sync : ${driver.lastUpdated}
            </div>
            <a href="tel:${driver.phone}" style="
              display: block;
              background-color: #10b981;
              color: #ffffff;
              text-decoration: none;
              font-size: 11px;
              font-weight: 600;
              padding: 6px 12px;
              border-radius: 6px;
              text-align: center;
            ">
              Appeler (${driver.phone})
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersGroup.addLayer(marker);
      }
    });

    // Filter & Render Parcels
    const filteredParcels = parcels.filter(p => {
      const matchCity = !selectedCity || p.city.toLowerCase() === selectedCity.toLowerCase();
      const matchQuery = !searchQuery || p.code.toLowerCase().includes(searchQuery.toLowerCase()) || p.recipient.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchQuery;
    });

    filteredParcels.forEach(parcel => {
      if (parcel.latitude && parcel.longitude) {
        const parcelDivIcon = L.divIcon({
          className: 'custom-parcel-marker',
          html: `
            <div style="
              background-color: #f59e0b;
              color: #ffffff;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 600;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              border: 1.5px solid #ffffff;
              white-space: nowrap;
            ">
              📦 ${parcel.code}
            </div>
          `,
          iconSize: [90, 26],
          iconAnchor: [45, 13]
        });

        const marker = L.marker([parcel.latitude, parcel.longitude], { icon: parcelDivIcon });

        const popupContent = `
          <div style="font-family: inherit; padding: 6px; min-width: 170px;">
            <div style="font-weight: 700; font-size: 12px; color: #f59e0b; margin-bottom: 4px;">
              📦 ${parcel.code}
            </div>
            <div style="font-size: 11px; color: #181c32; margin-bottom: 4px;">
              👤 Destinataire : <strong>${parcel.recipient}</strong>
            </div>
            <div style="font-size: 11px; color: #5e6278; margin-bottom: 4px;">
              📍 Ville : <strong>${parcel.city}</strong>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #10b981; margin-bottom: 6px;">
              💵 Prix : ${parcel.price} MAD
            </div>
            <span style="
              display: inline-block;
              background-color: #f4f4f5;
              color: #3f3f46;
              font-size: 10px;
              font-weight: 600;
              padding: 3px 8px;
              border-radius: 4px;
            ">
              ${parcel.statut}
            </span>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersGroup.addLayer(marker);
      }
    });

  }, [leafletReady, drivers, parcels, selectedCity, searchQuery]);

  return (
    <DashboardLayout navigate={navigate} activeMenu="dispatch-map">
      {/* Top Header Controls */}
      <div className="kt-container-fixed mb-5">
        <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-5 border-b border-border">
          <div className="flex flex-col justify-center gap-2">
            <h1 className="text-xl font-medium leading-none text-mono">
              Carte Suivi GPS
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 font-medium">
              <span className="text-base text-secondary-foreground">
                Livreurs actifs :
              </span>
              <span className="text-base text-foreground font-medium me-4">
                {drivers.filter(d => d.isLive).length || drivers.length}
              </span>
              <span className="text-base text-secondary-foreground">
                Colis en cours :
              </span>
              <span className="text-base text-foreground font-medium">
                {parcels.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleGps}
              className={`kt-btn font-medium text-xs px-4 py-2 transition-all ${
                isGpsActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'kt-btn-outline text-foreground'
              }`}
            >
              <i className={`ki-filled ${isGpsActive ? 'ki-check-circle' : 'ki-geolocation'} text-sm me-1.5`}></i>
              {isGpsActive ? 'GPS Actif (En direct)' : 'Activer Mon GPS'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="kt-container-fixed">
        <div className="grid gap-5 lg:gap-7.5">
          {gpsError && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <i className="ki-filled ki-information-2 text-base shrink-0"></i>
              <span>{gpsError}</span>
            </div>
          )}

          <div className="kt-card kt-card-grid min-w-full">
            {/* Filter Bar */}
            <div className="kt-card-header flex-wrap gap-3">
              <h3 className="kt-card-title text-sm">
                Vue carte en temps réel
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex">
                  <label className="kt-input">
                    <i className="ki-filled ki-magnifier"></i>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher livreur ou N° colis..."
                      type="text"
                    />
                  </label>
                </div>

                <KtSelect
                  value={selectedCity}
                  onChange={(val) => setSelectedCity(val)}
                  placeholder="Filtrer par ville"
                  className="w-48"
                  options={[
                    { value: '', label: 'Toutes les villes' },
                    { value: 'Casablanca', label: 'Casablanca' },
                    { value: 'Rabat', label: 'Rabat' },
                    { value: 'Marrakech', label: 'Marrakech' },
                    { value: 'Tanger', label: 'Tanger' },
                    { value: 'Agadir', label: 'Agadir' },
                    { value: 'Fès', label: 'Fès' },
                    { value: 'Meknès', label: 'Meknès' }
                  ]}
                />

                {(selectedCity || searchQuery) && (
                  <button
                    className="kt-btn kt-btn-outline"
                    onClick={() => { setSelectedCity(''); setSearchQuery(''); }}
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="kt-card-content p-0 relative">
              <div
                ref={mapContainerRef}
                style={{ height: '620px', width: '100%', borderRadius: '0 0 12px 12px' }}
                className="bg-muted/10 z-10"
              />

              {!leafletReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-xs z-20">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <i className="ki-filled ki-loading animate-spin text-lg"></i>
                    Chargement de la carte interactive...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
