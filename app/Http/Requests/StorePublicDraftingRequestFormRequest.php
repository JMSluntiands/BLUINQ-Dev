<?php

namespace App\Http\Requests;

class StorePublicDraftingRequestFormRequest extends StoreDraftingRequestFormRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
