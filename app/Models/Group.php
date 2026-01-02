<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'year',
        'specialty',
        'description',
    ];

    /**
     * Get students in this group
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_user')
            ->where('role', User::ROLE_STUDENT);
    }

    /**
     * Get all users in this group
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_user');
    }

    /**
     * Get events assigned to this group
     */
    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_group');
    }

    /**
     * Get student count
     */
    public function getStudentCountAttribute(): int
    {
        return $this->students()->count();
    }
}

