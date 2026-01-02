<?php

namespace App\Services;

class GeolocationService
{
    /**
     * Earth radius in meters
     */
    private const EARTH_RADIUS = 6371000;

    /**
     * Calculate distance between two points using Haversine formula
     *
     * @param float $lat1 Latitude of first point
     * @param float $lng1 Longitude of first point
     * @param float $lat2 Latitude of second point
     * @param float $lng2 Longitude of second point
     * @return float Distance in meters
     */
    public function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        // Convert to radians
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLng = deg2rad($lng2 - $lng1);

        // Haversine formula
        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLng / 2) * sin($deltaLng / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS * $c;
    }

    /**
     * Check if a point is within a given radius of another point
     *
     * @param array $userLocation ['lat' => float, 'lng' => float]
     * @param array $eventLocation ['lat' => float, 'lng' => float]
     * @param int $radiusMeters Maximum allowed distance in meters
     * @return bool
     */
    public function isWithinRadius(array $userLocation, array $eventLocation, int $radiusMeters): bool
    {
        $distance = $this->calculateDistance(
            $userLocation['lat'],
            $userLocation['lng'],
            $eventLocation['lat'],
            $eventLocation['lng']
        );

        return $distance <= $radiusMeters;
    }

    /**
     * Get distance with details
     *
     * @param array $userLocation ['lat' => float, 'lng' => float]
     * @param array $eventLocation ['lat' => float, 'lng' => float]
     * @param int $allowedRadius Maximum allowed distance in meters
     * @return array
     */
    public function getDistanceInfo(array $userLocation, array $eventLocation, int $allowedRadius): array
    {
        $distance = $this->calculateDistance(
            $userLocation['lat'],
            $userLocation['lng'],
            $eventLocation['lat'],
            $eventLocation['lng']
        );

        $isWithinRadius = $distance <= $allowedRadius;

        return [
            'distance_meters' => round($distance, 2),
            'allowed_radius' => $allowedRadius,
            'is_within_radius' => $isWithinRadius,
            'excess_meters' => $isWithinRadius ? 0 : round($distance - $allowedRadius, 2),
        ];
    }

    /**
     * Validate location coordinates
     *
     * @param float $lat Latitude
     * @param float $lng Longitude
     * @return bool
     */
    public function isValidCoordinates(float $lat, float $lng): bool
    {
        return $lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180;
    }

    /**
     * Validate location array format
     *
     * @param array $location
     * @return bool
     */
    public function isValidLocation(array $location): bool
    {
        if (!isset($location['lat']) || !isset($location['lng'])) {
            return false;
        }

        if (!is_numeric($location['lat']) || !is_numeric($location['lng'])) {
            return false;
        }

        return $this->isValidCoordinates((float) $location['lat'], (float) $location['lng']);
    }

    /**
     * Format distance for display
     *
     * @param float $meters Distance in meters
     * @return string
     */
    public function formatDistance(float $meters): string
    {
        if ($meters < 1000) {
            return round($meters) . ' м';
        }

        return round($meters / 1000, 2) . ' км';
    }
}

