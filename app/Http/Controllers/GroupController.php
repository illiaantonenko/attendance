<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GroupController extends Controller
{
    public function index()
    {
        $groups = Group::withCount('students')->get();
        
        return Inertia::render('Groups/Index', [
            'groups' => $groups,
        ]);
    }

    public function create()
    {
        return Inertia::render('Groups/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:groups'],
        ]);

        // Auto-generate code from name (transliterate Ukrainian to Latin)
        $code = $this->generateCode($validated['name']);
        $validated['code'] = $code;

        Group::create($validated);

        return redirect()->route('groups.index')->with('success', 'Групу створено!');
    }

    private function generateCode(string $name): string
    {
        $transliteration = [
            'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'h', 'ґ' => 'g', 'д' => 'd', 
            'е' => 'e', 'є' => 'ye', 'ж' => 'zh', 'з' => 'z', 'и' => 'y', 'і' => 'i', 
            'ї' => 'yi', 'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm', 'н' => 'n', 
            'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u', 
            'ф' => 'f', 'х' => 'kh', 'ц' => 'ts', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'shch', 
            'ь' => '', 'ю' => 'yu', 'я' => 'ya',
            'А' => 'A', 'Б' => 'B', 'В' => 'V', 'Г' => 'H', 'Ґ' => 'G', 'Д' => 'D', 
            'Е' => 'E', 'Є' => 'Ye', 'Ж' => 'Zh', 'З' => 'Z', 'И' => 'Y', 'І' => 'I', 
            'Ї' => 'Yi', 'Й' => 'Y', 'К' => 'K', 'Л' => 'L', 'М' => 'M', 'Н' => 'N', 
            'О' => 'O', 'П' => 'P', 'Р' => 'R', 'С' => 'S', 'Т' => 'T', 'У' => 'U', 
            'Ф' => 'F', 'Х' => 'Kh', 'Ц' => 'Ts', 'Ч' => 'Ch', 'Ш' => 'Sh', 'Щ' => 'Shch', 
            'Ь' => '', 'Ю' => 'Yu', 'Я' => 'Ya',
        ];
        
        $code = strtr($name, $transliteration);
        $code = preg_replace('/[^A-Za-z0-9\-]/', '', $code);
        return strtoupper($code);
    }

    public function show(Group $group)
    {
        $group->load(['students.profile']);
        
        return Inertia::render('Groups/Show', [
            'group' => $group,
        ]);
    }

    public function edit(Group $group)
    {
        return Inertia::render('Groups/Edit', [
            'group' => $group,
        ]);
    }

    public function update(Request $request, Group $group)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:groups,name,' . $group->id],
        ]);

        $group->update($validated);

        return redirect()->route('groups.show', $group)->with('success', 'Групу оновлено!');
    }

    public function destroy(Group $group)
    {
        $group->delete();

        return redirect()->route('groups.index')->with('success', 'Групу видалено!');
    }
}

