<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->student = User::factory()->create(['role' => 'student']);
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
        $category = EventCategory::factory()->create();
        $group = Group::factory()->create();

        $response = $this->actingAs($this->teacher)->post('/events', [
            'title' => 'Test Lecture',
            'description' => 'Test description',
            'event_type' => 'lecture',
            'category_id' => $category->id,
            'start_time' => now()->addDay()->format('Y-m-d\TH:i'),
            'end_time' => now()->addDay()->addHours(2)->format('Y-m-d\TH:i'),
            'location' => [
                'building' => '1',
                'room' => '101',
                'lat' => '',
                'lng' => '',
            ],
            'allowed_radius' => 100,
            'qr_enabled' => true,
            'geolocation_required' => false,
            'group_ids' => [$group->id],
        ]);

        $response->assertRedirect('/events');
        $this->assertDatabaseHas('events', ['title' => 'Test Lecture']);
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
            'location' => $event->location ?? ['building' => '', 'room' => '', 'lat' => '', 'lng' => ''],
            'allowed_radius' => 100,
            'qr_enabled' => true,
            'geolocation_required' => false,
            'group_ids' => [],
        ]);

        $response->assertRedirect("/events/{$event->id}");
        $this->assertDatabaseHas('events', ['title' => 'Updated Title']);
    }

    public function test_teacher_can_delete_own_event(): void
    {
        $event = Event::factory()->create(['teacher_id' => $this->teacher->id]);

        $response = $this->actingAs($this->teacher)->delete("/events/{$event->id}");

        $response->assertRedirect('/events');
        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }
}

