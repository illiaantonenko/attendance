<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Group;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
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

    // Events access tests
    public function test_admin_can_access_events(): void
    {
        $response = $this->actingAs($this->admin)->get('/events');
        $response->assertStatus(200);
    }

    public function test_teacher_can_access_events(): void
    {
        $response = $this->actingAs($this->teacher)->get('/events');
        $response->assertStatus(200);
    }

    public function test_student_cannot_access_events_list(): void
    {
        $response = $this->actingAs($this->student)->get('/events');
        $response->assertStatus(403);
    }

    // Statistics access tests
    public function test_admin_can_access_statistics(): void
    {
        $response = $this->actingAs($this->admin)->get('/statistics');
        $response->assertStatus(200);
    }

    public function test_teacher_can_access_statistics(): void
    {
        $response = $this->actingAs($this->teacher)->get('/statistics');
        $response->assertStatus(200);
    }

    public function test_student_cannot_access_statistics(): void
    {
        $response = $this->actingAs($this->student)->get('/statistics');
        $response->assertStatus(403);
    }

    // Groups access tests
    public function test_admin_can_access_groups(): void
    {
        $response = $this->actingAs($this->admin)->get('/groups');
        $response->assertStatus(200);
    }

    public function test_teacher_can_view_groups(): void
    {
        $response = $this->actingAs($this->teacher)->get('/groups');
        $response->assertStatus(200);
    }

    public function test_teacher_cannot_create_groups(): void
    {
        $response = $this->actingAs($this->teacher)->get('/groups/create');
        $response->assertStatus(403);
    }

    public function test_admin_can_create_groups(): void
    {
        $response = $this->actingAs($this->admin)->get('/groups/create');
        $response->assertStatus(200);
    }

    public function test_student_cannot_access_groups(): void
    {
        $response = $this->actingAs($this->student)->get('/groups');
        $response->assertStatus(403);
    }

    // Users access tests
    public function test_admin_can_access_users(): void
    {
        $response = $this->actingAs($this->admin)->get('/users');
        $response->assertStatus(200);
    }

    public function test_teacher_cannot_access_users(): void
    {
        $response = $this->actingAs($this->teacher)->get('/users');
        $response->assertStatus(403);
    }

    public function test_student_cannot_access_users(): void
    {
        $response = $this->actingAs($this->student)->get('/users');
        $response->assertStatus(403);
    }

    // My Events access tests
    public function test_student_can_access_my_events(): void
    {
        $response = $this->actingAs($this->student)->get('/my-events');
        $response->assertStatus(200);
    }

    public function test_teacher_cannot_access_my_events(): void
    {
        $response = $this->actingAs($this->teacher)->get('/my-events');
        $response->assertStatus(403);
    }

    // Check-in access tests
    public function test_student_can_access_check_in(): void
    {
        $response = $this->actingAs($this->student)->get('/check-in');
        $response->assertStatus(200);
    }

    // Calendar access tests (all roles)
    public function test_all_roles_can_access_calendar(): void
    {
        $this->actingAs($this->admin)->get('/calendar')->assertStatus(200);
        $this->actingAs($this->teacher)->get('/calendar')->assertStatus(200);
        $this->actingAs($this->student)->get('/calendar')->assertStatus(200);
    }
}

