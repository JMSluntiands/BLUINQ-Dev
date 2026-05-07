<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithTableFilters;
use App\Http\Controllers\Controller;
use App\Models\ExternalWallConstruction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExternalWallConstructionController extends Controller
{
    use InteractsWithTableFilters;

    public function index(Request $request): JsonResponse
    {
        [$search, $perPage] = $this->tableFilters($request);

        $query = ExternalWallConstruction::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $row = ExternalWallConstruction::query()->create($validated);

        return response()->json($row, 201);
    }

    public function show(ExternalWallConstruction $externalWallConstruction): JsonResponse
    {
        if ($externalWallConstruction->archived_at !== null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json($externalWallConstruction);
    }

    public function update(Request $request, ExternalWallConstruction $externalWallConstruction): JsonResponse
    {
        if ($externalWallConstruction->archived_at !== null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $externalWallConstruction->update($validated);

        return response()->json($externalWallConstruction);
    }

    public function destroy(ExternalWallConstruction $externalWallConstruction): JsonResponse
    {
        if ($externalWallConstruction->archived_at !== null) {
            return response()->json(['message' => 'Already archived.'], 409);
        }

        $externalWallConstruction->forceFill(['archived_at' => now()])->save();

        return response()->json(['message' => 'Archived.']);
    }

    public function archived(Request $request): JsonResponse
    {
        [$search, $perPage] = $this->tableFilters($request);

        $query = ExternalWallConstruction::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function restore(ExternalWallConstruction $externalWallConstruction): JsonResponse
    {
        if ($externalWallConstruction->archived_at === null) {
            return response()->json(['message' => 'Not archived.'], 409);
        }

        $externalWallConstruction->forceFill(['archived_at' => null])->save();

        return response()->json($externalWallConstruction);
    }
}
