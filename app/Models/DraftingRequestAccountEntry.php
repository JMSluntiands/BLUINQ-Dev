<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestAccountEntry extends Model
{
    public const KIND_QUOTE = 'quote';

    public const KIND_INVOICE = 'invoice';

    public const QUOTE_STATUS_SENT = 'QUOTE SENT';

    public const QUOTE_STATUS_DECLINED = 'DECLINED';

    public const QUOTE_STATUS_ACCEPTED = 'ACCEPTED';

    public const QUOTE_STATUS_REVISED = 'REVISED';

    public const INVOICE_STATUS_INVOICED = 'INVOICED';

    public const INVOICE_STATUS_PAID = 'PAID';

    protected $fillable = [
        'drafting_request_id',
        'user_id',
        'kind',
        'number',
        'category',
        'rate',
        'status',
    ];

    /**
     * @return list<string>
     */
    public static function quoteStatusOptions(): array
    {
        return [
            self::QUOTE_STATUS_SENT,
            self::QUOTE_STATUS_DECLINED,
            self::QUOTE_STATUS_ACCEPTED,
            self::QUOTE_STATUS_REVISED,
        ];
    }

    /**
     * @return list<string>
     */
    public static function invoiceStatusOptions(): array
    {
        return [
            self::INVOICE_STATUS_INVOICED,
            self::INVOICE_STATUS_PAID,
        ];
    }

    /**
     * @return list<string>
     */
    public static function statusOptionsFor(string $kind): array
    {
        return $kind === self::KIND_INVOICE
            ? self::invoiceStatusOptions()
            : self::quoteStatusOptions();
    }

    /**
     * @return BelongsTo<DraftingRequest, $this>
     */
    public function draftingRequest(): BelongsTo
    {
        return $this->belongsTo(DraftingRequest::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
