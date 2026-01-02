<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRegistration extends Model
{
    use HasFactory;

    /**
     * Attendance statuses
     */
    public const STATUS_REGISTERED = 'registered';
    public const STATUS_PRESENT = 'present';
    public const STATUS_ABSENT = 'absent';
    public const STATUS_LATE = 'late';
    public const STATUS_EXCUSED = 'excused';

    protected $fillable = [
        'event_id',
        'student_id',
        'status',
        'check_in_time',
        'check_in_location',
        'device_info',
        'hash',
    ];

    protected function casts(): array
    {
        return [
            'check_in_time' => 'datetime',
            'check_in_location' => 'array',
        ];
    }

    /**
     * Get the event
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the student
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Check if student has checked in
     */
    public function hasCheckedIn(): bool
    {
        return $this->status === self::STATUS_PRESENT && $this->check_in_time !== null;
    }

    /**
     * Mark as present
     */
    public function markAsPresent(array $location = null, string $deviceInfo = null): void
    {
        $this->update([
            'status' => self::STATUS_PRESENT,
            'check_in_time' => now(),
            'check_in_location' => $location,
            'device_info' => $deviceInfo,
            'hash' => null, // Clear hash after use
        ]);
    }
}

