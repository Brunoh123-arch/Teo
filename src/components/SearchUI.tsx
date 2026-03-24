import React from 'react';
import { 
  Search, 
  Home, 
  Briefcase, 
  Star, 
  ArrowLeft, 
  MapPin,
  ChevronRight,
  X
} from 'lucide-react';
import { Skeleton } from './Skeleton';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface SearchUIProps {
  rideStatus: string;
  setRideStatus: (status: string) => void;
  getGreeting: () => string;
  user: any;
  isLoadingPlaces: boolean;
  isSearching?: boolean;
  savedPlaces: any[];
  handleSelectSavedPlace: (place: any) => void;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  searchQuery: string;
  handleSearch: (query: string) => void;
  searchResults: any[];
  handleSelectDestination: (result: any) => void;
  placeToSave: any;
  setPlaceToSave: (place: any) => void;
  handleSavePlace: (place: any, icon: string, name: string) => void;
}

export const SearchUI: React.FC<SearchUIProps> = ({
  rideStatus,
  setRideStatus,
  getGreeting,
  user,
  isLoadingPlaces,
  isSearching,
  savedPlaces,
  handleSelectSavedPlace,
  setIsLoginModalOpen,
  searchQuery,
  handleSearch,
  searchResults,
  handleSelectDestination,
  placeToSave,
  setPlaceToSave,
  handleSavePlace,
}) => {
  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('Haptics not available', e);
      }
    }
  };

  return (
    <>
      {rideStatus === "idle" && (
        <>
          <h1 className="text-3xl font-bold text-[var(--system-label)] mb-6 px-1">
            {getGreeting()}
          </h1>

          {/* Search Input */}
          <div
            className="bg-[var(--system-secondary-background)] rounded-2xl p-4 flex items-center gap-3 mb-8 cursor-text shadow-sm border border-[var(--system-separator)]/30 active:opacity-70 transition-opacity"
            onClick={() => {
              triggerHaptic();
              setRideStatus("searching");
            }}
          >
            <Search className="w-5 h-5 text-[var(--system-secondary-label)]" />
            <span className="text-[var(--system-secondary-label)] font-medium text-lg">
              Para onde vamos?
            </span>
          </div>

          {/* Recent/Saved Places */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--system-separator)]/30 shadow-sm bg-[var(--system-secondary-background)]">
            {user ? (
              isLoadingPlaces ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : savedPlaces.length > 0 ? (
                savedPlaces.map((place, index) => (
                  <div
                    key={place.id}
                    onClick={() => {
                      triggerHaptic(ImpactStyle.Medium);
                      handleSelectSavedPlace(place);
                    }}
                    className={`ios-list-item w-full cursor-pointer ${index === savedPlaces.length - 1 ? 'border-none' : ''}`}
                  >
                    <div className="bg-[var(--system-background)] p-2.5 rounded-full mr-4">
                      {place.icon === "home" && (
                        <Home className="w-5 h-5 text-[var(--system-blue)]" />
                      )}
                      {place.icon === "work" && (
                        <Briefcase className="w-5 h-5 text-[var(--system-orange)]" />
                      )}
                      {(!place.icon || place.icon === "star") && (
                        <Star className="w-5 h-5 text-[var(--system-yellow)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--system-label)] text-lg leading-tight">
                        {place.name}
                      </h3>
                      <p className="text-sm text-[var(--system-secondary-label)] line-clamp-1 mt-0.5">
                        {place.address}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--system-tertiary-label)]" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-[var(--system-secondary-label)] font-medium">
                    Nenhum local salvo ainda.
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-8 px-4">
                <p className="text-[var(--system-secondary-label)] font-medium mb-3">
                  Faça login para salvar seus locais favoritos.
                </p>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsLoginModalOpen(true);
                  }}
                  className="text-[var(--system-blue)] font-semibold text-lg active:opacity-70"
                >
                  Entrar
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {rideStatus === "searching" && (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                triggerHaptic();
                setRideStatus("idle");
              }}
              className="p-2 -ml-2 active:opacity-50 transition-opacity"
            >
              <ArrowLeft className="w-7 h-7 text-[var(--system-blue)]" />
            </button>
            <div className="bg-[var(--system-secondary-background)] rounded-2xl p-3.5 flex items-center gap-3 flex-1 shadow-sm border border-[var(--system-separator)]/30">
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-[var(--system-blue)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-[var(--system-secondary-label)]" />
              )}
              <input
                autoFocus
                type="text"
                placeholder="Para onde vamos?"
                className="bg-transparent border-none outline-none w-full text-lg font-medium text-[var(--system-label)] placeholder:text-[var(--system-tertiary-label)]"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => handleSearch('')}
                  className="p-1 bg-[var(--system-tertiary-label)] rounded-full"
                >
                  <X className="w-3 h-3 text-[var(--system-background)]" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--system-separator)]/30 shadow-sm bg-[var(--system-secondary-background)]">
            {!placeToSave ? (
              searchResults.map((result, i) => (
                <div
                  key={i}
                  className={`ios-list-item w-full cursor-pointer ${i === searchResults.length - 1 ? 'border-none' : ''}`}
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    handleSelectDestination(result);
                  }}
                >
                  <div className="bg-[var(--system-background)] p-3 rounded-xl mr-4">
                    <MapPin className="w-5 h-5 text-[var(--system-blue)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--system-label)] text-lg line-clamp-1 leading-tight">
                      {result.name}
                    </h3>
                    <p className="text-sm text-[var(--system-secondary-label)] line-clamp-1 mt-0.5">
                      {result.details || result.display_name}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      setPlaceToSave(result);
                    }}
                    className="p-3 text-[var(--system-tertiary-label)] active:text-[var(--system-yellow)] transition-colors"
                  >
                    <Star className="w-6 h-6" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 bg-[var(--system-secondary-background)]">
                <h3 className="text-xl font-bold text-[var(--system-label)] mb-2">
                  Salvar endereço como:
                </h3>
                <p className="text-sm text-[var(--system-secondary-label)] mb-6 line-clamp-2 font-medium">
                  {placeToSave.display_name}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() => {
                      triggerHaptic(ImpactStyle.Medium);
                      handleSavePlace(placeToSave, "home", "Casa");
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[var(--system-background)] border border-[var(--system-separator)]/20 active:bg-[var(--system-tertiary-background)] transition-colors"
                  >
                    <Home className="w-7 h-7 text-[var(--system-blue)]" />
                    <span className="text-sm font-bold text-[var(--system-label)]">Casa</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(ImpactStyle.Medium);
                      handleSavePlace(
                        placeToSave,
                        "work",
                        "Trabalho",
                      );
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[var(--system-background)] border border-[var(--system-separator)]/20 active:bg-[var(--system-tertiary-background)] transition-colors"
                  >
                    <Briefcase className="w-7 h-7 text-[var(--system-orange)]" />
                    <span className="text-sm font-bold text-[var(--system-label)]">Trabalho</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(ImpactStyle.Medium);
                      handleSavePlace(
                        placeToSave,
                        "star",
                        "Favorito",
                      );
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[var(--system-background)] border border-[var(--system-separator)]/20 active:bg-[var(--system-tertiary-background)] transition-colors"
                  >
                    <Star className="w-7 h-7 text-[var(--system-yellow)]" />
                    <span className="text-sm font-bold text-[var(--system-label)]">Favorito</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setPlaceToSave(null);
                  }}
                  className="w-full py-4 text-[var(--system-red)] font-bold text-lg active:opacity-50 transition-opacity"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
