<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get events for calendar
        $eventsQuery = Event::with(['teacher.profile', 'category', 'groups']);

        if ($user->isTeacher()) {
            $eventsQuery->where('teacher_id', $user->id);
        } elseif ($user->isStudent()) {
            $groupIds = $user->groups()->pluck('groups.id');
            $eventsQuery->published()
                ->where(function ($q) use ($groupIds) {
                    $q->whereHas('groups', function ($gq) use ($groupIds) {
                        $gq->whereIn('groups.id', $groupIds);
                    })->orWhereDoesntHave('groups');
                });
        }

        $events = $eventsQuery->get();

        return Inertia::render('Calendar', [
            'events' => $events,
        ]);
    }
}

