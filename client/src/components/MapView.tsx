import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Provider } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Navigation,
  Locate 
} from 'lucide-react';

// Fix Leaflet default icon issue with Vite
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for providers
const providerIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// User location marker
const userIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapViewProps {
  providers: Provider[];
  onProviderSelect?: (provider: Provider) => void;
  onLocationSearch?: (location: { lat: number; lng: number; radius: number }) => void;
  userLocation?: { lat: number; lng: number } | null;
}

// Component to handle map centering
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

export default function MapView({ 
  providers, 
  onProviderSelect, 
  onLocationSearch,
  userLocation 
}: MapViewProps) {
  const [searchRadius, setSearchRadius] = useState([5]); // Default 5 mile radius
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7589, -73.9851]); // NYC default
  const [isLocating, setIsLocating] = useState(false);

  // Get user's current location
  const handleGetLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter([lat, lng]);
          if (onLocationSearch) {
            onLocationSearch({ lat, lng, radius: searchRadius[0] });
          }
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          console.log('Location access denied');
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Handle radius change
  const handleRadiusChange = (value: number[]) => {
    setSearchRadius(value);
    if (userLocation && onLocationSearch) {
      onLocationSearch({ 
        lat: userLocation.lat, 
        lng: userLocation.lng, 
        radius: value[0] 
      });
    }
  };

  // Get provider type icon color
  const getProviderTypeColor = (type: string) => {
    switch (type) {
      case 'daycare': return 'text-blue-600';
      case 'afterschool': return 'text-green-600';
      case 'camp': return 'text-yellow-600';
      case 'school': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  // Format provider coordinates
  const getProviderCoordinates = (provider: Provider): [number, number] | null => {
    // Note: Provider schema doesn't have latitude/longitude fields yet
    // For now, generate coordinates based on borough + small offset for demonstration
    
    // Fallback: generate approximate coordinates based on borough
    const boroughCoords: Record<string, [number, number]> = {
      'Manhattan': [40.7831, -73.9712],
      'Brooklyn': [40.6782, -73.9442],
      'Queens': [40.7282, -73.7949],
      'Bronx': [40.8448, -73.8648],
      'Staten Island': [40.5795, -74.1502],
      'NYC': [40.7589, -73.9851]
    };
    
    const coords = boroughCoords[provider.borough || 'NYC'];
    if (coords) {
      // Add small random offset for providers in same borough
      return [
        coords[0] + (Math.random() - 0.5) * 0.02,
        coords[1] + (Math.random() - 0.5) * 0.02
      ];
    }
    
    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Map Controls */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex items-center gap-2"
                data-testid="button-get-location"
              >
                {isLocating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Locate className="h-4 w-4" />
                )}
                {isLocating ? 'Locating...' : 'Use My Location'}
              </Button>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium whitespace-nowrap">
                  Search Radius: {searchRadius[0]} miles
                </label>
                <div className="flex-1 max-w-xs">
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={searchRadius[0]}
                    onChange={(e) => handleRadiusChange([parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    data-testid="slider-radius"
                  />
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {providers.length} providers
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="flex-1 min-h-[500px] rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full"
          data-testid="map-container"
        >
          <MapCenter center={mapCenter} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={[userLocation.lat, userLocation.lng]} 
              icon={userIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Your Location</p>
                  <p className="text-sm text-gray-600">
                    Search radius: {searchRadius[0]} miles
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Provider markers */}
          {providers.map((provider) => {
            const coords = getProviderCoordinates(provider);
            if (!coords) return null;
            
            return (
              <Marker
                key={provider.id}
                position={coords}
                icon={providerIcon}
              >
                <Popup maxWidth={300}>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-brand-evergreen">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {provider.address}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className={getProviderTypeColor(provider.type)}>
                        {provider.type}
                      </Badge>
                      <Badge variant="outline">
                        Ages {Math.floor(provider.ageRangeMin / 12)}+
                      </Badge>
                    </div>
                    
                    {provider.rating && (
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(Number(provider.rating))
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {provider.rating} ({provider.reviewCount || 0} reviews)
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-1 text-sm">
                      {provider.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-3 w-3 mr-2" />
                          {provider.phone}
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-3 w-3 mr-2" />
                          {provider.email}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => onProviderSelect?.(provider)}
                      data-testid={`button-view-details-${provider.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}