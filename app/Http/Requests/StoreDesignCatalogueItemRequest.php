<?php

namespace App\Http\Requests;

use App\Models\DesignCatalogueItem;
use App\Models\DesignCatalogueTag;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDesignCatalogueItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('design.catalogue.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_name' => ['nullable', 'string', 'max:255'],
            'model_name' => ['required', 'string', 'max:255'],
            'rcode' => ['required', 'string', Rule::in(DesignCatalogueItem::rcodeValues())],
            'area' => ['nullable', 'string', 'max:64'],
            'link_url' => ['nullable', 'url', 'max:2048'],
            'catalogue_date' => ['required', 'date'],
            'frontage_tag_ids' => ['nullable', 'array'],
            'frontage_tag_ids.*' => [
                'integer',
                Rule::exists('design_catalogue_tags', 'id')->where('type', DesignCatalogueTag::TYPE_FRONTAGE),
            ],
            'zoning_tag_ids' => ['nullable', 'array'],
            'zoning_tag_ids.*' => [
                'integer',
                Rule::exists('design_catalogue_tags', 'id')->where('type', DesignCatalogueTag::TYPE_ZONING),
            ],
            'attachment' => ['required', 'file', 'mimes:pdf', 'max:20480'],
        ];
    }

    public function messages(): array
    {
        return [
            'attachment.required' => 'Attach a PDF for this catalogue item.',
        ];
    }
}
