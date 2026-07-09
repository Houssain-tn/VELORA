import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSites, useInterventions } from '@/hooks/useApi';
import { MapPin, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet + Vite
const DefaultIcon = L.divIcon({
  html: `<div class="bg-primary p-2 rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const CriticalIcon = L.divIcon({
  html: `<div class="bg-destructive p-2 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-white animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
         </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function MapAutoCenter({ sites }: { sites: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    // 1. Resize Observer for structural changes
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);

    // 2. Heartbeat Invalidations: Force sync during first 2s of load
    // This is the definitive fix for Tile Clipping in complex CSS grids
    let count = 0;
    const heartbeat = setInterval(() => {
      map.invalidateSize();
      count++;
      if (count > 20) clearInterval(heartbeat);
    }, 100);

    if (sites && sites.length > 0) {
      const validSites = sites.filter(s => s.latitude && s.longitude);
      if (validSites.length > 0) {
        const bounds = L.latLngBounds(validSites.map(s => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
    
    return () => {
      observer.disconnect();
      clearInterval(heartbeat);
    };
  }, [sites, map]);
  
  return null;
}

export function MapWidget() {
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: interventions } = useInterventions();
  const navigate = useNavigate();

  const getSiteStatus = (siteId: number) => {
    const siteInterventions = interventions?.filter((inv: any) => inv.siteId === siteId && inv.status !== 'CLOTUREE');
    const critical = siteInterventions?.some((inv: any) => inv.priority === 'URGENTE');
    return {
      count: siteInterventions?.length || 0,
      isCritical: critical
    };
  };

  if (sitesLoading) {
    return (
      <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center border-2 border-dashed">
        <MapPin className="w-8 h-8 text-muted-foreground/30" />
      </div>
    );
  }

  // Default center (Sousse, Tunisie if no sites)
  const defaultCenter: [number, number] = [35.8256, 10.6369];

  return (
    <div className="h-full w-full relative rounded-xl overflow-hidden border shadow-inner bg-muted/5 z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {sites?.filter((s: any) => s.latitude && s.longitude).map((site: any) => {
          const status = getSiteStatus(site.id);
          return (
            <Marker 
              key={site.id} 
              position={[site.latitude, site.longitude]} 
              icon={status.isCritical ? CriticalIcon : DefaultIcon}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-primary uppercase">{site.name}</h4>
                    {status.isCritical && <span className="bg-destructive text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase tracking-tighter">Urgence</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3" /> {site.address || site.city || 'Adresse non spécifiée'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                      <span className="block text-[8px] uppercase font-bold text-muted-foreground tracking-tighter">Tickets</span>
                      <span className="text-xs font-black">{status.count}</span>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                      <span className="block text-[8px] uppercase font-bold text-muted-foreground tracking-tighter">Santé</span>
                      <span className="text-xs font-black text-green-500">98%</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/sites')}
                    className="w-full py-1.5 bg-primary text-white text-[10px] font-bold rounded-md hover:bg-primary/90 flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
                  >
                    <Info className="w-3 h-3" /> Fiche Technique
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapAutoCenter sites={sites || []} />
      </MapContainer>

      {/* Map Overlay info */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/80 backdrop-blur-md p-3 rounded-xl border shadow-xl flex items-center gap-4 text-[10px] font-black uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm" />
          <span>Opérationnel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-destructive rounded-full border-2 border-white animate-pulse shadow-sm" />
          <span>Incidents Critiques</span>
        </div>
      </div>
    </div>
  );
}
