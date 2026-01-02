<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\Group;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        Profile::factory()->create(['user_id' => $this->admin->id]);

        $this->teacher = User::factory()->create(['role' => 'teacher']);
        Profile::factory()->create(['user_id' => $this->teacher->id]);

        $this->student = User::factory()->create(['role' => 'student']);
        Profile::factory()->create(['user_id' => $this->student->id]);
    }

    public function test_admin_can_view_events_list(): void
    {
        Event::factory()->count(3)->create(['teacher_id' => $this->teacher->id]);

        $response = $this->actingAs($this->admin)->get('/events');

        $response->assertStatus(200);
    }

    public function test_teacher_can_view_events_list(): void
    {
        Event::factory()->count(3)->create(['teacher_id' => $this->teacher->id]);

        $response = $this->actingAs($this->teacher)->get('/events');

        $response->assertStatus(200);
    }

    public function test_student_cannot_view_events_list(): void
    {
        $response = $this->actingAs($this->student)->get('/events');

        $response->assertStatus(403);
    }

    public function test_teacher_can_create_event(): void
    {
        $group = Group::factory()->create();

        $response = $this->actingAs($this->teacher)->post('/events', [
            'title' => 'Test Event',
            'description' => 'Test description',
            'event_type' => 'lecture',
            'start_time' => now()->addDay()->format('Y-m-d\TH:i'),
            'end_time' => now()->addDay()->addHours(2)->format('Y-m-d\TH:i'),
            'location' => ['building' => '1', 'room' => '101'],
            'qr_enabled' => true,
            'geolocation_required' => false,
            'allowed_radius' => 100,
            'group_ids' => [$group->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('events', [
            'title' => 'Test Event',
            'teacher_id' => $this->teacher->id,
        ]);
    }

    public function test_student_cannot_create_event(): void
    {
        $response = $this->actingAs($this->student)->post('/events', [
            'title' => 'Fake Event',
            'event_type' => 'lecture',
            'start_time' => now()->addDay()->format('Y-m-d\TH:i'),
            'end_time' => now()->addDay()->addHours(2)->format('Y-m-d\TH:i'),
        ]);

        $response->assertStatus(403);
    }

    public function test_teacher_can_view_own_event(): void
    {
        $event = Event::factory()->create(['teacher_id' => $this->teacher->id]);

        $response = $this->actingAs($this->teacher)->get("/events/{$event->id}");

        $response->assertStatus(200);
    }

    public function test_teacher_can_update_own_event(): void
    {
        $event = Event::factory()->create(['teacher_id' => $this->teacher->id]);

        $response = $this->actingAs($this->teacher)->put("/events/{$event->id}", [
            'title' => 'Updated Title',
            'description' => $event->description,
            'event_type' => $event->event_type,
            'start_time' => $event->start_time->format('Y-m-d\TH:i'),
            'end_time' => $event->end_time->format('Y-m-d\TH:i'),
            'location' => $event->location,
            'qr_enabled' => $event->qr_enabled,
            'geolocation_required' => $event->geolocation_required,
            'allowed_radius' => $event->allowed_radius,
            'group_ids' => [],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_teacher_cannot_update_other_teacher_event(): void
    {
        $otherTeacher = User::factory()->create(['role' => 'teacher']);
        Profile::factory()->create(['user_id' => $otherTeacher->id]);

        $event = Event::factory()->create(['teacher_id' => $otherTeacher->id]);

        $response = $this->actingAs($this->teacher)->put("/events/{$event->id}", [
            'title' => 'Hacked Title',
            'event_type' => 'lecture',
            'start_time' => now()->format('Y-m-d\TH:i'),
            'end_time' => now()->addHour()->format('Y-m-d\TH:i'),
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_any_event(): void
    {
        $event = Event::factory()->create(['teacher_id' => $this->teacher->id]);

        $response = $this->actingAs($this->admin)->put("/events/{$event->id}", [
            'title' => 'Admin Updated',
            'description' => $event->description,
            'event_type' => $event->event_type,
            'start_time' => $event->start_time->format('Y-m-d\TH:i'),
            'end_time' => $event->end_time->format('Y-m-d\TH:i'),
            'location' => $event->location,
            'qr_enabled' => $event->qr_enabled,
            'geolocation_required' => $event->geolocation_required,
            'allowed_radius' => $event->allowed_radius,
            'group_ids' => [],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'title' => 'Admin Updated',
        ]);
    }

    public function test_teacher_can_delete_own_event(): void
    {
        $event = Event::factory()->create(['teacher_id' => $this->teacher->id]);

        $response = $this->actingAs($this->teacher)->delete("/events/{$event->id}");

        $response->assertRedirect('/events');
        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }

    public function test_event_requires_title(): void
    {
        $response = $this->actingAs($this->teacher)->post('/events', [
            'title' => '',
            'event_type' => 'lecture',
            'start_time' => now()->addDay()->format('Y-m-d\TH:i'),
            'end_time' => now()->addDay()->addHours(2)->format('Y-m-d\TH:i'),
        ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_event_end_time_must_be_after_start_time(): void
    {
        $response = $this->actingAs($this->teacher)->post('/events', [
            'title' => 'Test Event',
            'event_type' => 'lecture',
            'start_time' => now()->addDay()->addHours(2)->format('Y-m-d\TH:i'),
            'end_time' => now()->addDay()->format('Y-m-d\TH:i'), // Before start
        ]);

        $response->assertSessionHasErrors('end_time');
    }
}
