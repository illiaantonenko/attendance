<?php

namespace Tests\Unit;

use App\Services\GeolocationService;
use PHPUnit\Framework\TestCase;

class GeolocationServiceTest extends TestCase
{
    private GeolocationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new GeolocationService();
    }

    public function test_calculates_distance_between_same_point(): void
    {
        $distance = $this->service->calculateDistance(49.5883, 34.5514, 49.5883, 34.5514);
        
        $this->assertEquals(0, $distance);
    }

    public function test_calculates_distance_between_nearby_points(): void
    {
        // Point 1: 49.5883, 34.5514
        // Point 2: 49.5893, 34.5524 (approximately 120m away)
        $distance = $this->service->calculateDistance(49.5883, 34.5514, 49.5893, 34.5524);
        
        // Should be approximately 120-140 meters
        $this->assertGreaterThan(100, $distance);
        $this->assertLessThan(150, $distance);
    }

    public function test_calculates_distance_between_far_points(): void
    {
        // Kyiv: 50.4501, 30.5234
        // Poltava: 49.5883, 34.5514
        $distance = $this->service->calculateDistance(50.4501, 30.5234, 49.5883, 34.5514);
        
        // Should be approximately 300-350 km
        $this->assertGreaterThan(300000, $distance);
        $this->assertLessThan(350000, $distance);
    }

    public function test_is_within_radius_returns_true_for_nearby_point(): void
    {
        $eventLocation = ['lat' => 49.5883, 'lng' => 34.5514];
        $userLocation = ['lat' => 49.5885, 'lng' => 34.5516]; // ~30m away
        
        $result = $this->service->isWithinRadius($userLocation, $eventLocation, 100);
        
        $this->assertTrue($result);
    }

    public function test_is_within_radius_returns_false_for_far_point(): void
    {
        $eventLocation = ['lat' => 49.5883, 'lng' => 34.5514];
        $userLocation = ['lat' => 49.5950, 'lng' => 34.5600]; // ~1km away
        
        $result = $this->service->isWithinRadius($userLocation, $eventLocation, 100);
        
        $this->assertFalse($result);
    }

    public function test_validates_location_format(): void
    {
        $validLocation = ['lat' => 49.5883, 'lng' => 34.5514];
        $invalidLocation1 = ['lat' => 49.5883]; // Missing lng
        $invalidLocation2 = ['latitude' => 49.5883, 'longitude' => 34.5514]; // Wrong keys
        
        $this->assertTrue($this->service->isValidLocation($validLocation));
        $this->assertFalse($this->service->isValidLocation($invalidLocation1));
        $this->assertFalse($this->service->isValidLocation($invalidLocation2));
    }

    public function test_validates_coordinates_range(): void
    {
        $this->assertTrue($this->service->isValidLocation(['lat' => 0, 'lng' => 0]));
        $this->assertTrue($this->service->isValidLocation(['lat' => 90, 'lng' => 180]));
        $this->assertTrue($this->service->isValidLocation(['lat' => -90, 'lng' => -180]));
        
        $this->assertFalse($this->service->isValidLocation(['lat' => 91, 'lng' => 0])); // Invalid lat
        $this->assertFalse($this->service->isValidLocation(['lat' => 0, 'lng' => 181])); // Invalid lng
    }
}

