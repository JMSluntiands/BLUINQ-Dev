<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);

        $listQuery = Client::query()->active()->orderBy('name');
        if ($search !== '') {
            $listQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('abn', 'like', '%'.$search.'%')
                    ->orWhere('office_phone', 'like', '%'.$search.'%')
                    ->orWhere('website', 'like', '%'.$search.'%')
                    ->orWhere('city', 'like', '%'.$search.'%')
                    ->orWhereHas('contacts', function ($contactQuery) use ($search) {
                        $contactQuery->where('name', 'like', '%'.$search.'%')
                            ->orWhere('email', 'like', '%'.$search.'%')
                            ->orWhere('mobile', 'like', '%'.$search.'%');
                    });
            });
        }

        $sidebarClients = $listQuery
            ->get(['id', 'name', 'is_default', 'status'])
            ->map(fn (Client $client) => [
                'id' => $client->id,
                'name' => $client->name,
                'is_default' => (bool) $client->is_default,
                'status' => $client->status,
            ])
            ->values()
            ->all();

        $selectedId = (int) $request->input('client', 0);
        $selected = null;

        if ($selectedId > 0) {
            $selected = Client::query()
                ->active()
                ->with('contacts')
                ->whereKey($selectedId)
                ->first();
        }

        if ($selected === null && $sidebarClients !== []) {
            $selected = Client::query()
                ->active()
                ->with('contacts')
                ->whereKey($sidebarClients[0]['id'])
                ->first();
        }

        if ($selected !== null) {
            $selected->ensureCoreContacts();
            $selected->load('contacts');
        }

        return Inertia::render('Settings/Client/Index', [
            'clients' => $sidebarClients,
            'selected' => $selected ? $this->formatClientDetail($selected) : null,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
        ]);

        $client = DB::transaction(function () use ($validated) {
            $client = Client::query()->create([
                'name' => $validated['name'],
                'status' => $validated['status'] ?? 'active',
                'is_default' => false,
            ]);
            $client->ensureCoreContacts();

            return $client;
        });

        return redirect()
            ->route('settings.client.index', ['client' => $client->id])
            ->with('status', 'client-created');
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        if ($client->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'abn' => ['nullable', 'string', 'max:255'],
            'office_phone' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'post_code' => ['nullable', 'string', 'max:32'],
            'country' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($client, $validated) {
            if (! empty($validated['is_default'])) {
                Client::query()
                    ->whereKeyNot($client->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            $client->update($validated);
        });

        return redirect()
            ->route('settings.client.index', array_filter([
                'client' => $client->id,
                'search' => $request->input('search'),
            ]))
            ->with('status', 'client-updated');
    }

    public function storeContact(Request $request, Client $client): RedirectResponse
    {
        if ($client->archived_at !== null) {
            abort(404);
        }

        $validated = $this->validateContact($request, ClientContact::TYPE_ADDITIONAL);

        $maxSort = (int) $client->additionalContacts()->max('sort_order');
        $client->contacts()->create([
            ...$validated,
            'type' => ClientContact::TYPE_ADDITIONAL,
            'sort_order' => $maxSort + 1,
        ]);

        return redirect()
            ->route('settings.client.index', ['client' => $client->id])
            ->with('status', 'client-contact-created');
    }

    public function updateContact(
        Request $request,
        Client $client,
        ClientContact $contact,
    ): RedirectResponse {
        if ($client->archived_at !== null || $contact->client_id !== $client->id) {
            abort(404);
        }

        $validated = $this->validateContact($request, $contact->type);
        $contact->update($validated);

        return redirect()
            ->route('settings.client.index', ['client' => $client->id])
            ->with('status', 'client-contact-updated');
    }

    public function destroyContact(
        Request $request,
        Client $client,
        ClientContact $contact,
    ): RedirectResponse {
        if ($client->archived_at !== null || $contact->client_id !== $client->id) {
            abort(404);
        }

        if ($contact->type !== ClientContact::TYPE_ADDITIONAL) {
            return redirect()
                ->route('settings.client.index', ['client' => $client->id])
                ->with('status', 'client-contact-locked');
        }

        $contact->delete();

        return redirect()
            ->route('settings.client.index', ['client' => $client->id])
            ->with('status', 'client-contact-deleted');
    }

    public function destroy(Request $request, Client $client): RedirectResponse
    {
        if ($client->archived_at !== null) {
            return redirect()
                ->route('settings.client.archive')
                ->with('status', 'client-already-archived');
        }

        $client->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.client.index')
            ->with('status', 'client-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = Client::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('abn', 'like', '%'.$search.'%')
                    ->orWhere('office_phone', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Client/Archive', [
            'clients' => $query
                ->paginate($perPage)
                ->through(fn (Client $row) => [
                    'id' => $row->id,
                    'name' => $row->name,
                    'status' => $row->status,
                    'archived_at' => $row->archived_at?->timezone(config('app.timezone'))?->format('M j, Y g:i A'),
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, Client $client): RedirectResponse
    {
        if ($client->archived_at === null) {
            return redirect()
                ->route('settings.client.index', ['client' => $client->id])
                ->with('status', 'client-not-archived');
        }

        $client->forceFill(['archived_at' => null])->save();
        $client->ensureCoreContacts();

        return redirect()
            ->route('settings.client.index', ['client' => $client->id])
            ->with('status', 'client-restored');
    }

    /**
     * @return array<string, mixed>
     */
    private function formatClientDetail(Client $client): array
    {
        $contacts = $client->contacts->map(fn (ClientContact $contact) => [
            'id' => $contact->id,
            'type' => $contact->type,
            'type_label' => $contact->typeLabel(),
            'name' => $contact->name,
            'email' => $contact->email,
            'mobile' => $contact->mobile,
            'title' => $contact->title,
            'remark' => $contact->remark,
            'sort_order' => $contact->sort_order,
        ])->values()->all();

        return [
            'id' => $client->id,
            'name' => $client->name,
            'abn' => $client->abn,
            'office_phone' => $client->office_phone,
            'website' => $client->website,
            'address' => $client->address,
            'city' => $client->city,
            'state' => $client->state,
            'post_code' => $client->post_code,
            'country' => $client->country,
            'status' => $client->status,
            'is_default' => (bool) $client->is_default,
            'contacts' => $contacts,
            'main_contact' => collect($contacts)->firstWhere('type', ClientContact::TYPE_MAIN),
            'account_contact' => collect($contacts)->firstWhere('type', ClientContact::TYPE_ACCOUNT),
            'additional_contacts' => collect($contacts)
                ->where('type', ClientContact::TYPE_ADDITIONAL)
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array{name: ?string, email: ?string, mobile: ?string, title: ?string, remark: ?string}
     */
    private function validateContact(Request $request, string $type): array
    {
        return $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'remark' => ['nullable', 'string', 'max:255'],
            'type' => [
                'sometimes',
                Rule::in([$type]),
            ],
        ]);
    }

    /**
     * @return array{0: string, 1: int}
     */
    private function resolveListFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 10;
        }

        return [$search, $perPage];
    }
}
