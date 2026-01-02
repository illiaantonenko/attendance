<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Group;
use App\Models\Profile;
use App\Models\User;
use App\Services\QrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckInTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;
    private User $student;
    private Event $event;
    private Group $group;

    protected function setUp(): void
    {
        parent::setUp();

        // Create teacher
        $this->teacher = User::factory()->create(['role' => 'teacher', 'moderated' => true]);
        Profile::factory()->create(['user_id' => $this->teacher->id]);

        // Create student
        $this->student = User::factory()->create(['role' => 'student', 'moderated' => true]);
        Profile::factory()->create(['user_id' => $this->student->id]);

        // Create group and assign student
        $this->group = Group::factory()->create();
        $this->student->groups()->attach($this->group->id);

        // Create event
        $this->event = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'start_time' => now()->subMinutes(5),
            'end_time' => now()->addHours(1),
            'qr_enabled' => true,
            'geolocation_required' => false,
            'published' => true,
        ]);
        $this->event->groups()->attach($this->group->id);
    }

    public function test_student_can_check_in_with_valid_qr(): void
    {
        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        $response = $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
        ]);

        $response->assertStatus(201);
        $response->assertJson(['message' => __('check_in.success')]);

        $this->assertDatabaseHas('event_registrations', [
            'event_id' => $this->event->id,
            'student_id' => $this->student->id,
            'status' => 'present',
        ]);
    }

    public function test_student_cannot_check_in_twice(): void
    {
        $qrService = app(QrService::class);
        
        // First check-in
        $qrData1 = $qrService->generate($this->event);
        $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData1['token'],
        ]);

        // Second check-in attempt
        $qrData2 = $qrService->generate($this->event);
        $response = $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData2['token'],
        ]);

        $response->assertStatus(409);
    }

    public function test_qr_token_cannot_be_reused(): void
    {
        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        // First use
        $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
        ]);

        // Create another student
        $student2 = User::factory()->create(['role' => 'student', 'moderated' => true]);
        Profile::factory()->create(['user_id' => $student2->id]);
        $student2->groups()->attach($this->group->id);

        // Try to reuse the same token
        $response = $this->actingAs($student2)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
        ]);

        $response->assertStatus(400);
    }

    public function test_check_in_fails_with_expired_token(): void
    {
        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        // Travel forward in time past expiration
        $this->travel(15)->minutes();

        $response = $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
        ]);

        $response->assertStatus(400);
    }

    public function test_check_in_fails_for_event_not_started(): void
    {
        // Create future event
        $futureEvent = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'start_time' => now()->addHours(2),
            'end_time' => now()->addHours(3),
            'qr_enabled' => true,
            'published' => true,
        ]);
        $futureEvent->groups()->attach($this->group->id);

        $qrService = app(QrService::class);
        $qrData = $qrService->generate($futureEvent);

        $response = $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
        ]);

        $response->assertStatus(400);
    }

    public function test_check_in_fails_for_ended_event(): void
    {
        // Create past event
        $pastEvent = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'start_time' => now()->subHours(3),
            'end_time' => now()->subHours(1),
            'qr_enabled' => true,
            'published' => true,
        ]);
        $pastEvent->groups()->attach($this->group->id);

        $qrService = app(QrService::class);
        $qrData = $qrService->generate($pastEvent);

        $response = $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
        ]);

        $response->assertStatus(400);
    }

    public function test_teacher_cannot_check_in(): void
    {
        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        $response = $this->actingAs($this->teacher)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
        ]);

        $response->assertStatus(403);
    }

    public function test_check_in_with_geolocation_within_radius(): void
    {
        // Update event to require geolocation
        $this->event->update([
            'geolocation_required' => true,
            'location' => ['lat' => 49.58, 'lng' => 34.55],
            'allowed_radius' => 100,
        ]);

        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        $response = $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
            'location' => ['lat' => 49.5801, 'lng' => 34.5501], // Within 100m
        ]);

        $response->assertStatus(201);
    }

    public function test_check_in_fails_with_geolocation_outside_radius(): void
    {
        // Update event to require geolocation
        $this->event->update([
            'geolocation_required' => true,
            'location' => ['lat' => 49.58, 'lng' => 34.55],
            'allowed_radius' => 100,
        ]);

        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        $response = $this->actingAs($this->student)->postJson('/api/v1/events/check-in', [
            'token' => $qrData['token'],
            'location' => ['lat' => 50.00, 'lng' => 35.00], // Far away
        ]);

        $response->assertStatus(400);
    }
}

