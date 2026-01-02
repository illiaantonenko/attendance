<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['profile', 'groups']);
        
        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }
        
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhereHas('profile', function ($q) use ($search) {
                        $q->where('firstname', 'like', "%{$search}%")
                            ->orWhere('lastname', 'like', "%{$search}%");
                    });
            });
        }
        
        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        // Transform to include first group
        $users->getCollection()->transform(function ($user) {
            $user->group = $user->groups->first();
            return $user;
        });
        
        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['role', 'search']),
        ]);
    }

    public function show(User $user)
    {
        $user->load(['profile', 'groups']);
        $user->group = $user->groups->first();
        
        return Inertia::render('Users/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user)
    {
        $user->load(['profile', 'groups']);
        $user->group_id = $user->groups->first()?->id;
        $groups = Group::all();
        
        return Inertia::render('Users/Edit', [
            'user' => $user,
            'groups' => $groups,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['sometimes', 'in:admin,teacher,student'],
            'group_id' => ['nullable', 'exists:groups,id'],
            'profile.firstname' => ['sometimes', 'string', 'max:100'],
            'profile.lastname' => ['sometimes', 'string', 'max:100'],
        ]);

        if (isset($validated['role'])) {
            $user->role = $validated['role'];
            $user->save();
        }
        
        // Update group (sync to pivot table)
        if (array_key_exists('group_id', $validated)) {
            if ($validated['group_id']) {
                $user->groups()->sync([$validated['group_id']]);
            } else {
                $user->groups()->detach();
            }
        }

        if (isset($validated['profile'])) {
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                $validated['profile']
            );
        }

        return redirect()->route('users.index')->with('success', 'Користувача оновлено!');
    }
}

