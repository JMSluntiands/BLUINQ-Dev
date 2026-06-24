<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Permission;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
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
        'email',
        'company_name',
        'employee_number',
        'job_title',
        'birthday',
        'personal_details',
        'personal_file_url',
        'claims_excel_url',
        'achievements_milestones',
        'leave_credits',
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
            'leave_credits' => 'integer',
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

    public function badgeInitials(): string
    {
        $name = trim($this->name);

        if ($name === '') {
            return '?';
        }

        $parts = preg_split('/\s+/', $name) ?: [];

        if (count($parts) >= 2) {
            return mb_strtoupper(
                mb_substr($parts[0], 0, 1).mb_substr($parts[count($parts) - 1], 0, 1),
            );
        }

        return mb_strtoupper(mb_substr($name, 0, min(2, mb_strlen($name))));
    }

    /**
     * Public URL for the stored profile image (disk: public), or null.
     */
    protected function profileImageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->profile_image) {
                return null;
            }

            $relativePath = str_replace('/', DIRECTORY_SEPARATOR, $this->profile_image);
            $publicPath = public_path('storage'.DIRECTORY_SEPARATOR.$relativePath);

            if (is_file($publicPath)) {
                return Storage::disk('public')->url($this->profile_image);
            }

            $storedPath = storage_path('app/public/'.$relativePath);
            if (is_file($storedPath)) {
                return route('profile.image', $this->id);
            }

            return null;
        });
    }
}
