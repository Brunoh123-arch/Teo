import React from 'react';
import { 
  Search, 
  Home, 
  Briefcase, 
  Star, 
  ArrowLeft, 
  MapPin,
  ChevronRight,
  X,
  Tag
} from 'lucide-react';

interface SearchUIProps {
  rideStatus: any;
  setRideStatus: any;
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
  return (
    <div className="flex-1 bg-white overflow-y-auto">
      {rideStatus === "idle" && (
        <div>
          <h1 className="text-2xl font-bold p-4">{getGreeting()}</h1>

          <button
            className="flex items-center gap-3 p-4 bg-gray-100 rounded-2xl m-4"
            onClick={() => setRideStatus("searching")}
          >
            <Search size={20} className="text-gray-500" />
            <span className="text-base text-gray-500">Para onde vamos?</span>
          </button>

          <div className="px-4">
            {user ? (
              isLoadingPlaces ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : savedPlaces.length > 0 ? (
                savedPlaces.map((place, index) => (
                  <button
                    key={place.id}
                    onClick={() => handleSelectSavedPlace(place)}
                    className={`flex items-center gap-4 py-4 w-full ${index !== savedPlaces.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      {place.icon === "home" && <Home size={20} className="text-blue-600" />}
                      {place.icon === "work" && <Briefcase size={20} className="text-orange-500" />}
                      {(!place.icon || place.icon === "star") && <Star size={20} className="text-yellow-500" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-base font-bold text-gray-900">{place.name}</p>
                      <p className="text-sm text-gray-500">{place.address}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 font-medium">Nenhum local salvo ainda.</div>
              )
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 font-medium mb-3">Faça login para salvar seus locais favoritos.</p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-blue-600 font-bold text-lg"
                >
                  Entrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {rideStatus === "searching" && (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={() => setRideStatus("idle")}
              className="p-2"
            >
              <ArrowLeft size={28} className="text-blue-600" />
            </button>
            <div className="flex-1 flex items-center bg-gray-100 rounded-2xl px-4 h-12 gap-3">
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search size={20} className="text-gray-500" />
              )}
              <input
                autoFocus
                placeholder="Para onde vamos?"
                className="flex-1 bg-transparent text-base text-gray-900 outline-none"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery.length > 0 && (
                <button 
                  onClick={() => handleSearch('')}
                  className="bg-gray-400 rounded-full p-1"
                >
                  <X size={12} className="text-white" />
                </button>
              )}
            </div>
          </div>

          <div className="px-4">
            {!placeToSave ? (
              searchResults.map((result, i) => (
                <button
                  key={i}
                  className={`flex items-center gap-4 py-4 w-full ${i !== searchResults.length - 1 ? 'border-b border-gray-100' : ''}`}
                  onClick={() => handleSelectDestination(result)}
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <MapPin size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-bold text-gray-900">{result.name}</p>
                    <p className="text-sm text-gray-500">{result.details || result.display_name}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPlaceToSave(result); }}
                    className="p-3"
                  >
                    <Star size={24} className="text-gray-400" />
                  </button>
                </button>
              ))
            ) : (
              <div className="p-4">
                <p className="text-lg font-bold mb-2">Salvar endereço como:</p>
                <p className="text-sm text-gray-500 mb-6">{placeToSave.display_name}</p>
                
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => handleSavePlace(placeToSave, "home", "Casa")}
                    className="flex-1 flex flex-col items-center p-4 bg-gray-100 rounded-2xl gap-2"
                  >
                    <Home size={28} className="text-blue-600" />
                    <span className="text-xs font-bold text-gray-900">Casa</span>
                  </button>
                  <button
                    onClick={() => handleSavePlace(placeToSave, "work", "Trabalho")}
                    className="flex-1 flex flex-col items-center p-4 bg-gray-100 rounded-2xl gap-2"
                  >
                    <Briefcase size={28} className="text-orange-500" />
                    <span className="text-xs font-bold text-gray-900">Trabalho</span>
                  </button>
                  <button
                    onClick={() => handleSavePlace(placeToSave, "star", "Favorito")}
                    className="flex-1 flex flex-col items-center p-4 bg-gray-100 rounded-2xl gap-2"
                  >
                    <Star size={28} className="text-yellow-500" />
                    <span className="text-xs font-bold text-gray-900">Favorito</span>
                  </button>
                </div>

                <button
                  onClick={() => setPlaceToSave(null)}
                  className="w-full p-4 bg-gray-100 rounded-2xl text-base font-bold text-gray-900"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};