<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientContact extends Model
{
    public const TYPE_MAIN = 'main';

    public const TYPE_ACCOUNT = 'account';

    public const TYPE_ADDITIONAL = 'additional';

    /**
     * @var list<string>
     */
    public const TYPES = [
        self::TYPE_MAIN,
        self::TYPE_ACCOUNT,
        self::TYPE_ADDITIONAL,
    ];

    protected $fillable = [
        'client_id',
        'type',
        'name',
        'email',
        'mobile',
        'title',
        'remark',
        'sort_order',
    ];

    /**
     * @return BelongsTo<Client, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            self::TYPE_MAIN => 'Main',
            self::TYPE_ACCOUNT => 'Account',
            self::TYPE_ADDITIONAL => 'Additional',
            default => ucfirst((string) $this->type),
        };
    }
}
