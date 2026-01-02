<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GroupTest extends TestCase
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

    public function test_admin_can_view_groups_list(): void
    {
        Group::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)->get('/groups');

        $response->assertStatus(200);
    }

    public function test_teacher_can_view_groups_list(): void
    {
        Group::factory()->count(3)->create();

        $response = $this->actingAs($this->teacher)->get('/groups');

        $response->assertStatus(200);
    }

    public function test_student_cannot_view_groups_list(): void
    {
        $response = $this->actingAs($this->student)->get('/groups');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_group(): void
    {
        $response = $this->actingAs($this->admin)->post('/groups', [
            'name' => 'Test Group',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('groups', ['name' => 'Test Group']);
    }

    public function test_teacher_cannot_create_group(): void
    {
        $response = $this->actingAs($this->teacher)->post('/groups', [
            'name' => 'КН-42',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_view_group_details(): void
    {
        $group = Group::factory()->create();

        $response = $this->actingAs($this->admin)->get("/groups/{$group->id}");

        $response->assertStatus(200);
    }

    public function test_teacher_can_view_group_details(): void
    {
        $group = Group::factory()->create();

        $response = $this->actingAs($this->teacher)->get("/groups/{$group->id}");

        $response->assertStatus(200);
    }

    public function test_admin_can_update_group(): void
    {
        $group = Group::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin)->put("/groups/{$group->id}", [
            'name' => 'New Name',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('groups', [
            'id' => $group->id,
            'name' => 'New Name',
        ]);
    }

    public function test_teacher_cannot_update_group(): void
    {
        $group = Group::factory()->create(['name' => 'Original']);

        $response = $this->actingAs($this->teacher)->put("/groups/{$group->id}", [
            'name' => 'Modified',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_group(): void
    {
        $group = Group::factory()->create();

        $response = $this->actingAs($this->admin)->delete("/groups/{$group->id}");

        $response->assertRedirect('/groups');
        $this->assertDatabaseMissing('groups', ['id' => $group->id]);
    }

    public function test_teacher_cannot_delete_group(): void
    {
        $group = Group::factory()->create();

        $response = $this->actingAs($this->teacher)->delete("/groups/{$group->id}");

        $response->assertStatus(403);
    }

    public function test_group_name_is_required(): void
    {
        $response = $this->actingAs($this->admin)->post('/groups', [
            'name' => '',
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_group_shows_students_count(): void
    {
        $group = Group::factory()->create();
        
        // Add students to group
        $students = User::factory()->count(5)->create(['role' => 'student']);
        foreach ($students as $student) {
            Profile::factory()->create(['user_id' => $student->id]);
            $student->update(['group_id' => $group->id]);
        }

        $response = $this->actingAs($this->admin)->get('/groups');

        $response->assertStatus(200);
    }
}

