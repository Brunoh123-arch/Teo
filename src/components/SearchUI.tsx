import React from 'react';
import { 
  Search, 
  Home, 
  Briefcase, 
  Star, 
  ArrowLeft, 
  MapPin 
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {getGreeting()}
          </h1>

          {/* Search Input */}
          <div
            className="bg-[var(--system-secondary-background)] rounded-full p-4 flex items-center gap-3 mb-6 cursor-text shadow-sm border border-gray-100"
            onClick={() => {
              triggerHaptic();
              setRideStatus("searching");
            }}
          >
            <Search className="w-5 h-5 text-[var(--system-secondary-label)]" />
            <span className="text-[var(--system-secondary-label)] font-semibold text-lg">
              Para onde vamos?
            </span>
          </div>

          {/* Recent/Saved Places */}
          <div className="flex flex-col gap-1 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
            {user ? (
              isLoadingPlaces ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : savedPlaces.length > 0 ? (
                savedPlaces.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => {
                      triggerHaptic(ImpactStyle.Medium);
                      handleSelectSavedPlace(place);
                    }}
                    className="ios-list-item w-full cursor-pointer"
                  >
                    <div className="bg-gray-100 p-2 rounded-full mr-4">
                      {place.icon === "home" && (
                        <Home className="w-5 h-5 text-gray-600" />
                      )}
                      {place.icon === "work" && (
                        <Briefcase className="w-5 h-5 text-gray-600" />
                      )}
                      {(!place.icon || place.icon === "star") && (
                        <Star className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--system-label)] text-lg">
                        {place.name}
                      </h3>
                      <p className="text-sm text-[var(--system-secondary-label)]">
                        {place.address}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 ios-list-item">
                  <p className="text-gray-500 mb-2">
                    Nenhum local salvo ainda.
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-4 ios-list-item">
                <p className="text-gray-500 mb-2">
                  Faça login para salvar seus locais favoritos.
                </p>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsLoginModalOpen(true);
                  }}
                  className="text-[var(--system-blue)] font-medium hover:underline"
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
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                triggerHaptic();
                setRideStatus("idle");
              }}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </button>
            <div className="bg-[var(--system-secondary-background)] rounded-full p-4 flex items-center gap-3 flex-1 shadow-sm border border-gray-100">
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-[var(--system-blue)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-[var(--system-secondary-label)]" />
              )}
              <input
                autoFocus
                type="text"
                placeholder="Para onde vamos?"
                className="bg-transparent border-none outline-none w-full text-lg font-semibold text-[var(--system-label)]"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
            {!placeToSave ? (
              searchResults.map((result, i) => (
                <div
                  key={i}
                  className="ios-list-item w-full cursor-pointer"
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    handleSelectDestination(result);
                  }}
                >
                  <div className="bg-blue-50 p-3 rounded-2xl mr-4">
                    <MapPin className="w-5 h-5 text-[var(--system-blue)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--system-label)] text-lg line-clamp-1">
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
                    className="p-2 text-[var(--system-secondary-label)] hover:text-yellow-500 transition-colors"
                  >
                    <Star className="w-6 h-6" />
                  </button>
                </div>
              ))
            ) : (
              <div className="mt-2 p-4 border border-gray-200 rounded-xl bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Salvar endereço como:
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {placeToSave.display_name}
                </p>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => {
                      triggerHaptic(ImpactStyle.Medium);
                      handleSavePlace(placeToSave, "home", "Casa");
                    }}
                    className="flex-1 bg-white border border-gray-200 p-3 rounded-xl flex flex-col items-center gap-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Home className="w-6 h-6" /> Casa
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
                    className="flex-1 bg-white border border-gray-200 p-3 rounded-xl flex flex-col items-center gap-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Briefcase className="w-6 h-6" /> Trabalho
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
                    className="flex-1 bg-white border border-gray-200 p-3 rounded-xl flex flex-col items-center gap-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Star className="w-6 h-6" /> Favorito
                  </button>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setPlaceToSave(null);
                  }}
                  className="w-full py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors"
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
