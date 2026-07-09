import { useState } from 'react';
import { Plus, Search, MapPin, Building2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSites } from '@/hooks/useApi';
import { AddSiteModal } from '@/components/modals/AddSiteModal';
import { SiteDetailModal } from '@/components/modals/SiteDetailModal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default map pins
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function Sites() {
  const { data: sites, isLoading, error } = useSites();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Chargement des sites...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Erreur lors de la récupération des sites.</div>;

  const filteredSites = sites?.filter((site: any) => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Gestion des Sites</h2>
          <p className="text-muted-foreground font-medium italic">Localisations physiques de vos clients et équipements interactives.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[3]" /> Ajouter un Site
        </button>
      </div>

      <AddSiteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <SiteDetailModal 
        isOpen={!!selectedSite} 
        onClose={() => setSelectedSite(null)} 
        site={selectedSite} 
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher un site..."
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors pl-9 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LEAFLET INTERACTIVE MAP */}
      <div className="w-full h-[400px] bg-card border shadow-xl rounded-[2rem] overflow-hidden z-10 relative group">
         <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur pb-1 px-4 py-2 rounded-xl border shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Carte Live</span>
         </div>
         <MapContainer center={[35.8256, 10.6369]} zoom={8} scrollWheelZoom={false} className="w-full h-full z-10">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredSites?.map((site: any) => {
              // Basic coordinate mock based on ID if not provided (for demonstration)
              const lat = site.latitude || (35.8 + (site.id * 0.05) % 2);
              const lng = site.longitude || (10.6 + (site.id * 0.05) % 2);

              return (
                 <Marker key={site.id} position={[lat, lng]}>
                   <Popup className="rounded-2xl">
                      <div className="p-1">
                        <h4 className="font-black uppercase tracking-tight text-primary mb-1">{site.name}</h4>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">{site.city}</p>
                        <button 
                          onClick={() => setSelectedSite(site)}
                          className="mt-3 w-full px-3 py-1.5 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                        >
                          Ouvrir Fiche
                        </button>
                      </div>
                   </Popup>
                 </Marker>
              );
            })}
         </MapContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSites?.map((site: any) => (
          <div key={site.id} className="border rounded-lg bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{site.name}</h3>
                    <p className="text-sm text-muted-foreground">{site.contract?.client?.name || 'Sans client'}</p>
                  </div>
                </div>
                <div className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", 
                  site.type === 'BATIMENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                )}>
                  {site.type}
                </div>
              </div>
              <div className="space-y-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{site.city || 'Ville non spécifiée'}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-muted/10 flex justify-end">
              <button 
                onClick={() => setSelectedSite(site)}
                className="text-primary hover:text-primary/70 text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 transition-colors"
              >
                Voir la fiche <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
