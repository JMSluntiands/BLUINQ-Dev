<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            if (! Schema::hasColumn('clients', 'abn')) {
                $table->string('abn')->nullable()->after('name');
            }
            if (! Schema::hasColumn('clients', 'office_phone')) {
                $table->string('office_phone')->nullable()->after('abn');
            }
            if (! Schema::hasColumn('clients', 'website')) {
                $table->string('website')->nullable()->after('office_phone');
            }
            if (! Schema::hasColumn('clients', 'address')) {
                $table->string('address')->nullable()->after('website');
            }
            if (! Schema::hasColumn('clients', 'city')) {
                $table->string('city')->nullable()->after('address');
            }
            if (! Schema::hasColumn('clients', 'state')) {
                $table->string('state')->nullable()->after('city');
            }
            if (! Schema::hasColumn('clients', 'post_code')) {
                $table->string('post_code', 32)->nullable()->after('state');
            }
            if (! Schema::hasColumn('clients', 'country')) {
                $table->string('country')->nullable()->after('post_code');
            }
            if (! Schema::hasColumn('clients', 'is_default')) {
                $table->boolean('is_default')->default(false)->after('status');
            }
        });

        if (Schema::hasColumn('clients', 'phone') && Schema::hasColumn('clients', 'office_phone')) {
            DB::table('clients')
                ->whereNull('office_phone')
                ->whereNotNull('phone')
                ->update([
                    'office_phone' => DB::raw('phone'),
                ]);
        }

        if (! Schema::hasTable('client_contacts')) {
            Schema::create('client_contacts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('client_id')->constrained()->cascadeOnDelete();
                $table->string('type', 32);
                $table->string('name')->nullable();
                $table->string('email')->nullable();
                $table->string('mobile')->nullable();
                $table->string('title')->nullable();
                $table->string('remark')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['client_id', 'type']);
            });
        }

        if (Schema::hasTable('client_contacts') && Schema::hasColumn('clients', 'contact_name')) {
            $clients = DB::table('clients')->select([
                'id',
                'contact_name',
                'email',
                'phone',
            ])->get();

            $now = now();
            foreach ($clients as $client) {
                $existsMain = DB::table('client_contacts')
                    ->where('client_id', $client->id)
                    ->where('type', 'main')
                    ->exists();

                if (! $existsMain) {
                    DB::table('client_contacts')->insert([
                        'client_id' => $client->id,
                        'type' => 'main',
                        'name' => $client->contact_name,
                        'email' => $client->email,
                        'mobile' => $client->phone,
                        'title' => null,
                        'remark' => null,
                        'sort_order' => 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                $existsAccount = DB::table('client_contacts')
                    ->where('client_id', $client->id)
                    ->where('type', 'account')
                    ->exists();

                if (! $existsAccount) {
                    DB::table('client_contacts')->insert([
                        'client_id' => $client->id,
                        'type' => 'account',
                        'name' => null,
                        'email' => null,
                        'mobile' => null,
                        'title' => null,
                        'remark' => null,
                        'sort_order' => 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }

        Schema::table('clients', function (Blueprint $table) {
            if (Schema::hasColumn('clients', 'contact_name')) {
                $table->dropColumn('contact_name');
            }
            if (Schema::hasColumn('clients', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('clients', 'phone')) {
                $table->dropColumn('phone');
            }
        });

        if (Schema::hasTable('drafting_requests') && ! Schema::hasColumn('drafting_requests', 'client_contact_id')) {
            Schema::table('drafting_requests', function (Blueprint $table) {
                $table->foreignId('client_contact_id')
                    ->nullable()
                    ->after('client_id')
                    ->constrained('client_contacts')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('drafting_requests', 'client_contact_id')) {
            Schema::table('drafting_requests', function (Blueprint $table) {
                $table->dropConstrainedForeignId('client_contact_id');
            });
        }

        Schema::table('clients', function (Blueprint $table) {
            if (! Schema::hasColumn('clients', 'contact_name')) {
                $table->string('contact_name')->nullable()->after('name');
            }
            if (! Schema::hasColumn('clients', 'email')) {
                $table->string('email')->nullable()->after('contact_name');
            }
            if (! Schema::hasColumn('clients', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
        });

        if (Schema::hasTable('client_contacts')) {
            $mains = DB::table('client_contacts')->where('type', 'main')->get();
            foreach ($mains as $contact) {
                DB::table('clients')->where('id', $contact->client_id)->update([
                    'contact_name' => $contact->name,
                    'email' => $contact->email,
                    'phone' => $contact->mobile,
                ]);
            }
            Schema::dropIfExists('client_contacts');
        }

        Schema::table('clients', function (Blueprint $table) {
            foreach ([
                'abn',
                'office_phone',
                'website',
                'address',
                'city',
                'state',
                'post_code',
                'country',
                'is_default',
            ] as $column) {
                if (Schema::hasColumn('clients', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
