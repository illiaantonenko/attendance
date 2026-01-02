<?php

namespace App\Events;

use App\Models\EventRegistration;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceRegistered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public EventRegistration $registration
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('event.' . $this->registration->event_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'attendance.registered';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->registration->load('student.profile');
        
        return [
            'registration' => [
                'id' => $this->registration->id,
                'student_id' => $this->registration->student_id,
                'student_name' => $this->registration->student->full_name ?? 'Unknown',
                'status' => $this->registration->status,
                'check_in_time' => $this->registration->check_in_time?->toIso8601String(),
            ],
            'event_id' => $this->registration->event_id,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}

