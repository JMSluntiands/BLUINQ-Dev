<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Controllers\ProfileController;
use App\Models\Role;
use App\Models\User;
use App\Services\HolidayService;
use App\Services\LeaveEntitlementService;
use App\Support\StoredUpload;
use App\Support\UserHrProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserAccountController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = User::query()
            ->with('role')
            ->active()
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('position', 'like', '%'.$search.'%')
                    ->orWhereHas('role', function ($roleQuery) use ($search) {
                        $roleQuery->where('name', 'like', '%'.$search.'%')
                            ->orWhere('slug', 'like', '%'.$search.'%');
                    });
            });
        }

        return Inertia::render('Settings/Users/Index', [
            'users' => $query
                ->paginate($perPage)
                ->through(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'position' => $u->position,
                    'role' => $u->role?->slug,
                    'role_name' => $u->role?->name,
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        if ($user->archived_at !== null) {
            abort(404);
        }

        $viewer = $request->user();
        $canViewPrivate = $viewer?->isAdmin() ?? false;

        $listQuery = $this->redirectQuery($request);
        $editUrl = route('settings.users.edit', $user);
        if ($listQuery !== []) {
            $editUrl .= '?'.http_build_query($listQuery);
        }

        return Inertia::render('Profile/Edit', [
            'profile' => ProfileController::payload($user, $canViewPrivate),
            'canViewPrivate' => $canViewPrivate,
            'mustVerifyEmail' => false,
            'status' => null,
            'backUrl' => route('settings.users.index', $listQuery),
            'editAccountUrl' => $editUrl,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Settings/Users/Create', [
            'roles' => $this->roleOptions(),
            'employmentStatuses' => config('leave.employment_statuses', []),
            'holidayRegions' => HolidayService::regionOptions(),
            'hrProfileOptions' => UserHrProfile::options(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'initials' => ['nullable', 'string', 'max:10', 'regex:/^[A-Za-z0-9.\- ]*$/'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:'.User::class.',email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role_id' => ['required', Rule::exists('roles', 'id')],
            'position' => ['nullable', 'string', 'max:255'],
            'birthday' => ['nullable', 'date'],
            'date_hired' => ['nullable', 'date'],
            'employment_status' => ['required', Rule::in(['regular', 'probationary', 'training'])],
            'holiday_region' => ['nullable', Rule::in(HolidayService::regionKeys())],
            'personal_details' => ['nullable', 'string', 'max:5000'],
            'claims_excel_url' => ['nullable', 'url', 'max:2048'],
            'personal_file_url' => ['nullable', 'url', 'max:2048'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
            ...UserHrProfile::rules(),
        ]);

        $initials = trim((string) ($validated['initials'] ?? ''));

        $user = User::query()->create([
            'name' => $validated['name'],
            'initials' => $initials === '' ? null : mb_strtoupper($initials),
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role_id' => (int) $validated['role_id'],
            'position' => $validated['position'] ?? null,
            'birthday' => $validated['birthday'] ?? null,
            'date_hired' => $validated['date_hired'] ?? null,
            'employment_status' => $validated['employment_status'],
            'holiday_region' => $validated['holiday_region'] ?? null,
            'personal_details' => $validated['personal_details'] ?? null,
            'claims_excel_url' => $validated['claims_excel_url'] ?? null,
            'personal_file_url' => $validated['personal_file_url'] ?? null,
            'leave_credits' => 0,
            'al_credits' => 0,
            'sl_credits' => $validated['employment_status'] === 'regular'
                ? (int) config('leave.sl.annual_days', 15)
                : 0,
            'leave_balance_year' => (int) now()->year,
        ]);

        $user->profile()->create(UserHrProfile::extract($validated));

        if ($request->hasFile('profile_image')) {
            $user->profile_image = StoredUpload::store(
                $request->file('profile_image'),
                'profile-images',
            );
            $user->save();
        }

        if ($validated['employment_status'] === 'regular') {
            app(LeaveEntitlementService::class)->accrueMonthlyAl($user);
        }

        return redirect()
            ->route('settings.users.index', $this->redirectQuery($request))
            ->with('status', 'user-created');
    }

    public function edit(Request $request, User $user): Response
    {
        if ($user->archived_at !== null) {
            abort(404);
        }

        $user->load(['role', 'profile']);

        return Inertia::render('Settings/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'initials' => $user->initials,
                'email' => $user->email,
                'position' => $user->position,
                'birthday' => $user->birthday?->format('Y-m-d'),
                'date_hired' => $user->date_hired?->format('Y-m-d'),
                'employment_status' => $user->employment_status ?? 'regular',
                'holiday_region' => $user->holiday_region,
                'personal_details' => $user->personal_details,
                'claims_excel_url' => $user->claims_excel_url,
                'personal_file_url' => $user->personal_file_url,
                'role' => $user->role?->slug,
                'role_id' => $user->role_id,
                'profile_image_url' => $user->profile_image_url,
                ...UserHrProfile::formDefaults($user->profile),
            ],
            'roles' => $this->roleOptions(),
            'employmentStatuses' => config('leave.employment_statuses', []),
            'holidayRegions' => HolidayService::regionOptions(),
            'hrProfileOptions' => UserHrProfile::options(),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        if ($user->archived_at !== null) {
            abort(404);
        }

        $user->load('role');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'initials' => ['nullable', 'string', 'max:10', 'regex:/^[A-Za-z0-9.\- ]*$/'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role_id' => ['required', Rule::exists('roles', 'id')],
            'position' => ['nullable', 'string', 'max:255'],
            'birthday' => ['nullable', 'date'],
            'date_hired' => ['nullable', 'date'],
            'employment_status' => ['required', Rule::in(['regular', 'probationary', 'training'])],
            'holiday_region' => ['nullable', Rule::in(HolidayService::regionKeys())],
            'personal_details' => ['nullable', 'string', 'max:5000'],
            'claims_excel_url' => ['nullable', 'url', 'max:2048'],
            'personal_file_url' => ['nullable', 'url', 'max:2048'],
            'profile_image' => ['nullable', 'image', 'max:5120'],
            ...UserHrProfile::rules(),
        ]);

        $newRole = Role::query()->findOrFail((int) $validated['role_id']);

        if ($user->isAdmin() && $newRole->slug === 'user') {
            $otherActiveAdmins = User::query()
                ->active()
                ->whereHas('role', fn ($q) => $q->where('slug', 'admin'))
                ->where('id', '!=', $user->id)
                ->count();
            if ($otherActiveAdmins < 1) {
                return back()->withErrors([
                    'role_id' => 'At least one active administrator is required.',
                ])->onlyInput('role_id');
            }
        }

        $initials = trim((string) ($validated['initials'] ?? ''));
        $user->name = $validated['name'];
        $user->initials = $initials === '' ? null : mb_strtoupper($initials);
        $user->email = $validated['email'];
        $user->role_id = (int) $validated['role_id'];
        $user->position = $validated['position'] ?? null;
        $user->birthday = $validated['birthday'] ?? null;
        $user->date_hired = $validated['date_hired'] ?? null;
        $user->employment_status = $validated['employment_status'];
        $user->holiday_region = $validated['holiday_region'] ?? null;
        $user->personal_details = $validated['personal_details'] ?? null;
        $user->claims_excel_url = $validated['claims_excel_url'] ?? null;
        $user->personal_file_url = $validated['personal_file_url'] ?? null;

        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        if ($request->hasFile('profile_image')) {
            StoredUpload::delete($user->profile_image);
            $user->profile_image = StoredUpload::store(
                $request->file('profile_image'),
                'profile-images',
            );
        }

        $user->save();

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            UserHrProfile::extract($validated),
        );

        return redirect()
            ->route('settings.users.index', $this->redirectQuery($request))
            ->with('status', 'user-updated');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->archived_at !== null) {
            return redirect()
                ->route('settings.users.archive', $this->redirectQuery($request))
                ->with('status', 'user-already-archived');
        }

        if ($request->user()?->id === $user->id) {
            return redirect()
                ->route('settings.users.index', $this->redirectQuery($request))
                ->with('status', 'user-cannot-archive-self');
        }

        $user->load('role');

        if ($user->isAdmin()) {
            $otherActiveAdmins = User::query()
                ->active()
                ->whereHas('role', fn ($q) => $q->where('slug', 'admin'))
                ->where('id', '!=', $user->id)
                ->count();
            if ($otherActiveAdmins < 1) {
                return redirect()
                    ->route('settings.users.index', $this->redirectQuery($request))
                    ->with('status', 'user-last-admin');
            }
        }

        $validated = $request->validate([
            'last_day' => ['required', 'date'],
        ]);

        $user->forceFill([
            'last_day' => $validated['last_day'],
            'archived_at' => now(),
        ])->save();

        return redirect()
            ->route('settings.users.index', $this->redirectQuery($request))
            ->with('status', 'user-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = User::query()
            ->with('role')
            ->archived()
            ->whereHas('role', fn ($q) => $q->where('slug', '!=', 'admin'))
            ->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('position', 'like', '%'.$search.'%')
                    ->orWhereHas('role', function ($roleQuery) use ($search) {
                        $roleQuery->where('name', 'like', '%'.$search.'%')
                            ->orWhere('slug', 'like', '%'.$search.'%');
                    });
            });
        }

        return Inertia::render('Settings/Users/Archive', [
            'users' => $query
                ->paginate($perPage)
                ->through(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'position' => $u->position,
                    'role' => $u->role?->slug,
                    'role_name' => $u->role?->name,
                    'last_day' => $u->last_day?->format('Y-m-d'),
                    'archived_at' => $u->archived_at?->toIso8601String(),
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, User $user): RedirectResponse
    {
        if ($user->archived_at === null) {
            return redirect()
                ->route('settings.users.index', $this->redirectQuery($request))
                ->with('status', 'user-not-archived');
        }

        $user->forceFill([
            'archived_at' => null,
            'last_day' => null,
        ])->save();

        return redirect()
            ->route('settings.users.archive', $this->redirectQuery($request))
            ->with('status', 'user-restored');
    }

    /**
     * @return list<array{id: int, name: string, slug: string}>
     */
    private function roleOptions(): array
    {
        return Role::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Role $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'slug' => $r->slug,
            ])
            ->values()
            ->all();
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

    /**
     * @return array<string, int|string>
     */
    private function redirectQuery(Request $request): array
    {
        $out = [];
        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $out['search'] = Str::limit($search, 255);
        }
        if ($request->filled('per_page')) {
            $p = (int) $request->input('per_page');
            if ($p >= 5 && $p <= 50) {
                $out['per_page'] = $p;
            }
        }

        return $out;
    }
}
