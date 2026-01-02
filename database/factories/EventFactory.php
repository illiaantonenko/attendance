<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startTime = fake()->dateTimeBetween('now', '+1 week');
        $endTime = (clone $startTime)->modify('+1 hour 30 minutes');

        return [
            'teacher_id' => User::factory()->state(['role' => 'teacher']),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'event_type' => fake()->randomElement(['lecture', 'seminar', 'lab', 'exam']),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'location' => [
                'lat' => fake()->latitude(49.5, 49.7),
                'lng' => fake()->longitude(34.4, 34.6),
                'building' => 'Корпус ' . fake()->numberBetween(1, 10),
                'room' => fake()->numberBetween(100, 500),
            ],
            'allowed_radius' => 100,
            'qr_enabled' => true,
            'geolocation_required' => fake()->boolean(30),
            'published' => true,
        ];
    }

    /**
     * Indicate that the event is a lecture.
     */
    public function lecture(): static
    {
        return $this->state(fn (array $attributes) => [
            'event_type' => 'lecture',
        ]);
    }

    /**
     * Indicate that the event is unpublished.
     */
    public function unpublished(): static
    {
        return $this->state(fn (array $attributes) => [
            'published' => false,
        ]);
    }
}

