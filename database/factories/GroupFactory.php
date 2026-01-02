<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Group>
 */
class GroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $year = fake()->numberBetween(1, 4);
        $prefix = fake()->randomElement(['KN', 'IPZ', 'KI', 'SI']);
        $suffix = fake()->unique()->numberBetween(1, 9999);
        $code = $prefix . '-' . str_pad($suffix, 4, '0', STR_PAD_LEFT);

        return [
            'name' => "Група {$prefix}-{$year}" . fake()->unique()->randomNumber(3),
            'code' => $code,
            'year' => $year,
            'specialty' => fake()->randomElement([
                'Комп\'ютерні науки',
                'Інженерія програмного забезпечення',
                'Комп\'ютерна інженерія',
                'Системна інженерія',
            ]),
            'description' => fake()->sentence(),
        ];
    }
}

