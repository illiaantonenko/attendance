<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Group;
use App\Models\User;
use App\Services\QrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class QrCheckInTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;
    private User $student;
    private Event $event;
    private Group $group;

    protected function setUp(): void
    {
        parent::setUp();

        $this->group = Group::factory()->create();
        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->student = User::factory()->create(['role' => 'student']);
        
        // Add student to group via pivot table
        $this->group->students()->attach($this->student->id);

        $this->event = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'qr_enabled' => true,
            'geolocation_required' => false,
            'start_time' => now()->subMinutes(5),
            'end_time' => now()->addHours(2),
        ]);

        $this->event->groups()->attach($this->group->id);
    }

    public function test_qr_service_generates_valid_token(): void
    {
        $qrService = app(QrService::class);
        
        $result = $qrService->generate($this->event);
        
        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('qrCode', $result);
        $this->assertArrayHasKey('expiresAt', $result);
        $this->assertNotEmpty($result['token']);
    }

    public function test_teacher_can_generate_qr_for_event(): void
    {
        $response = $this->actingAs($this->teacher)
            ->postJson("/api/v1/events/{$this->event->id}/qr/generate");

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'qrCode', 'expiresAt']);
    }

    public function test_student_cannot_generate_qr(): void
    {
        $response = $this->actingAs($this->student)
            ->postJson("/api/v1/events/{$this->event->id}/qr/generate");

        $response->assertStatus(403);
    }

    public function test_student_can_check_in_with_valid_qr(): void
    {
        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        $response = $this->actingAs($this->student)
            ->postJson('/api/v1/events/check-in', [
                'token' => $qrData['token'],
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('event_registrations', [
            'event_id' => $this->event->id,
            'user_id' => $this->student->id,
        ]);
    }

    public function test_student_cannot_check_in_twice(): void
    {
        $qrService = app(QrService::class);
        
        // First check-in
        $qrData1 = $qrService->generate($this->event);
        $this->actingAs($this->student)
            ->postJson('/api/v1/events/check-in', ['token' => $qrData1['token']]);

        // Second check-in attempt
        $qrData2 = $qrService->generate($this->event);
        $response = $this->actingAs($this->student)
            ->postJson('/api/v1/events/check-in', ['token' => $qrData2['token']]);

        $response->assertStatus(400)
            ->assertJson(['error' => 'Ви вже відмітились на цій події']);
    }

    public function test_student_cannot_check_in_with_expired_token(): void
    {
        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        // Manually expire the nonce by deleting from Redis
        Redis::del("qr:nonce:{$this->event->id}:" . substr($qrData['token'], -32));

        $response = $this->actingAs($this->student)
            ->postJson('/api/v1/events/check-in', [
                'token' => $qrData['token'],
            ]);

        $response->assertStatus(400);
    }

    public function test_student_not_in_group_cannot_check_in(): void
    {
        // Create student without any group association
        $otherStudent = User::factory()->create(['role' => 'student']);

        $qrService = app(QrService::class);
        $qrData = $qrService->generate($this->event);

        $response = $this->actingAs($otherStudent)
            ->postJson('/api/v1/events/check-in', [
                'token' => $qrData['token'],
            ]);

        $response->assertStatus(403);
    }
}

