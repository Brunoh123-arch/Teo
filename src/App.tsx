import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  Menu,
  Navigation,
  ShieldAlert,
} from "lucide-react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { rideService } from "./services/rideService";
import { userService } from "./services/userService";
import { socketService } from "./services/socketService";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  where,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Device } from "@capacitor/device";
import { Keyboard } from "@capacitor/keyboard";
import { App as CapApp } from "@capacitor/app";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

import {
  auth,
  db,
  signInWithGoogle,
  logOut,
  messaging,
  getToken,
  onMessage,
} from "./firebase";
import { handleFirestoreError, OperationType } from "./firebase-error";
import Map from "./components/Map";
import { TermsModal } from "./components/TermsModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "./components/Skeleton";
import { SideMenu } from "./components/Menu";
import { BottomNav } from "./components/BottomNav";
import { DriverVerification } from "./components/DriverVerification";
import { AuthModal } from "./components/AuthModal";
import { ChatModal } from "./components/ChatModal";
import { VehicleProfileModal } from "./components/VehicleProfileModal";
import { RideHistoryModal } from "./components/RideHistoryModal";
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { RideFlow } from "./components/RideFlow";
import { SearchUI } from "./components/SearchUI";
import { DriverUI } from "./components/DriverUI";
import { AdminPanel } from "./components/AdminPanel";
import { WalletModal } from "./components/WalletModal";
import { SupportModal } from "./components/SupportModal";
import { SafetyCenterModal } from "./components/SafetyCenterModal";
import { RateRideModal } from "./components/RateRideModal";
import { CancelRideModal } from "./components/CancelRideModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { ShareRideView } from "./components/ShareRideView";
import { NotificationCenterModal } from "./components/NotificationCenterModal";
import { SavedPlacesModal } from "./components/SavedPlacesModal";
import { ReferralModal } from "./components/ReferralModal";
import { PromoModal } from "./components/PromoModal";
import { DriverEarningsModal } from "./components/DriverEarningsModal";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  icon?: "home" | "work" | "star";
}

const MemoizedMap = React.memo(Map);
const MemoizedRideFlow = React.memo(RideFlow);

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [shareRideId, setShareRideId] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share-ride/')) {
      const id = path.split('/')[2];
      setShareRideId(id);
    }
  }, []);

  if (shareRideId) {
    return <ShareRideView rideId={shareRideId} />;
  }
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [rideStatus, setRideStatus] = useState<
    "idle" | "searching" | "selecting" | "requesting" | "accepted" | "completed"
  >("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [destination, setDestination] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number, duration: number } | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<"rider" | "driver">("rider");
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [activeDriverRide, setActiveDriverRide] = useState<any | null>(null);
  const activeDriverRideRef = React.useRef<any | null>(null);

  useEffect(() => {
    activeDriverRideRef.current = activeDriverRide;
  }, [activeDriverRide]);

  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(
    null,
  );
  const [driverRouteRideId, setDriverRouteRideId] = useState<string | null>(
    null,
  );
  const [driverRouteStatus, setDriverRouteStatus] = useState<string | null>(
    null,
  );
  const [rideEstimate, setRideEstimate] = useState<{
    distance: number;
    duration: number;
    pricePadrao: number;
    priceComfort: number;
    surgeMultiplier?: number;
  } | null>(null);
  const [selectedRideType, setSelectedRideType] = useState<
    "padrao" | "comfort"
  >("padrao");
  const [completedRideData, setCompletedRideData] = useState<any | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);
  const [placeToSave, setPlaceToSave] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [otherUserName, setOtherUserName] = useState("Chat");
  const handleOpenChat = () => {
    if (appMode === "driver" && activeDriverRide) {
      setOtherUserName(activeDriverRide.userName || "Passageiro");
    } else if (appMode === "rider" && rideStatus !== "idle") {
      // For rider, we might not have the driver name easily accessible in a single state
      // unless we fetch it or it's in activeRideData (which we don't have here)
      setOtherUserName("Motorista");
    }
    setIsChatOpen(true);
  };

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "pix" | "dinheiro" | "cartao"
  >("pix");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSafetyCenterOpen, setIsSafetyCenterOpen] = useState(false);
  const [isRateRideOpen, setIsRateRideOpen] = useState(false);
  const [rideToRateId, setRideToRateId] = useState<string | null>(null);
  const [driverNameToRate, setDriverNameToRate] = useState<string | undefined>(undefined);
  const [driverPhotoToRate, setDriverPhotoToRate] = useState<string | undefined>(undefined);
  const [isCancelRideOpen, setIsCancelRideOpen] = useState(false);
  const [rideToCancelId, setRideToCancelId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<any | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [rideHistory, setRideHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isVehicleProfileOpen, setIsVehicleProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [vehicleData, setVehicleData] = useState({
    model: "",
    color: "",
    plate: "",
    year: "",
  });
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [dailyEarnings, setDailyEarnings] = useState<number>(0);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  const [driverStatus, setDriverStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [showLocationDisclosure, setShowLocationDisclosure] = useState(false);
  const [showBackgroundEducationModal, setShowBackgroundEducationModal] = useState(false);

  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isEarningsOpen, setIsEarningsOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralStats, setReferralStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // ... (rest of the component)

  // Native Polish
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Configure Status Bar
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#ffffff' });
      
      // Configure Keyboard
      if (Capacitor.getPlatform() === 'ios') {
        Keyboard.setAccessoryBarVisible({ isVisible: false });
      }

      // Hide Splash Screen if needed (usually handled by config but good to be sure)
      // SplashScreen.hide();

      // Handle Android Back Button
      const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          if (isMenuOpen) {
            setIsMenuOpen(false);
          } else if (rideStatus !== 'idle') {
            // Confirm cancel ride or go back to idle
            if (rideStatus === 'selecting') {
              setRideStatus('idle');
              setDestination(null);
            }
          } else {
            CapApp.exitApp();
          }
        }
      });

      return () => {
        backListener.then(l => l.remove());
      };
    }
  }, [isMenuOpen, rideStatus]);

  useEffect(() => {
    if (user) {
      fetchReferralInfo();
    }
  }, [user]);

  const fetchReferralInfo = async () => {
    try {
      const data = await userService.getReferralInfo();
      setReferralCode(data.code);
      setReferralStats(data.stats);
    } catch (error) {
      console.error("Error fetching referral info:", error);
    }
  };

  const handleApplyReferral = async (code: string) => {
    try {
      await userService.applyReferralCode(code);
      toast.success("Código de indicação aplicado com sucesso!");
      fetchReferralInfo(); // Refresh stats
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      setNotifications([
        {
          id: '1',
          title: 'Bem-vindo ao RideFlow!',
          body: 'Obrigado por se juntar a nós. Aproveite sua primeira corrida com 20% de desconto usando o cupom BEMVINDO.',
          type: 'info',
          timestamp: new Date(),
          read: false
        },
        {
          id: '2',
          title: 'Novo Cupom Disponível',
          body: 'Use o código VERÃO2026 para ganhar R$ 10,00 de desconto em qualquer corrida hoje.',
          type: 'promo',
          timestamp: new Date(Date.now() - 3600000),
          read: false
        }
      ]);
    }
  }, [user]);

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Handle Shared Ride
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("sharedRideId");
    if (sharedId) {
      setCurrentRideId(sharedId);
      setIsSharedView(true);
      setRideStatus("accepted");
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Boa noite";
    if (hour >= 5 && hour < 12) greeting = "Bom dia";
    else if (hour >= 12 && hour < 18) greeting = "Boa tarde";

    if (user && user.displayName) {
      const firstName = user.displayName.split(" ")[0];
      return `Olá ${firstName}, ${greeting}!`;
    }
    return `Olá, ${greeting}!`;
  };

  // Fetch Nearby Drivers
  useEffect(() => {
    if (appMode === 'rider' && rideStatus === 'idle' && user) {
      const fetchNearby = async () => {
        try {
          const drivers = await rideService.getNearbyDrivers();
          setNearbyDrivers(drivers);
        } catch (error) {
          console.error("Error fetching nearby drivers:", error);
        }
      };
      fetchNearby();
      const interval = setInterval(fetchNearby, 30000); // 30s
      return () => clearInterval(interval);
    } else if (rideStatus !== 'idle') {
      setNearbyDrivers([]);
    }
  }, [appMode, rideStatus, user]);

  // Auth & User Document Listener
  useEffect(() => {
    console.log("Auth listener setup");
    let unsubUser: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth State Changed:", currentUser?.uid);
      setUser(currentUser);
      setIsAuthReady(true);

      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (currentUser) {
        // Request FCM Token
        requestNotificationPermission();

        const userDocRef = doc(db, "users", currentUser.uid);
        unsubUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("User Doc Updated:", data);
            if (data.vehicle) setVehicleData(data.vehicle);
            if (data.isOnline !== undefined) setIsOnline(data.isOnline);
            if (data.role === "admin" || currentUser.email === "gringaviews@gmail.com") setIsAdmin(true);
            setDriverStatus(data.driverStatus || "none");
            setRejectionReason(data.rejectionReason || null);
            setDriverData(data.driverData || null);
            if (!data.termsAccepted) {
              setShowTerms(true);
            } else {
              setShowTerms(false);
            }
          } else {
            console.log("User Doc does not exist, syncing via API...");
            userService.syncUser(currentUser.displayName, currentUser.email)
              .catch(err => console.error("Error syncing user:", err));
          }
        }, (err) => {
          console.error("User doc listener error:", err);
        });
      } else {
        setIsOnline(false);
        setIsAdmin(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  // Redundant fetch removed (lines 152-172 in previous version)

  const requestNotificationPermission = async () => {
    if (!user) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Native Android/iOS Push Notifications via Capacitor
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn("User denied push notification permission");
          return;
        }

        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();

        // Clear previous listeners to avoid duplicates
        await PushNotifications.removeAllListeners();

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          try {
            await userService.updateFcmToken(token.value);
            console.log("Native FCM Token saved");
          } catch (e) {
            console.error("Error saving native token", e);
          }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
            toast(notification.title || "Nova Notificação", {
              description: notification.body,
              duration: 5000,
            });
          },
        );

        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
          },
        );

      } else {
        // Web Push Notifications via Firebase JS SDK
        if (!messaging) return;
        
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await getToken(messaging, {
            vapidKey:
              "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeZ1TBAtrL9yG4PAL794RVjvQVKrqCjQ2EnusRoSVtrejPAvRsEg", // Placeholder
          });

          if (token) {
            await userService.updateFcmToken(token);
            console.log("Web FCM Token saved");
          }
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      toast(payload.notification?.title || "Nova Notificação", {
        description: payload.notification?.body,
        duration: 5000,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // State Recovery Logic
  const recoverActiveRide = React.useCallback(async () => {
    if (!isAuthReady || !user) return;
    try {
      const activeRide = await rideService.getActiveRide(appMode);
      if (activeRide) {
        if (appMode === "driver") {
          setActiveDriverRide(activeRide);
          socketService.joinRide(activeRide.id);
        } else {
          setCurrentRideId(activeRide.id);
          setRideStatus(activeRide.status);
          socketService.joinRide(activeRide.id);
        }
      } else {
        if (appMode === "driver" && activeDriverRide) {
          setActiveDriverRide(null);
          setDriverRouteRideId(null);
          setDestination(null);
          setRoute(null);
        } else if (appMode === "rider" && currentRideId && !isSharedView) {
          setCurrentRideId(null);
          setRideStatus("idle");
          setDestination(null);
          setRoute(null);
        }
      }
    } catch (error) {
      console.error("Error recovering active ride:", error);
    }
  }, [isAuthReady, user, appMode, activeDriverRide, currentRideId, isSharedView]);

  // Run recovery on auth ready and app mode change
  useEffect(() => {
    recoverActiveRide();
  }, [recoverActiveRide]);

  // Run recovery on app resume (foreground)
  useEffect(() => {
    const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log("App resumed, recovering state and reconnecting socket...");
        socketService.connect();
        if (appMode === "driver" && isOnline) {
          socketService.joinDrivers();
        }
        recoverActiveRide();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [appMode, isOnline, recoverActiveRide]);

  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length > 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        // Verificar cache
        const cacheKey = `search_cache_${query.toLowerCase()}`;
        const cachedResults = localStorage.getItem(cacheKey);
        if (cachedResults) {
          setSearchResults(JSON.parse(cachedResults));
          return;
        }

        setIsSearching(true);
        try {
          // Primary: Photon API
          let res = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=-1.295&lon=-47.926&limit=8`,
          );
          
          let data;
          if (res.ok) {
            data = await res.json();
          }

          // Fallback: Nominatim
          if (!data || !data.features || data.features.length === 0) {
            const nominatimRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
            );
            if (nominatimRes.ok) {
              const nominatimData = await nominatimRes.json();
              const mappedNominatim = nominatimData.map((item: any) => ({
                lat: item.lat,
                lon: item.lon,
                display_name: item.display_name,
                name: item.display_name.split(',')[0],
                details: item.display_name.split(',').slice(1).join(',').trim(),
                city: item.address?.city || item.address?.town || item.address?.village,
              }));
              localStorage.setItem(cacheKey, JSON.stringify(mappedNominatim));
              setSearchResults(mappedNominatim);
              return;
            }
          }

          if (!data || !data.features) {
            setSearchResults([]);
            return;
          }

          // Map Photon features
          const mappedResults = data.features.map((feature: any) => {
            const props = feature.properties;
            let name = props.name || props.street || "Endereço desconhecido";
            let houseNumber = props.housenumber;
            if (!houseNumber) {
              const numberMatch = query.match(/\b\d+[a-zA-Z]?\b/);
              if (numberMatch) houseNumber = numberMatch[0];
            }

            if (houseNumber) {
              if (name === props.street) name = `${name}, ${houseNumber}`;
              else if (props.street) name = `${name} (${props.street}, ${houseNumber})`;
              else name = `${name}, ${houseNumber}`;
            }

            const details = [props.district, props.city, props.state].filter(Boolean).join(", ");

            return {
              lat: feature.geometry.coordinates[1].toString(),
              lon: feature.geometry.coordinates[0].toString(),
              display_name: details ? `${name} - ${details}` : name,
              name: name,
              details: details,
              city: props.city,
            };
          });

          const uniqueResults = mappedResults.filter(
            (value: any, index: number, self: any[]) =>
              index === self.findIndex((t) => t.name === value.name && t.city === value.city),
          );

          localStorage.setItem(cacheKey, JSON.stringify(uniqueResults));
          setSearchResults(uniqueResults);
        } catch (e) {
          console.error("Search error:", e);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const recenterMap = () => {
    window.dispatchEvent(new CustomEvent('center-map'));
  };

  const handleSelectDestination = async (place: any) => {
    if (!user) {
      setIsLoginModalOpen(true);
      toast.error("Por favor, faça login para buscar uma corrida.");
      return;
    }
    triggerHaptic(ImpactStyle.Medium);
    const destLat = parseFloat(place.lat);
    const destLng = parseFloat(place.lon);
    setDestination({ lat: destLat, lng: destLng, name: place.display_name });
    setRideStatus("selecting");
    setSearchResults([]);
    setSearchQuery("");

    if (!userLocation) {
      toast.error("Localização não disponível. Tente novamente em instantes.");
      // Tenta obter a localização novamente
      try {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(loc);
        // Continua com a nova localização
        calculateRide(loc, destLat, destLng);
      } catch (err) {
        console.error("Could not get location on demand", err);
        setRideStatus("idle");
        setDestination(null);
      }
      return;
    }

    calculateRide(userLocation, destLat, destLng);
  };

  const calculateRide = async (origin: [number, number], destLat: number, destLng: number) => {
    try {
      const data = await rideService.calculateFare(
        { lat: origin[0], lng: origin[1] },
        { lat: destLat, lng: destLng }
      );

      const routeLatLngs = data.routeCoordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number],
      );
      setRoute(routeLatLngs);
      setRideEstimate({
        distance: data.distance,
        duration: data.duration,
        pricePadrao: data.pricePadrao,
        priceComfort: data.priceComfort,
        surgeMultiplier: data.surgeMultiplier,
      });
    } catch (e) {
      console.error("Routing error:", e);
      // Fallback to straight line on fetch error
      const distanceKm = 5; // Default fallback distance
      const durationMin = 10;
      setRoute([origin, [destLat, destLng]]);
      setRideEstimate({
        distance: distanceKm,
        duration: durationMin,
        pricePadrao: 15.0,
        priceComfort: 22.0,
      });
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (rideStatus === "requesting" && currentRideId) {
      timeoutId = setTimeout(async () => {
        try {
          await rideService.cancelRide(currentRideId, "Tempo expirado");
          toast.error("Nenhum motorista aceitou a corrida. Tente novamente.");
        } catch (error) {
          console.error("Error auto-cancelling ride:", error);
        }
        setCurrentRideId(null);
        setRideStatus("idle");
        setDestination(null);
        setRoute(null);
        setRideEstimate(null);
      }, 120000); // 2 minutes
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [rideStatus, currentRideId]);

  const handleRequestRide = async () => {
    triggerHaptic(ImpactStyle.Heavy);
    if (!user) {
      toast.error("Por favor, faça login para pedir uma corrida.");
      return;
    }
    if (!userLocation || !destination) return;

    setRideStatus("requesting");

    try {
      const price =
        selectedRideType === "padrao"
          ? rideEstimate?.pricePadrao
          : rideEstimate?.priceComfort;

      console.log("Solicitando corrida...", {
        userId: user.uid,
        status: "searching",
        price
      });

      const ride = await rideService.createRide({
        userId: user.uid,
        passengerName: user.displayName || "Passageiro",
        originLat: userLocation[0],
        originLng: userLocation[1],
        originName: "Local Atual",
        destLat: destination.lat,
        destLng: destination.lng,
        destName: destination.name,
        status: "searching",
        rideType: selectedRideType,
        price: price || 0,
        distance: rideEstimate?.distance || 0,
        duration: rideEstimate?.duration || 0,
        paymentMethod,
        couponCode: coupon?.code,
      });
      setCurrentRideId(ride.id);
      console.log("Corrida criada com ID:", ride.id);
      toast.success("Buscando motorista...");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "rides");
      setRideStatus("selecting");
      toast.error("Erro ao solicitar corrida.");
    }
  };

  const handleCancelRide = async (reason: string) => {
    if (currentRideId) {
      try {
        await rideService.cancelRide(currentRideId, reason);
        toast.success("Corrida cancelada.");
      } catch (error) {
        console.error("Error cancelling ride:", error);
        toast.error("Erro ao cancelar corrida.");
      }
    }
    setCurrentRideId(null);
    setRideStatus("idle");
    setDestination(null);
    setRoute(null);
    setRideEstimate(null);
    setCompletedRideData(null);
    setRating(0);
  };

  const handleDriverCancel = async (rideId: string) => {
    if (!user) return;
    try {
      await rideService.cancelRide(rideId, "Cancelado pelo motorista");
      toast.success("Corrida cancelada.");
    } catch (error) {
      console.error("Error cancelling ride:", error);
      toast.error("Erro ao cancelar corrida.");
    }
    setActiveDriverRide(null);
    setDriverRouteRideId(null);
    setDestination(null);
    setRoute(null);
  };

  // Socket.io Connection
  useEffect(() => {
    if (isAuthReady && user) {
      socketService.connect();
      
      const handleSocketConnect = () => {
        console.log("Socket connected/reconnected. Re-joining rooms...");
        if (appMode === "driver" && isOnline) {
          socketService.joinDrivers();
        }
        recoverActiveRide();
      };

      socketService.onConnect(handleSocketConnect);

      return () => {
        socketService.offConnect(handleSocketConnect);
        socketService.disconnect();
      };
    }
  }, [isAuthReady, user, appMode, isOnline, recoverActiveRide]);

  // Listen to current ride status via Socket
  useEffect(() => {
    if (!currentRideId) return;

    socketService.joinRide(currentRideId);

    socketService.onRideUpdated((data) => {
      if (data.id === currentRideId) {
        if (["accepted", "arrived", "in_progress"].includes(data.status)) {
          setRideStatus(data.status);
          if (data.driverLat && data.driverLng) {
            setDriverLocation([data.driverLat, data.driverLng]);
          }
          setCompletedRideData((prev: any) => ({
            ...prev,
            driverVehicle: data.driverVehicle,
            driverName: data.driverName,
            driverPhoto: data.driverPhoto,
            driverRating: data.driverRating,
          }));
        } else if (data.status === "searching") {
          setRideStatus("requesting");
        } else if (data.status === "completed") {
          setRideStatus("completed");
          setCompletedRideData(data);
        } else if (data.status === "cancelled") {
          toast.error("A corrida foi cancelada.");
          setCurrentRideId(null);
          setRideStatus("idle");
          setDestination(null);
          setRoute(null);
          setRideEstimate(null);
          setDriverLocation(null);
          setCompletedRideData(null);
          setRating(0);
        }
      }
    });

    socketService.onDriverLocationUpdated((data) => {
      if (data.lat && data.lng) {
        setDriverLocation([data.lat, data.lng]);
      }
    });

    return () => {
      socketService.off("ride-updated");
      socketService.off("driver-location-updated");
    };
  }, [currentRideId]);

  // Driver: Listen for searching rides via Socket
  useEffect(() => {
    if (appMode !== "driver" || !user || !isOnline) {
      setAvailableRides([]);
      return;
    }

    const fetchInitialRides = async () => {
      try {
        const rides = await rideService.getAvailableRides();
        setAvailableRides(rides);
      } catch (error) {
        console.error("Error fetching available rides", error);
      }
    };
    fetchInitialRides();

    socketService.onNewRideAvailable((rideData) => {
      setAvailableRides((prev) => [rideData, ...prev]);
      
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.schedule({
          notifications: [{
            title: "Nova Corrida Disponível!",
            body: `Destino: ${rideData.destName}`,
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 1000) },
          }]
        }).catch(e => console.error("Error scheduling local notification", e));
      }
    });

    socketService.onRideUpdated((data) => {
      if (data.status !== "searching") {
        setAvailableRides((prev) => prev.filter(r => r.id !== data.id));
      }
    });

    return () => {
      socketService.off("new-ride-available");
      socketService.off("ride-updated");
    };
  }, [appMode, user, isOnline]);

  // Driver: Listen for active ride via Socket
  useEffect(() => {
    if (appMode !== "driver" || !user) return;

    socketService.onRideUpdated((data) => {
      if (data.driverId === user.uid && ["accepted", "arrived", "in_progress"].includes(data.status)) {
        setActiveDriverRide((prev: any) => ({ ...prev, ...data }));
      } else if (data.driverId === user.uid && ["completed", "cancelled"].includes(data.status)) {
        setActiveDriverRide(null);
        if (data.status === "completed") {
          setDailyEarnings((prev) => prev + ((data.price || 0) * 0.8));
        }
      }
    });

    return () => {
      socketService.off("ride-updated");
    };
  }, [appMode, user]);

  // Rider: Listen for nearby drivers via Socket
  useEffect(() => {
    if (appMode !== "rider" || !isAuthReady) return;

    socketService.onDriverMoved((data) => {
      setNearbyDrivers((prev) => {
        if (data.isOnline === false) {
          return prev.filter(d => d.id !== data.uid);
        }

        const index = prev.findIndex(d => d.id === data.uid);
        const newDriver = { id: data.uid, ...data, lastUpdate: new Date() };
        
        if (index > -1) {
          const newDrivers = [...prev];
          newDrivers[index] = newDriver;
          return newDrivers;
        } else {
          return [...prev, newDriver];
        }
      });
    });

    return () => {
      socketService.off("driver-moved");
    };
  }, [appMode, isAuthReady]);

  // Chat Messages via Socket
  useEffect(() => {
    const rideId = currentRideId || activeDriverRide?.id;
    if (!rideId) return;

    socketService.onNewMessage((message) => {
      setChatMessages((prev) => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message].sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
      });
    });

    return () => {
      socketService.off("new-message");
    };
  }, [currentRideId, activeDriverRide]);

  // Driver: Update location in Firestore and via Socket
  useEffect(() => {
    if (appMode !== "driver" || !user || !userLocation) return;

    const updateDriverLocation = async () => {
      try {
        // 1. Update Firestore (for persistence and offline discovery)
        await userService.updateLocation(userLocation.lat, userLocation.lng, activeDriverRide?.id);

        // 2. Broadcast via Socket (for real-time updates to riders)
        socketService.updateLocation({ uid: user.uid, lat: userLocation.lat, lng: userLocation.lng, rideId: activeDriverRide?.id });
      } catch (error) {
        console.error("Error updating location:", error);
      }
    };

    updateDriverLocation();
  }, [appMode, user, userLocation]);

  // Driver: Fetch route to passenger when ride is accepted or to destination when in progress
  useEffect(() => {
    if (appMode === "driver") {
      if (
        activeDriverRide &&
        userLocation &&
        (driverRouteRideId !== activeDriverRide.id || driverRouteStatus !== activeDriverRide.status)
      ) {
        setDriverRouteRideId(activeDriverRide.id);
        setDriverRouteStatus(activeDriverRide.status);
        
        const isPickup = activeDriverRide.status === "accepted" || activeDriverRide.status === "arrived";
        const targetLat = isPickup ? activeDriverRide.originLat : activeDriverRide.destLat;
        const targetLng = isPickup ? activeDriverRide.originLng : activeDriverRide.destLng;
        const targetName = isPickup ? "Embarque do Passageiro" : activeDriverRide.destName;

        setDestination({
          lat: targetLat,
          lng: targetLng,
          name: targetName,
        });

        const fetchRoute = async () => {
          try {
            const res = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true&language=pt-BR`,
            );
            if (!res.ok) throw new Error("Route fetch failed");
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const coordinates = data.routes[0].geometry.coordinates;
              const routeLatLngs = coordinates.map(
                (coord: [number, number]) =>
                  [coord[1], coord[0]] as [number, number],
              );
              setRoute(routeLatLngs);
              // Armazenar as instruções (steps) e informações da rota
              const routeData = data.routes[0];
              const steps = routeData.legs[0].steps;
              setRouteSteps(steps);
              setRouteInfo({
                distance: routeData.distance,
                duration: routeData.duration
              });
            } else {
              setRoute([
                userLocation,
                [targetLat, targetLng],
              ]);
              setRouteSteps([]);
            }
          } catch (e) {
            console.error("Routing error:", e);
            setRoute([
              userLocation,
              [targetLat, targetLng],
            ]);
            setRouteSteps([]);
          }
        };
        fetchRoute();
      } else if (!activeDriverRide) {
        setDriverRouteRideId(null);
        setDriverRouteStatus(null);
        setDestination(null);
        setRoute(null);
      }
    }
  }, [appMode, activeDriverRide, userLocation, driverRouteRideId, driverRouteStatus]);

  const handleAcceptRide = async (rideId: string) => {
    if (!user) return;
    try {
      await rideService.acceptRide(rideId);
      toast.success("Corrida aceita!");
    } catch (error) {
      console.error("Error accepting ride:", error);
      toast.error("Erro ao aceitar corrida.");
    }
  };

  const handleCompleteRide = async (rideId: string) => {
    if (!user) return;
    try {
      await rideService.updateRideStatus(rideId, "completed");
      toast.success("Viagem concluída!");
    } catch (error) {
      console.error("Error completing ride:", error);
      toast.error("Erro ao concluir viagem.");
    }
  };

  const handleUpdateRideStatus = async (rideId: string, newStatus: string) => {
    if (!user) return;
    try {
      await rideService.updateRideStatus(rideId, newStatus);
      if (newStatus === "arrived") {
        toast.success("Você chegou ao local de embarque!");
      } else if (newStatus === "in_progress") {
        toast.success("Corrida iniciada!");
      }
    } catch (error) {
      console.error("Error updating ride status:", error);
      toast.error("Erro ao atualizar status da corrida.");
    }
  };

  const handleSubmitRating = async () => {
    if (currentRideId && rating > 0) {
      try {
        await rideService.rateRide(currentRideId, rating, tip);
        toast.success("Avaliação enviada!");
      } catch (error) {
        console.error("Error saving rating", error);
        toast.error("Erro ao enviar avaliação.");
      }
    }
    setCurrentRideId(null);
    setRideStatus("idle");
    setDestination(null);
    setRoute(null);
    setRideEstimate(null);
    setDriverLocation(null);
    setCompletedRideData(null);
    setRating(0);
    setTip(0);
  };

  const handleSavePlace = async (
    result: any,
    icon: "home" | "work" | "star",
    name: string,
  ) => {
    if (!user) return;
    try {
      await rideService.savePlace({
        name,
        address: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        icon,
      });
      setPlaceToSave(null);
      setSearchQuery("");
      setSearchResults([]);
      setRideStatus("idle");
      toast.success("Local salvo com sucesso!");
    } catch (error) {
      console.error("Error saving place:", error);
      toast.error("Erro ao salvar local.");
    }
  };

  const handleSelectSavedPlace = (place: SavedPlace) => {
    triggerHaptic();
    setDestination({
      lat: place.lat,
      lng: place.lng,
      name: place.name,
    });
    setSearchQuery(place.name);
    setSearchResults([]);
    setRideStatus("selecting");
    setIsSavedPlacesOpen(false);
  };

  const handleAddSavedPlace = async (place: any) => {
    if (!user) return;
    try {
      const newPlace = {
        ...place,
        id: Math.random().toString(36).substr(2, 9),
        icon: 'star'
      };
      const updatedPlaces = [...savedPlaces, newPlace];
      setSavedPlaces(updatedPlaces);
      await updateDoc(doc(db, "users", user.uid), {
        savedPlaces: updatedPlaces
      });
      toast.success("Local salvo com sucesso!");
    } catch (error) {
      console.error("Error saving place:", error);
      toast.error("Erro ao salvar local.");
    }
  };

  const handleRemoveSavedPlace = async (id: string) => {
    if (!user) return;
    try {
      const updatedPlaces = savedPlaces.filter(p => p.id !== id);
      setSavedPlaces(updatedPlaces);
      await updateDoc(doc(db, "users", user.uid), {
        savedPlaces: updatedPlaces
      });
      toast.success("Local removido.");
    } catch (error) {
      console.error("Error removing place:", error);
    }
  };

  const addNotification = (title: string, body: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    triggerHaptic(ImpactStyle.Light);
    toast(title, {
      description: body,
      duration: 5000,
    });

    if (Notification.permission === "granted" && !Capacitor.isNativePlatform()) {
      new Notification(title, { body });
    }
  };

  // Notificações
  useEffect(() => {
    if (!("Notification" in window)) {
      console.warn("Este navegador não suporta notificações.");
      return;
    }
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (rideStatus === "accepted") {
      addNotification("Uppi", "Motorista aceitou sua corrida!", "success");
    } else if (rideStatus === "arrived") {
      addNotification("Uppi", "O motorista chegou!", "info");
    } else if (rideStatus === "completed") {
      addNotification("Uppi", "Viagem concluída com sucesso!", "success");
    }
  }, [rideStatus]);

  useEffect(() => {
    const rideId = currentRideId || activeDriverRide?.id;
    if (!rideId) return;

    const fetchInitialMessages = async () => {
      try {
        const rideDocSnap = await getDoc(doc(db, "rides", rideId));
        if (rideDocSnap.exists()) {
          const messagesSnapshot = await getDocs(
            query(collection(db, `rides/${rideId}/messages`), orderBy("timestamp", "asc"))
          );
          const msgs = messagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setChatMessages(msgs);
        }
      } catch (error) {
        console.error("Error fetching initial messages", error);
      }
    };
    fetchInitialMessages();
  }, [currentRideId, activeDriverRide?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const rideId = appMode === "rider" ? currentRideId : activeDriverRide?.id;
    if (!rideId) return;

    try {
      await rideService.sendMessage(rideId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem.");
    }
  };

  // Auth Listener & User Profile Sync removed (refactored to top)

  const handleSaveVehicle = async (e: React.FormEvent, cnhFile: File | null, crlvFile: File | null, selfieFile: File | null) => {
    e.preventDefault();
    if (!user) return;
    try {
      let cnhUrl = vehicleData.cnhUrl;
      let crlvUrl = vehicleData.crlvUrl;
      let selfieUrl = vehicleData.selfieUrl;

      // Import storage functions dynamically or assume they are available
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('./firebase');

      if (cnhFile) {
        const cnhRef = ref(storage, `documents/${user.uid}/cnh_${Date.now()}`);
        await uploadBytes(cnhRef, cnhFile);
        cnhUrl = await getDownloadURL(cnhRef);
        await userService.uploadDocument('cnh', cnhUrl);
      }

      if (crlvFile) {
        const crlvRef = ref(storage, `documents/${user.uid}/crlv_${Date.now()}`);
        await uploadBytes(crlvRef, crlvFile);
        crlvUrl = await getDownloadURL(crlvRef);
        await userService.uploadDocument('crlv', crlvUrl);
      }

      if (selfieFile) {
        const selfieRef = ref(storage, `documents/${user.uid}/selfie_${Date.now()}`);
        await uploadBytes(selfieRef, selfieFile);
        selfieUrl = await getDownloadURL(selfieRef);
        await userService.uploadDocument('selfie', selfieUrl);
      }

      const updatedVehicleData = {
        ...vehicleData,
        cnhUrl: cnhUrl || "",
        crlvUrl: crlvUrl || "",
        selfieUrl: selfieUrl || "",
      };

      await userService.updateVehicle(updatedVehicleData);
      
      setVehicleData(updatedVehicleData);
      setDriverStatus("pending");
      setIsVehicleProfileOpen(false);
      toast.success("Cadastro enviado para análise!");
    } catch (error) {
      console.error("Error saving vehicle profile", error);
      toast.error("Erro ao enviar documentos.");
    }
  };

  // Fetch Ride History
  useEffect(() => {
    if (!isHistoryOpen || !user) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const history = await rideService.getRideHistory(appMode);
        setRideHistory(history);
      } catch (error) {
        console.error("Error fetching history", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [isHistoryOpen, user, appMode]);

  // Fetch Saved Places
  useEffect(() => {
    if (!isAuthReady || !user) {
      setSavedPlaces([]);
      return;
    }

    const fetchPlaces = async () => {
      setIsLoadingPlaces(true);
      try {
        const places = await userService.getSavedPlaces();
        setSavedPlaces(places);
      } catch (error) {
        console.error("Error fetching saved places", error);
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    fetchPlaces();
  }, [isAuthReady, user]);

  // Geolocation
  useEffect(() => {
    let watchId: string | null = null;
    let bgWatcherId: string | null = null;

    const startTracking = async () => {
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== "granted") {
          setShowLocationDisclosure(true);
          return;
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
        });
        setUserLocation([position.coords.latitude, position.coords.longitude]);

        if (Capacitor.isNativePlatform() && appMode === "driver" && isOnline) {
          // Use Background Geolocation for Drivers when online
          bgWatcherId = await BackgroundGeolocation.addWatcher(
            {
              backgroundMessage: "Toque para abrir o aplicativo.",
              backgroundTitle: "Uppi: Rastreamento ativo",
              requestPermissions: true,
              stale: false,
              distanceFilter: 10
            },
            async function callback(location, error) {
              if (error) {
                if (error.code === "NOT_AUTHORIZED") {
                  if (window.confirm(
                    "This app needs your location, " +
                    "but does not have permission.\n\n" +
                    "Open settings now?"
                  )) {
                    BackgroundGeolocation.openSettings();
                  }
                }
                return console.error(error);
              }
              if (location) {
                setUserLocation([location.latitude, location.longitude]);
                // Update Backend via REST API directly from background callback
                // This bypasses the WebSocket suspension issue in iOS/Android background
                if (user && isOnline) {
                  try {
                    const currentRide = activeDriverRideRef.current;
                    const activeRideId = currentRide && ['accepted', 'arrived', 'in_progress'].includes(currentRide.status) 
                      ? currentRide.id 
                      : null;

                    // Call our backend API which updates Firestore AND broadcasts via Socket.io
                    userService.updateLocation(
                      location.latitude,
                      location.longitude,
                      activeRideId
                    ).catch(err => console.error("REST API Driver Update Error:", err));
                    
                  } catch (err) {
                    console.error("Error in background REST update:", err);
                  }
                }
              }
            }
          );
        } else {
          // Standard foreground watch for riders or offline drivers
          watchId = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 5000 },
            async (position, err) => {
              if (position) {
                const newLat = position.coords.latitude;
                const newLng = position.coords.longitude;
                setUserLocation([newLat, newLng]);
              }
              if (err) {
                console.error("Error watching location", err);
              }
            },
          );
        }
      } catch (error) {
        console.error("Error setting up geolocation", error);
      }
    };

    startTracking();

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
      if (bgWatcherId) {
        BackgroundGeolocation.removeWatcher({ id: bgWatcherId });
      }
    };
  }, [appMode, isOnline, centerTrigger, user]);

  const handleAcceptLocationDisclosure = async () => {
    setShowLocationDisclosure(false);
    try {
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location === "granted") {
        // Re-trigger the tracking logic
        setCenterTrigger(prev => prev + 1);
      } else {
        toast.error("Permissão de localização negada. O app não funcionará corretamente.");
      }
    } catch (e) {
      console.error("Error requesting location permission", e);
    }
  };

  useEffect(() => {
    console.log("App: isOnline state changed to:", isOnline);
  }, [isOnline]);

  useEffect(() => {
    console.log("App: appMode state changed to:", appMode);
  }, [appMode]);

  const handleShareRide = (rideId: string) => {
    const shareUrl = `${window.location.origin}?sharedRideId=${rideId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link de compartilhamento copiado!");
  };

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success("Você saiu da conta.");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Erro ao sair da conta.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      // Excluir dados do usuário no Firestore via API
      await userService.deleteAccount();
      // Excluir usuário do Auth
      await user.delete();
      setIsDeleteConfirmOpen(false);
      toast.success("Conta excluída com sucesso.");
    } catch (error: any) {
      console.error("Delete account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Por segurança, faça login novamente antes de excluir sua conta.");
        await logOut();
      } else {
        toast.error("Erro ao excluir conta. Tente novamente mais tarde.");
      }
    }
  };

  const toggleOnlineStatus = async () => {
    if (!user) return;
    
    // Check if we need to show the education modal before going online
    if (!isOnline) {
      const hasSeenEducation = localStorage.getItem('hasSeenBackgroundEducation');
      if (!hasSeenEducation) {
        setShowBackgroundEducationModal(true);
        return;
      }
    }

    try {
      const newStatus = !isOnline;
      console.log("ToggleOnlineStatus: Alterando para", newStatus);
      setIsOnline(newStatus);
      
      await userService.toggleOnlineStatus(newStatus);
      
      if (!newStatus) {
        setAvailableRides([]); // Clear rides when going offline
      }
      console.log("ToggleOnlineStatus: Sucesso");
    } catch (error) {
      console.error("Error toggling online status", error);
      setIsOnline(!isOnline); // Revert on error
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleAcceptBackgroundEducation = () => {
    localStorage.setItem('hasSeenBackgroundEducation', 'true');
    setShowBackgroundEducationModal(false);
    toggleOnlineStatus(); // Now it will bypass the modal check
  };

  const handleCenterLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });
      setUserLocation([position.coords.latitude, position.coords.longitude]);
      setCenterTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error getting location", error);
    }
  };

  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Fetch Heatmap Data
  useEffect(() => {
    if (appMode !== 'driver' || !showHeatmap) return;
    
    const fetchHeatmap = async () => {
      try {
        const response = await fetch('/api/v1/drivers/heatmap', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHeatmapData(data);
        }
      } catch (error) {
        console.error("Error fetching heatmap:", error);
      }
    };
    
    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 5 * 60 * 1000); // Update every 5 mins
    return () => clearInterval(interval);
  }, [appMode, showHeatmap]);

  return (
    <ErrorBoundary>
      <Toaster position="top-center" />
      <div className="relative h-screen w-full overflow-hidden bg-gray-100 font-sans">
        {/* Map Layer */}
        <MemoizedMap
          userLocation={userLocation}
          destination={destination}
          route={route}
          routeSteps={routeSteps}
          routeInfo={routeInfo}
          driverLocation={driverLocation}
          centerTrigger={centerTrigger}
          appMode={appMode}
          activeDriverRide={activeDriverRide}
          nearbyDrivers={nearbyDrivers}
          isSharedView={isSharedView}
          heatmapData={showHeatmap ? heatmapData : []}
        />

        {/* Top UI Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-4 pointer-events-none">
          {/* Menu Button */}
          <button
            aria-label="Menu"
            onClick={() => {
              triggerHaptic();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="bg-white p-3 rounded-full shadow-md pointer-events-auto hover:bg-gray-50 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-800" />
          </button>

          {/* Safety/Promo Button */}
          <button 
            onClick={() => {
              triggerHaptic(ImpactStyle.Heavy);
              // Future: Open safety center
            }}
            className="bg-white p-3 rounded-full shadow-md pointer-events-auto hover:bg-gray-50 transition-colors"
          >
            <ShieldAlert className="w-6 h-6 text-blue-600" />
          </button>
        </div>

        {/* Side Menu */}
        <SideMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={user}
          appMode={appMode}
          onToggleAppMode={async () => {
            const newMode = appMode === "rider" ? "driver" : "rider";
            setAppMode(newMode);
            setDestination(null);
            setRoute(null);
            setRouteSteps([]);
            setRideEstimate(null);
            setIsMenuOpen(false);
          }}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenHistory={() => {
            setIsHistoryOpen(true);
            setIsMenuOpen(false);
          }}
          onOpenWallet={() => {
            setIsWalletOpen(true);
            setIsMenuOpen(false);
          }}
          onOpenVehicleProfile={() => {
            setIsVehicleProfileOpen(true);
            setIsMenuOpen(false);
          }}
          onLogout={handleLogout}
          onDeleteAccount={() => setIsDeleteConfirmOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenSupport={() => setIsSupportOpen(true)}
          onOpenSafetyCenter={() => setIsSafetyCenterOpen(true)}
          isAdmin={isAdmin}
          onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenVerification={() => setIsVerificationOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNotifications={() => setIsNotificationCenterOpen(true)}
          onOpenSavedPlaces={() => setIsSavedPlacesOpen(true)}
          onOpenReferral={() => setIsReferralOpen(true)}
          onOpenPromo={() => setIsPromoOpen(true)}
          onOpenEarnings={() => setIsEarningsOpen(true)}
          driverStatus={driverStatus}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={setNotificationsEnabled}
        />

        {/* Bottom Navigation */}
        {appMode === 'rider' && rideStatus === 'idle' && (
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Driver Verification Modal */}
        <AnimatePresence>
          {isVerificationOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[2000]"
            >
              <DriverVerification 
                user={user} 
                onClose={() => setIsVerificationOpen(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom UI Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none flex flex-col items-end p-4 gap-4">
          {/* Center Location Button */}
          {rideStatus === "idle" && (
            <button
              onClick={() => {
                triggerHaptic();
                handleCenterLocation();
              }}
              className="bg-white p-3 rounded-full shadow-md pointer-events-auto hover:bg-gray-50 transition-colors"
            >
              <Navigation className="w-6 h-6 text-blue-600" />
            </button>
          )}

          {/* Bottom Sheet */}
          <motion.div
            layout
            className="bg-white w-full rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pointer-events-auto overflow-hidden flex flex-col max-h-[80vh]"
            style={{ paddingBottom: 'var(--safe-bottom)' }}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4 shrink-0" />

            <div className="px-6 pb-6 overflow-y-auto">
              {appMode === "driver" ? (
                <DriverUI
                  isOnline={isOnline}
                  toggleOnlineStatus={toggleOnlineStatus}
                  showHeatmap={showHeatmap}
                  setShowHeatmap={setShowHeatmap}
                  activeDriverRide={activeDriverRide}
                  setIsChatOpen={handleOpenChat}
                  chatMessages={chatMessages}
                  user={user}
                  handleUpdateRideStatus={handleUpdateRideStatus}
                  handleCompleteRide={handleCompleteRide}
                  handleDriverCancel={handleDriverCancel}
                  dailyEarnings={dailyEarnings}
                  availableRides={availableRides}
                  handleAcceptRide={handleAcceptRide}
                  handleShareRide={handleShareRide}
                  onOpenWallet={() => setIsWalletOpen(true)}
                  driverStatus={driverStatus}
                  rejectionReason={rejectionReason}
                  driverData={driverData}
                  onOpenVerification={() => setIsVerificationOpen(true)}
                />
              ) : (
                <>
                  <SearchUI
                    rideStatus={rideStatus}
                    setRideStatus={setRideStatus}
                    getGreeting={getGreeting}
                    user={user}
                    isLoadingPlaces={isLoadingPlaces}
                    isSearching={isSearching}
                    savedPlaces={savedPlaces}
                    handleSelectSavedPlace={handleSelectSavedPlace}
                    setIsLoginModalOpen={setIsLoginModalOpen}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    searchResults={searchResults}
                    handleSelectDestination={handleSelectDestination}
                    placeToSave={placeToSave}
                    setPlaceToSave={setPlaceToSave}
                    handleSavePlace={handleSavePlace}
                  />
                  <MemoizedRideFlow
                    rideStatus={rideStatus}
                    currentRideId={currentRideId}
                    destination={destination}
                    setDestination={setDestination}
                    setRideStatus={setRideStatus}
                    setRoute={setRoute}
                    setRideEstimate={setRideEstimate}
                    rideEstimate={rideEstimate}
                    selectedRideType={selectedRideType}
                    setSelectedRideType={setSelectedRideType}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    handleRequestRide={handleRequestRide}
                    onOpenCancelRide={() => {
                      setRideToCancelId(currentRideId);
                      setIsCancelRideOpen(true);
                    }}
                    completedRideData={completedRideData}
                    setIsChatOpen={handleOpenChat}
                    chatMessages={chatMessages}
                    user={user}
                    rating={rating}
                    setRating={setRating}
                    tip={tip}
                    setTip={setTip}
                    handleSubmitRating={handleSubmitRating}
                    coupon={coupon}
                    setCoupon={setCoupon}
                  />
                </>
              )}
            </div>
          </motion.div>
        </div>
        {/* Chat Modal */}
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={handleSendMessage}
          userId={user?.uid}
          otherUserName={otherUserName}
        />

        {/* Ride History Modal */}
        <RideHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          isLoading={isLoadingHistory}
          rides={rideHistory}
          onRateRide={(rideId, driverName, driverPhoto) => {
            setRideToRateId(rideId);
            setDriverNameToRate(driverName);
            setDriverPhotoToRate(driverPhoto);
            setIsRateRideOpen(true);
            setIsHistoryOpen(false);
          }}
        />
        <RateRideModal
          isOpen={isRateRideOpen}
          onClose={() => setIsRateRideOpen(false)}
          rideId={rideToRateId || ''}
          driverName={driverNameToRate}
          driverPhoto={driverPhotoToRate}
          onRated={() => {
            // Refresh history
            setIsHistoryOpen(true);
          }}
        />
        <CancelRideModal
          isOpen={isCancelRideOpen}
          onClose={() => setIsCancelRideOpen(false)}
          onConfirm={(reason) => {
            handleCancelRide(reason);
          }}
        />

        <PrivacyPolicyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />

        <DeleteAccountModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteAccount}
        />

        {/* Wallet Modal */}
        <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          role={appMode}
        />

        <SupportModal
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
        />

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
        />

        {/* Admin Panel Modal */}
        <AnimatePresence>
          {isAdminPanelOpen && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Painel Admin</h2>
                  <button
                    onClick={() => setIsAdminPanelOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ShieldAlert className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <AdminPanel 
                    showHeatmap={showHeatmap} 
                    setShowHeatmap={setShowHeatmap} 
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Vehicle Profile Modal */}
        <VehicleProfileModal
          isOpen={isVehicleProfileOpen}
          onClose={() => setIsVehicleProfileOpen(false)}
          vehicleData={vehicleData}
          setVehicleData={setVehicleData}
          onSave={handleSaveVehicle}
        />

        {/* Login Modal */}
        <AuthModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />

        {/* Location Disclosure Modal */}
        <AnimatePresence>
          {showLocationDisclosure && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Navigation className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Uso de Localização</h2>
                <p className="text-gray-600 text-center mb-6 leading-relaxed">
                  Este aplicativo coleta dados de localização para permitir o rastreamento de corridas e encontrar motoristas próximos, mesmo quando o aplicativo está fechado ou não está em uso.
                </p>
                <button
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    handleAcceptLocationDisclosure();
                  }}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
                >
                  Eu entendo e concordo
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Background Education Modal */}
        <AnimatePresence>
          {showBackgroundEducationModal && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Navigation className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Atenção Motorista!</h2>
                <div className="text-gray-600 text-sm mb-6 space-y-4">
                  <p>
                    Para que você possa receber corridas e ter sua localização atualizada mesmo com o aplicativo minimizado (usando o Waze, por exemplo), você precisa ajustar duas configurações no seu celular:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 font-medium text-gray-800">
                    <li>Permissão de Localização: Mude para <strong>"Permitir o tempo todo"</strong>.</li>
                    <li>Economia de Bateria: Mude para <strong>"Sem restrições"</strong>.</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-4">
                    Se você não fizer isso, o sistema do seu celular vai "congelar" o aplicativo e você não receberá corridas.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      // Se o plugin estiver disponível, abre as configurações
                      if ((window as any).BackgroundGeolocation) {
                        (window as any).BackgroundGeolocation.openSettings();
                      } else {
                        toast.info("Por favor, abra as configurações do seu celular manualmente.");
                      }
                    }}
                    className="w-full bg-gray-100 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Abrir Configurações
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(ImpactStyle.Medium);
                      handleAcceptBackgroundEducation();
                    }}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    Entendi, Ficar Online
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <SafetyCenterModal
          isOpen={isSafetyCenterOpen}
          onClose={() => setIsSafetyCenterOpen(false)}
          onShareRide={() => {
            setIsSafetyCenterOpen(false);
            // Assuming handleShareRide is available or can be triggered
            // For simplicity, let's trigger a custom event or call a function if possible
            // Since handleShareRide is inside RideFlow, maybe just trigger the share action if rideId is available
            if (currentRideId) {
                // We need to access handleShareRide, but it's in RideFlow.
                // Let's just use the same logic here or expose it.
                const shareUrl = `${window.location.origin}/share-ride/${currentRideId}`;
                if (navigator.share) {
                  navigator.share({ title: 'Acompanhe minha viagem', url: shareUrl });
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Link de compartilhamento copiado!");
                }
            }
          }}
        />

        <NotificationCenterModal
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
          notifications={notifications}
          onClearAll={handleClearAllNotifications}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        />

        <SavedPlacesModal
          isOpen={isSavedPlacesOpen}
          onClose={() => setIsSavedPlacesOpen(false)}
          places={savedPlaces}
          onAddPlace={handleAddSavedPlace}
          onRemovePlace={handleRemoveSavedPlace}
          onSelectPlace={handleSelectSavedPlace}
          isLoading={isLoadingPlaces}
        />

        <ReferralModal
          isOpen={isReferralOpen}
          onClose={() => setIsReferralOpen(false)}
          referralCode={referralCode}
          onApplyReferral={handleApplyReferral}
          hasAppliedReferral={!!referralStats?.appliedCode}
        />

        <PromoModal
          isOpen={isPromoOpen}
          onClose={() => setIsPromoOpen(false)}
          onApplyCoupon={async (code) => {
            await rideService.applyCoupon(code);
            setCoupon(code);
          }}
        />

        <TermsModal isOpen={showTerms} onAccept={async () => {
          try {
            await userService.acceptTerms();
            setShowTerms(false);
            toast.success("Termos aceitos com sucesso!");
          } catch (error) {
            toast.error("Erro ao aceitar termos.");
          }
        }} />

        <DriverEarningsModal
          isOpen={isEarningsOpen}
          onClose={() => setIsEarningsOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
}
