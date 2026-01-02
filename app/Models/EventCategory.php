<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'color',
        'text_color',
        'description',
    ];

    /**
     * Get events in this category
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'category_id');
    }
}

