-- =============================================================================
-- Bluinq LIVE — drafting schema updates (2026-06-29)
-- Run ONCE. Backup the database before executing.
-- MySQL / MariaDB
-- =============================================================================

START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 1) drafting_requests.zoning
-- -----------------------------------------------------------------------------
ALTER TABLE `drafting_requests`
    ADD COLUMN `zoning` VARCHAR(255) NULL AFTER `building_type_id`;

-- -----------------------------------------------------------------------------
-- 2) drafting_request_revisions.status, area_size
-- -----------------------------------------------------------------------------
ALTER TABLE `drafting_request_revisions`
    ADD COLUMN `status` VARCHAR(64) NULL AFTER `hours`,
    ADD COLUMN `area_size` VARCHAR(64) NULL AFTER `status`;

-- -----------------------------------------------------------------------------
-- 3) drafting_requests — map legacy status values
-- -----------------------------------------------------------------------------
UPDATE `drafting_requests` SET `status` = 'new'       WHERE `status` IN ('allocated', 'pending');
UPDATE `drafting_requests` SET `status` = 'wip'       WHERE `status` = 'in_progress';
UPDATE `drafting_requests` SET `status` = 'submitted' WHERE `status` = 'completed';

-- -----------------------------------------------------------------------------
-- 4) drafting_request_revisions — normalize status slugs
-- -----------------------------------------------------------------------------
UPDATE `drafting_request_revisions`
SET `status` = CASE UPPER(TRIM(`status`))
    WHEN 'NEW' THEN 'new'
    WHEN 'ASSIGNED' THEN 'assigned'
    WHEN 'WIP' THEN 'wip'
    WHEN 'IN_PROGRESS' THEN 'wip'
    WHEN 'IN PROGRESS' THEN 'wip'
    WHEN 'FOR_CHECKING' THEN 'for_checking'
    WHEN 'FOR CHECKING' THEN 'for_checking'
    WHEN 'SUBMITTED' THEN 'submitted'
    WHEN 'ON_HOLD' THEN 'on_hold'
    WHEN 'ON HOLD' THEN 'on_hold'
    WHEN 'CANCELLED' THEN 'cancelled'
    WHEN 'FOR_QUOTE' THEN 'for_quote'
    WHEN 'FOR QUOTE' THEN 'for_quote'
    WHEN 'QUOTE_SENT' THEN 'quote_sent'
    WHEN 'QUOTE SENT' THEN 'quote_sent'
    WHEN 'INVOICED' THEN 'invoiced'
    WHEN 'PAID' THEN 'paid'
    WHEN 'ALLOCATED' THEN 'new'
    WHEN 'PENDING' THEN 'new'
    WHEN 'COMPLETED' THEN 'submitted'
    ELSE LOWER(REPLACE(TRIM(`status`), ' ', '_'))
END
WHERE `status` IS NOT NULL AND TRIM(`status`) <> '';

-- -----------------------------------------------------------------------------
-- 5) drafting_request_revisions — split hours into drafting / checking
-- -----------------------------------------------------------------------------
ALTER TABLE `drafting_request_revisions`
    ADD COLUMN `drafting_hours` DECIMAL(8, 2) NULL AFTER `drafter_initials`,
    ADD COLUMN `checking_hours` DECIMAL(8, 2) NULL AFTER `drafting_hours`;

UPDATE `drafting_request_revisions`
SET `drafting_hours` = `hours`
WHERE `hours` IS NOT NULL;

ALTER TABLE `drafting_request_revisions`
    DROP COLUMN `hours`;

-- -----------------------------------------------------------------------------
-- 6) drafting_request_revisions — wider category (CRM category names)
-- -----------------------------------------------------------------------------
ALTER TABLE `drafting_request_revisions`
    MODIFY COLUMN `category` VARCHAR(255) NOT NULL;

-- -----------------------------------------------------------------------------
-- 7) Record Laravel migrations (skip if you will run php artisan migrate instead)
-- -----------------------------------------------------------------------------
SET @batch = (SELECT COALESCE(MAX(`batch`), 0) + 1 FROM `migrations`);

INSERT INTO `migrations` (`migration`, `batch`) VALUES
    ('2026_06_29_100000_add_zoning_to_drafting_requests_table', @batch),
    ('2026_06_29_110000_add_status_and_area_size_to_drafting_request_revisions_table', @batch),
    ('2026_06_29_120000_migrate_drafting_request_statuses', @batch),
    ('2026_06_29_130000_replace_hours_on_drafting_request_revisions', @batch),
    ('2026_06_29_140000_widen_category_on_drafting_request_revisions', @batch);

COMMIT;
