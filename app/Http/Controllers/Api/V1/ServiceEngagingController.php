<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithTableFilters;
use App\Http\Controllers\Controller;
use App\Models\ServiceEngaging;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceEngagingController extends Controller
{
    use InteractsWithTableFilters;

    public function index(Request $request): JsonResponse
    {
        [$search, $perPage] = $this->tableFilters($request);

        $query = ServiceEngaging::query()->active()->orderBy('name');

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

        $row = ServiceEngaging::query()->create($validated);

        return response()->json($row, 201);
    }

    public function show(ServiceEngaging $serviceEngaging): JsonResponse
    {
        if ($serviceEngaging->archived_at !== null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json($serviceEngaging);
    }

    public function update(Request $request, ServiceEngaging $serviceEngaging): JsonResponse
    {
        if ($serviceEngaging->archived_at !== null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $serviceEngaging->update($validated);

        return response()->json($serviceEngaging);
    }

    public function destroy(ServiceEngaging $serviceEngaging): JsonResponse
    {
        if ($serviceEngaging->archived_at !== null) {
            return response()->json(['message' => 'Already archived.'], 409);
        }

        $serviceEngaging->forceFill(['archived_at' => now()])->save();

        return response()->json(['message' => 'Archived.']);
    }

    public function archived(Request $request): JsonResponse
    {
        [$search, $perPage] = $this->tableFilters($request);

        $query = ServiceEngaging::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function restore(ServiceEngaging $serviceEngaging): JsonResponse
    {
        if ($serviceEngaging->archived_at === null) {
            return response()->json(['message' => 'Not archived.'], 409);
        }

        $serviceEngaging->forceFill(['archived_at' => null])->save();

        return response()->json($serviceEngaging);
    }
}
