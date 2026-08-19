<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestAccountEntry extends Model
{
    public const KIND_QUOTE = 'quote';

    public const KIND_INVOICE = 'invoice';

    public const QUOTE_STATUS_FOR_QUOTE = 'For Quote';

    public const QUOTE_STATUS_SENT = 'Quote Sent';

    public const QUOTE_STATUS_ACCEPTED = 'Quote Accepted';

    public const QUOTE_STATUS_DECLINED = 'Declined';

    public const QUOTE_STATUS_REVISED = 'Revised';

    public const INVOICE_STATUS_INVOICED = 'Invoiced';

    public const INVOICE_STATUS_PAID = 'Paid';

    public const INVOICE_STATUS_OVERDUE = 'Overdue';

    /** @deprecated Legacy stored values */
    public const LEGACY_QUOTE_STATUS_FOR_QUOTE = 'FOR QUOTE';

    public const LEGACY_QUOTE_STATUS_SENT = 'QUOTE SENT';

    public const LEGACY_QUOTE_STATUS_ACCEPTED = 'ACCEPTED';

    public const LEGACY_QUOTE_STATUS_DECLINED = 'DECLINED';

    public const LEGACY_QUOTE_STATUS_REVISED = 'REVISED';

    public const LEGACY_INVOICE_STATUS_INVOICED = 'INVOICED';

    public const LEGACY_INVOICE_STATUS_PAID = 'PAID';

    public const LEGACY_INVOICE_STATUS_OVERDUE = 'OVERDUE';

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
     * Status (Accounts) from workflow_statuses — full list for both quote & invoice UI.
     *
     * @return list<string>
     */
    public static function accountStatusOptions(): array
    {
        $fromDb = WorkflowStatus::namesForKind(WorkflowStatus::KIND_ACCOUNTS);

        if ($fromDb !== []) {
            return $fromDb;
        }

        return [
            self::QUOTE_STATUS_FOR_QUOTE,
            self::QUOTE_STATUS_SENT,
            self::QUOTE_STATUS_ACCEPTED,
            self::QUOTE_STATUS_DECLINED,
            self::QUOTE_STATUS_REVISED,
            self::INVOICE_STATUS_INVOICED,
            self::INVOICE_STATUS_PAID,
            self::INVOICE_STATUS_OVERDUE,
        ];
    }

    /**
     * @return list<string>
     */
    public static function quoteStatusOptions(): array
    {
        return self::accountStatusOptions();
    }

    /**
     * @return list<string>
     */
    public static function invoiceStatusOptions(): array
    {
        return self::accountStatusOptions();
    }

    /**
     * Map submitted or legacy status to the canonical workflow name.
     */
    public static function normalizeStatus(string $status): string
    {
        $trimmed = trim($status);

        if ($trimmed === '') {
            return $trimmed;
        }

        $upper = mb_strtoupper($trimmed);

        $legacyMap = [
            self::LEGACY_QUOTE_STATUS_FOR_QUOTE => self::QUOTE_STATUS_FOR_QUOTE,
            self::LEGACY_QUOTE_STATUS_SENT => self::QUOTE_STATUS_SENT,
            self::LEGACY_QUOTE_STATUS_ACCEPTED => self::QUOTE_STATUS_ACCEPTED,
            self::LEGACY_QUOTE_STATUS_DECLINED => self::QUOTE_STATUS_DECLINED,
            self::LEGACY_QUOTE_STATUS_REVISED => self::QUOTE_STATUS_REVISED,
            self::LEGACY_INVOICE_STATUS_INVOICED => self::INVOICE_STATUS_INVOICED,
            self::LEGACY_INVOICE_STATUS_PAID => self::INVOICE_STATUS_PAID,
            self::LEGACY_INVOICE_STATUS_OVERDUE => self::INVOICE_STATUS_OVERDUE,
        ];

        if (isset($legacyMap[$upper])) {
            return $legacyMap[$upper];
        }

        foreach (self::accountStatusOptions() as $option) {
            if (mb_strtoupper($option) === $upper) {
                return $option;
            }
        }

        return $trimmed;
    }

    /**
     * Accepted values for validation (DB list + legacy uppercase).
     *
     * @return list<string>
     */
    public static function statusOptionsFor(string $kind): array
    {
        return [
            ...self::accountStatusOptions(),
            self::LEGACY_QUOTE_STATUS_FOR_QUOTE,
            self::LEGACY_QUOTE_STATUS_SENT,
            self::LEGACY_QUOTE_STATUS_ACCEPTED,
            self::LEGACY_QUOTE_STATUS_DECLINED,
            self::LEGACY_QUOTE_STATUS_REVISED,
            self::LEGACY_INVOICE_STATUS_INVOICED,
            self::LEGACY_INVOICE_STATUS_PAID,
            self::LEGACY_INVOICE_STATUS_OVERDUE,
        ];
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
