import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Home, Briefcase, Star, Plus, Trash2, Search } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  icon?: 'home' | 'work' | 'star';
}

interface SavedPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: SavedPlace[];
  onAddPlace: (place: any) => void;
  onRemovePlace: (id: string) => void;
  onSelectPlace: (place: SavedPlace) => void;
  isLoading?: boolean;
}

export const SavedPlacesModal: React.FC<SavedPlacesModalProps> = ({
  isOpen,
  onClose,
  places,
  onAddPlace,
  onRemovePlace,
  onSelectPlace,
  isLoading = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case 'home': return <Home className="text-blue-600" size={20} />;
      case 'work': return <Briefcase className="text-orange-600" size={20} />;
      default: return <Star className="text-yellow-500" size={20} />;
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5`);
      const data = await response.json();
      setSearchResults(data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      })));
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2100] flex flex-col justify-end pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full h-[85vh] rounded-t-3xl flex flex-col relative z-10 shadow-2xl overflow-hidden border-t border-white/50"
          >
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20 rounded-t-3xl">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-lg text-[var(--system-label)]">Locais Salvos</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--system-background)]">
              {isAdding ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar novo local..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>

                  {isSearching ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((result, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            onAddPlace(result);
                            setIsAdding(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-start gap-3 text-left hover:bg-blue-50 transition-colors shadow-sm"
                        >
                          <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{result.name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{result.address}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 3 && (
                    <div className="text-center py-8 text-gray-500">Nenhum resultado encontrado.</div>
                  )}

                  <button
                    onClick={() => setIsAdding(false)}
                    className="w-full py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full p-4 bg-blue-50 border border-dashed border-blue-200 rounded-2xl flex items-center justify-center gap-2 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={20} />
                    Adicionar Novo Local
                  </button>

                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                    </div>
                  ) : places.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Star size={40} className="text-gray-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Nenhum local salvo</h4>
                        <p className="text-sm text-gray-500">Salve seus destinos favoritos para pedir mais rápido.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {places.map((place) => (
                        <div
                          key={place.id}
                          className="group bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                          onClick={() => onSelectPlace(place)}
                        >
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            {getIcon(place.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{place.name}</h4>
                            <p className="text-xs text-gray-500 truncate">{place.address}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemovePlace(place.id);
                            }}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
