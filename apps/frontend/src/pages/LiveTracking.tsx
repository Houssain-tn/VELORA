import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSites, useInterventions, useVehicles } from '@/hooks/useApi';
import { MapPin, Info, Car, Wrench, Search, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Icons
const SiteIcon = L.divIcon({
  html: `<div class="bg-primary p-2 rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const VehicleIcon = L.divIcon({
  html: `<div class="bg-amber-500 p-2 rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H8a2 2 0 0 0-2 2v6h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const TechIcon = L.divIcon({
  html: `<div class="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapAutoCenter({ items, activeId }: { items: any[], activeId?: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    // 1. Resize Observer for structural changes
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);

    // 2. Heartbeat Invalidations
    let count = 0;
    const heartbeat = setInterval(() => {
      map.invalidateSize();
      count++;
      if (count > 20) clearInterval(heartbeat);
    }, 100);

    return () => {
      observer.disconnect();
      clearInterval(heartbeat);
    };
  }, [map]);

  useEffect(() => {
    if (activeId && items.length > 0) {
      const activeItem = items.find(i => i.id === activeId);
      if (activeItem && activeItem.lat && activeItem.lng) {
        map.flyTo([activeItem.lat, activeItem.lng], 16, { duration: 1.5 });
      }
    } else if (items.length > 0 && !activeId) {
      const validItems = items.filter(i => i.lat && i.lng);
      if (validItems.length > 0) {
        const bounds = L.latLngBounds(validItems.map(i => [i.lat, i.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [activeId, items, map]);
  
  return null;
}

export function LiveTracking() {
  const { data: sites } = useSites();
  const { data: interventions } = useInterventions();
  const { data: vehicles } = useVehicles();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SITES' | 'TECHS' | 'VEHICLES'>('ALL');
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Default center (Sousse)
  const defaultCenter: [number, number] = [35.8256, 10.6369];

  // Map Data Generators (Simulation of GPS coordinates around Sousse)
  // In a real app, these would come directly from the DB/GPS hardware
  const mapItems = useMemo(() => {
    const items: any[] = [];
    
    // 1. SITES (Real coordinates)
    (sites || []).forEach((site: any) => {
      if (site.latitude && site.longitude) {
        items.push({
          id: `site-${site.id}`,
          type: 'SITE',
          title: site.name,
          subtitle: site.address || site.city,
          lat: site.latitude,
          lng: site.longitude,
          status: 'Opérationnel',
          realId: site.id
        });
      }
    });

    // 2. TECHS (Simulated coordinates near sites for active interventions)
    (interventions || []).filter((i: any) => i.status === 'EN_COURS').forEach((int: any) => {
      const parentSite = sites?.find((s: any) => s.id === int.siteId);
      if (parentSite && parentSite.latitude) {
        // Offset slightly from site
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;
        items.push({
          id: `tech-${int.id}`,
          type: 'TECH',
          title: int.assignedTo?.name || 'Technicien',
          subtitle: `Intervention: ${int.title}`,
          lat: parentSite.latitude + latOffset,
          lng: parentSite.longitude + lngOffset,
          status: 'En mission',
          realId: int.id
        });
      }
    });

    // 3. VEHICLES (Simulated coordinates)
    (vehicles || []).filter((v: any) => v.status === 'EN_MISSION').forEach((veh: any) => {
        items.push({
          id: `veh-${veh.id}`,
          type: 'VEHICLE',
          title: veh.registration,
          subtitle: `${veh.brand} ${veh.model}`,
          lat: defaultCenter[0] + (Math.random() - 0.5) * 0.05,
          lng: defaultCenter[1] + (Math.random() - 0.5) * 0.05,
          status: 'En mouvement',
          realId: veh.id
        });
    });

    return items;
  }, [sites, interventions, vehicles]);

  const filteredItems = mapItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.subtitle && item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesTab = true;
    if (activeTab === 'SITES') matchesTab = item.type === 'SITE';
    if (activeTab === 'TECHS') matchesTab = item.type === 'TECH';
    if (activeTab === 'VEHICLES') matchesTab = item.type === 'VEHICLE';

    return matchesSearch && matchesTab;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 animate-in fade-in duration-500">
      {/* Sidebar List */}
      <div className="w-full md:w-80 bg-card border-2 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b bg-muted/20">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 mb-4">
            <Navigation className="w-5 h-5 text-primary" /> Command Center
          </h2>
          <div className="relative group mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher un actif..."
              className="flex h-10 w-full rounded-lg border-2 border-input bg-background px-3 py-1 text-sm shadow-sm transition-all pl-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
             <button onClick={() => setActiveTab('ALL')} className={cn("flex-1 text-[10px] font-bold uppercase py-1.5 rounded transition-all", activeTab === 'ALL' ? "bg-background shadow-sm" : "text-muted-foreground")}>Tous</button>
             <button onClick={() => setActiveTab('SITES')} className={cn("flex-1 text-[10px] font-bold uppercase py-1.5 rounded transition-all", activeTab === 'SITES' ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}>Sites</button>
             <button onClick={() => setActiveTab('TECHS')} className={cn("flex-1 text-[10px] font-bold uppercase py-1.5 rounded transition-all", activeTab === 'TECHS' ? "bg-background text-blue-600 shadow-sm" : "text-muted-foreground")}>Techs</button>
             <button onClick={() => setActiveTab('VEHICLES')} className={cn("flex-1 text-[10px] font-bold uppercase py-1.5 rounded transition-all", activeTab === 'VEHICLES' ? "bg-background text-amber-600 shadow-sm" : "text-muted-foreground")}>Flotte</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => setFocusedId(item.id)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                focusedId === item.id ? "bg-primary/10 border-primary" : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  item.type === 'SITE' ? "bg-primary/10 text-primary" :
                  item.type === 'TECH' ? "bg-blue-100 text-blue-600" :
                  "bg-amber-100 text-amber-600"
                )}>
                  {item.type === 'SITE' && <MapPin className="w-4 h-4" />}
                  {item.type === 'TECH' && <Wrench className="w-4 h-4" />}
                  {item.type === 'VEHICLE' && <Car className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate">{item.title}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
             <div className="text-center p-8 text-muted-foreground text-xs font-bold uppercase">Aucun actif trouvé</div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-muted/5 border-2 rounded-xl shadow-inner relative overflow-hidden z-0">
        <MapContainer 
          center={defaultCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {filteredItems.map((item) => (
            <Marker 
              key={item.id} 
              position={[item.lat, item.lng]} 
              icon={item.type === 'SITE' ? SiteIcon : item.type === 'TECH' ? TechIcon : VehicleIcon}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{item.subtitle}</p>
                  
                  {item.type === 'SITE' && (
                    <button onClick={() => navigate('/sites')} className="w-full py-1.5 bg-primary text-white text-[10px] font-bold rounded hover:bg-primary/90 transition-all uppercase tracking-widest flex items-center justify-center gap-1">
                       <Info className="w-3 h-3" /> Fiche Site
                    </button>
                  )}
                  {item.type === 'TECH' && (
                    <button onClick={() => navigate('/interventions')} className="w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition-all uppercase tracking-widest flex items-center justify-center gap-1">
                       <Wrench className="w-3 h-3" /> Intervention
                    </button>
                  )}
                  {item.type === 'VEHICLE' && (
                    <button onClick={() => navigate('/parc-automobile')} className="w-full py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded hover:bg-amber-600 transition-all uppercase tracking-widest flex items-center justify-center gap-1">
                       <Car className="w-3 h-3" /> Parc Auto
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          <MapAutoCenter items={filteredItems} activeId={focusedId} />
        </MapContainer>
      </div>
    </div>
  );
}
