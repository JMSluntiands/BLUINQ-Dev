<?php

namespace App\Support;

use App\Models\Client;
use App\Models\ClientContact;
use Illuminate\Support\Collection;

final class ClientFormOptions
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public static function forForms(?int $includeClientId = null): Collection
    {
        $clients = Client::query()
            ->selectable()
            ->with(['contacts' => function ($query) {
                $query->orderByRaw("CASE type WHEN 'main' THEN 0 WHEN 'account' THEN 1 ELSE 2 END")
                    ->orderBy('sort_order')
                    ->orderBy('id');
            }])
            ->orderBy('name')
            ->get();

        if ($includeClientId !== null) {
            $extra = Client::query()
                ->active()
                ->with('contacts')
                ->whereKey($includeClientId)
                ->first();

            if ($extra !== null && ! $clients->contains('id', $extra->id)) {
                $extra->ensureCoreContacts();
                $extra->load('contacts');
                $clients = $clients->prepend($extra)->values();
            }
        }

        return $clients->map(fn (Client $client) => self::formatClient($client))->values();
    }

    /**
     * @return array<string, mixed>
     */
    public static function formatClient(Client $client): array
    {
        $contacts = $client->contacts
            ->map(fn (ClientContact $contact) => [
                'id' => $contact->id,
                'type' => $contact->type,
                'type_label' => $contact->typeLabel(),
                'name' => $contact->name,
                'email' => $contact->email,
                'mobile' => $contact->mobile,
                'label' => trim(
                    ($contact->typeLabel()).
                    ($contact->name ? ' — '.$contact->name : ''),
                ),
            ])
            ->values()
            ->all();

        return [
            'id' => $client->id,
            'name' => $client->name,
            'contacts' => $contacts,
        ];
    }
}
