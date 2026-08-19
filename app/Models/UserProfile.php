<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'gender',
        'nationality',
        'religion',
        'marital_status',
        'residential_unit_street',
        'residential_barangay',
        'residential_city',
        'residential_state',
        'residential_region',
        'residential_country',
        'residential_postcode',
        'mobile_number',
        'personal_email',
        'hometown_unit_street',
        'hometown_barangay',
        'hometown_city',
        'hometown_state',
        'hometown_region',
        'hometown_country',
        'hometown_postcode',
        'sss_number',
        'pagibig_number',
        'philhealth_number',
        'hmo_number',
        'tin_number',
        'tax_code',
        'bank_name',
        'bank_account_number',
        'ewallet_account_number',
        'department',
        'branch',
        'emergency_contact_name',
        'emergency_relationship',
        'emergency_contact_number',
        'spouse_name',
        'spouse_nationality',
        'spouse_contact_number',
        'spouse_email',
        'number_of_children',
        'spouse_working',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
