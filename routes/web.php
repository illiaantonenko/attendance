<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MyEventsController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Health check for Cloud Run / Load Balancer
Route::get('/health', function () {
    return response('healthy', 200)
        ->header('Content-Type', 'text/plain');
});

// Debug: Test broadcast (REMOVE IN PRODUCTION)
Route::get('/debug/broadcast/{event}', function (\App\Models\Event $event) {
    $info = [
        'broadcast_driver' => config('broadcasting.default'),
        'pusher_host' => config('broadcasting.connections.pusher.options.host'),
        'pusher_port' => config('broadcasting.connections.pusher.options.port'),
        'pusher_key' => config('broadcasting.connections.pusher.key'),
        'channel' => 'event.' . $event->id,
    ];
    
    // Get or create a test registration
    $registration = \App\Models\EventRegistration::where('event_id', $event->id)->first();
    
    if (!$registration) {
        return response()->json([
            'error' => 'No registrations found for this event',
            'config' => $info,
        ]);
    }
    
    try {
        $registration->load('student.profile');
        event(new \App\Events\AttendanceRegistered($registration));
        $info['broadcast_result'] = 'SUCCESS - event dispatched';
        $info['registration_id'] = $registration->id;
    } catch (\Exception $e) {
        $info['broadcast_result'] = 'FAILED';
        $info['error'] = $e->getMessage();
        $info['trace'] = $e->getTraceAsString();
    }
    
    return response()->json($info, 200, [], JSON_PRETTY_PRINT);
})->middleware(['auth', 'role:admin']);

// Public routes
Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/dashboard');
    }
    return redirect('/login');
});

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::get('/register', [AuthenticatedSessionController::class, 'showRegistrationForm'])->name('register');
    Route::post('/register', [AuthenticatedSessionController::class, 'register']);
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');
    
    Route::get('/check-in', function () {
        return Inertia::render('CheckIn');
    })->name('check-in');
    
    // Events routes (for teachers and admins)
    Route::middleware('role:admin,teacher')->group(function () {
        Route::get('/events', [EventController::class, 'index'])->name('events.index');
        Route::get('/events/create', [EventController::class, 'create'])->name('events.create');
        Route::post('/events', [EventController::class, 'store'])->name('events.store');
        Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
        Route::get('/events/{event}/edit', [EventController::class, 'edit'])->name('events.edit');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('events.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
        
        // Manual attendance marking
        Route::post('/events/{event}/attendance', [EventController::class, 'markAttendance'])->name('events.attendance');
        Route::post('/events/{event}/attendance/bulk', [EventController::class, 'markBulkAttendance'])->name('events.attendance.bulk');
        
        Route::get('/statistics', [StatisticsController::class, 'index'])->name('statistics');
    });
    
    // Admin-only groups management (must be before {group} wildcard)
    Route::middleware('role:admin')->group(function () {
        Route::get('/groups/create', [GroupController::class, 'create'])->name('groups.create');
        Route::post('/groups', [GroupController::class, 'store'])->name('groups.store');
        Route::get('/groups/{group}/edit', [GroupController::class, 'edit'])->name('groups.edit');
        Route::put('/groups/{group}', [GroupController::class, 'update'])->name('groups.update');
        Route::delete('/groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');
    });
    
    // Groups routes (read-only for teachers, full access for admins)
    Route::middleware('role:admin,teacher')->group(function () {
        Route::get('/groups', [GroupController::class, 'index'])->name('groups.index');
        Route::get('/groups/{group}', [GroupController::class, 'show'])->name('groups.show');
    });
    
    // Admin-only users management
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    });
    
    // Student routes
    Route::middleware('role:student')->group(function () {
        Route::get('/my-events', [MyEventsController::class, 'index'])->name('my-events');
    });
});
