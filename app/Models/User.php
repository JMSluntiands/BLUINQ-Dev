<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\StoredUpload;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'initials',
        'email',
        'company_name',
        'employee_number',
        'job_title',
        'position',
        'date_hired',
        'employment_status',
        'birthday',
        'personal_details',
        'personal_file_url',
        'claims_excel_url',
        'achievements_milestones',
        'leave_credits',
        'al_credits',
        'al_carried_over',
        'al_carry_expires_on',
        'sl_credits',
        'medical_days_used',
        'leave_balance_year',
        'al_last_accrual_month',
        'password',
        'role_id',
        'profile_image',
        'archived_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'role_id',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'profile_image_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'archived_at' => 'datetime',
            'birthday' => 'date',
            'date_hired' => 'date',
            'leave_credits' => 'integer',
            'al_credits' => 'integer',
            'al_carried_over' => 'integer',
            'al_carry_expires_on' => 'date',
            'sl_credits' => 'integer',
            'medical_days_used' => 'integer',
            'leave_balance_year' => 'integer',
        ];
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * @return HasMany<UserMilestone, $this>
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(UserMilestone::class)->orderByDesc('milestone_date');
    }

    public function isAdmin(): bool
    {
        return $this->role?->slug === 'admin';
    }

    public function hasPermission(string $slug): bool
    {
        if ($this->role === null) {
            return false;
        }

        return in_array($slug, Permission::slugsForRole($this->role->slug), true);
    }

    public function canManageDraftingMemoTags(): bool
    {
        return $this->isAdmin() || $this->role?->slug === 'project-manager';
    }

    public function canManageDesignMemoTags(): bool
    {
        return $this->canManageDraftingMemoTags();
    }

    public function badgeInitials(): string
    {
        if (! array_key_exists('initials', $this->attributes)) {
            $this->attributes['initials'] = static::query()
                ->whereKey($this->getKey())
                ->value('initials');
        }

        $custom = trim((string) ($this->attributes['initials'] ?? ''));

        if ($custom !== '') {
            return mb_strtoupper($custom);
        }

        $name = trim((string) $this->name);

        if ($name === '') {
            return '?';
        }

        $parts = preg_split('/\s+/', $name) ?: [];

        if (count($parts) >= 2) {
            return mb_strtoupper(
                mb_substr($parts[0], 0, 1).mb_substr($parts[count($parts) - 1], 0, 1),
            );
        }

        return mb_strtoupper(mb_substr($name, 0, min(3, mb_strlen($name))));
    }

    /**
     * Keep revision drafter/checker snapshots aligned with this user's badge.
     */
    public function syncLinkedDraftingInitials(): void
    {
        $badge = $this->badgeInitials();

        DraftingRequestRevision::query()
            ->where('drafter_user_id', $this->id)
            ->update(['drafter_initials' => $badge]);

        DraftingRequestRevision::query()
            ->where('checker_user_id', $this->id)
            ->update(['checker_initials' => $badge]);
    }

    protected static function booted(): void
    {
        static::saved(function (User $user): void {
            if (! $user->wasChanged(['initials', 'name'])) {
                return;
            }

            $user->syncLinkedDraftingInitials();
        });
    }

    /**
     * App URL for the stored profile image (storage/ only), or null.
     */
    protected function profileImageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! StoredUpload::exists($this->profile_image)) {
                return null;
            }

            return route('profile.image', [
                'user' => $this->id,
                'v' => StoredUpload::mtime($this->profile_image) ?? time(),
            ]);
        });
    }
}
