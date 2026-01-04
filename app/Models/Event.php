<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    /**
     * Event types
     */
    public const TYPE_LECTURE = 'lecture';
    public const TYPE_SEMINAR = 'seminar';
    public const TYPE_LAB = 'lab';
    public const TYPE_EXAM = 'exam';

    protected $fillable = [
        'teacher_id',
        'category_id',
        'course_id',
        'title',
        'description',
        'event_type',
        'start_time',
        'end_time',
        'location',
        'allowed_radius',
        'qr_enabled',
        'geolocation_required',
        'published',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'location' => 'array',
            'qr_enabled' => 'boolean',
            'geolocation_required' => 'boolean',
            'published' => 'boolean',
        ];
    }

    /**
     * Get the teacher who created the event
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Get the category
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    /**
     * Get event registrations
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    /**
     * Get groups assigned to this event
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'event_group');
    }

    /**
     * Get QR tokens for this event
     */
    public function qrTokens(): HasMany
    {
        return $this->hasMany(QrToken::class);
    }

    /**
     * Check if event is currently active (can check in)
     */
    public function isActive(): bool
    {
        $now = now();
        $checkInWindow = 15; // minutes before start for students

        return $now >= $this->start_time->subMinutes($checkInWindow)
            && $now <= $this->end_time;
    }

    /**
     * Check if QR code can be shown to teacher (2 hours before event)
     */
    public function canShowQrCode(): bool
    {
        $now = now();
        $teacherWindow = 120; // 2 hours before start

        return $now >= $this->start_time->subMinutes($teacherWindow)
            && $now <= $this->end_time;
    }

    /**
     * Check if check-in is too early
     */
    public function isTooEarly(): bool
    {
        $checkInWindow = 15;
        return now() < $this->start_time->subMinutes($checkInWindow);
    }

    /**
     * Check if event has ended
     */
    public function hasEnded(): bool
    {
        return now() > $this->end_time;
    }

    /**
     * Get attendance count
     */
    public function getAttendanceCountAttribute(): int
    {
        return $this->registrations()->where('status', 'present')->count();
    }

    /**
     * Scope for published events
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published', true);
    }

    /**
     * Scope for upcoming events
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('start_time', '>', now())->orderBy('start_time');
    }

    /**
     * Scope for events by teacher
     */
    public function scopeByTeacher(Builder $query, int $teacherId): Builder
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Search events
     */
    public static function search(array $params): Builder
    {
        $query = self::query();

        if (isset($params['published'])) {
            $query->where('published', $params['published']);
        }

        if (isset($params['teacher_id'])) {
            $query->where('teacher_id', $params['teacher_id']);
        }

        if (isset($params['category_id'])) {
            $query->where('category_id', $params['category_id']);
        }

        if (isset($params['from_date'])) {
            $query->where('start_time', '>=', $params['from_date']);
        }

        if (isset($params['to_date'])) {
            $query->where('end_time', '<=', $params['to_date']);
        }

        $sortField = $params['sort'] ?? 'start_time';
        $sortOrder = $params['order'] ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        return $query;
    }
}

