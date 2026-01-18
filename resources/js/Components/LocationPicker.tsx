import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Location {
    lat: string | number;
    lng: string | number;
    building?: string;
    room?: string;
}

interface LocationPickerProps {
    value: Location;
    onChange: (location: Location) => void;
    radius?: number;
    showRadius?: boolean;
    height?: string;
}

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to recenter map when coordinates change externally
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    
    return null;
}

export default function LocationPicker({ 
    value, 
    onChange, 
    radius = 100, 
    showRadius = true,
    height = '300px' 
}: LocationPickerProps) {
    // Default to Poltava city center if no coordinates
    const defaultLat = 49.5883;
    const defaultLng = 34.5514;
    
    const lat = parseFloat(String(value.lat)) || defaultLat;
    const lng = parseFloat(String(value.lng)) || defaultLng;
    
    const hasValidCoords = !isNaN(parseFloat(String(value.lat))) && !isNaN(parseFloat(String(value.lng)));
    
    const [isLocating, setIsLocating] = useState(false);

    const handleMapClick = (clickLat: number, clickLng: number) => {
        onChange({
            ...value,
            lat: clickLat.toFixed(6),
            lng: clickLng.toFixed(6),
        });
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Геолокація не підтримується вашим браузером');
            return;
        }
        
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                onChange({
                    ...value,
                    lat: position.coords.latitude.toFixed(6),
                    lng: position.coords.longitude.toFixed(6),
                });
                setIsLocating(false);
            },
            (error) => {
                alert('Не вдалося отримати геолокацію: ' + error.message);
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="space-y-3">
            {/* Building & Room inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Корпус
                    </label>
                    <input
                        type="text"
                        value={value.building || ''}
                        onChange={e => onChange({ ...value, building: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Наприклад: 1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Аудиторія
                    </label>
                    <input
                        type="text"
                        value={value.room || ''}
                        onChange={e => onChange({ ...value, room: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Наприклад: 101"
                    />
                </div>
            </div>

            {/* Map */}
            <div className="relative">
                <div className="absolute top-2 right-2 z-[1000] flex gap-2">
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isLocating}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                    >
                        {isLocating ? (
                            <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Пошук...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Моя локація</span>
                            </>
                        )}
                    </button>
                </div>
                
                <div className="rounded-lg overflow-hidden border border-gray-300" style={{ height }}>
                    <MapContainer
                        center={[lat, lng]}
                        zoom={hasValidCoords ? 17 : 13}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        <MapClickHandler onClick={handleMapClick} />
                        <MapRecenter lat={lat} lng={lng} />
                        
                        {hasValidCoords && (
                            <>
                                <Marker position={[lat, lng]} />
                                {showRadius && radius > 0 && (
                                    <Circle
                                        center={[lat, lng]}
                                        radius={radius}
                                        pathOptions={{
                                            color: '#3B82F6',
                                            fillColor: '#3B82F6',
                                            fillOpacity: 0.15,
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </MapContainer>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                    Натисніть на карту, щоб вибрати місце проведення
                </p>
            </div>

            {/* Coordinates display */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Широта (lat)
                    </label>
                    <input
                        type="text"
                        value={value.lat || ''}
                        onChange={e => onChange({ ...value, lat: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        placeholder="49.5883"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Довгота (lng)
                    </label>
                    <input
                        type="text"
                        value={value.lng || ''}
                        onChange={e => onChange({ ...value, lng: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        placeholder="34.5514"
                    />
                </div>
            </div>
        </div>
    );
}



