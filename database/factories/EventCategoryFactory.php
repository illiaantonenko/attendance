<?php

namespace Database\Factories;

use App\Models\EventCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventCategoryFactory extends Factory
{
    protected $model = EventCategory::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Математика', 'Фізика', 'Інформатика', 'Програмування']),
            'color' => $this->faker->hexColor(),
            'textColor' => '#ffffff',
        ];
    }
}
