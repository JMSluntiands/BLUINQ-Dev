-- =============================================================================
-- Bluinq LIVE — schema / data from 2026-07-28 → 2026-08-04
-- MySQL / MariaDB — SAFE TO RE-RUN (skips columns/tables/rows that already exist)
-- Backup the database before executing.
-- =============================================================================

-- Helpers (dropped at end)
DROP PROCEDURE IF EXISTS `blu_add_column_if_missing`;
DROP PROCEDURE IF EXISTS `blu_drop_column_if_exists`;
DROP PROCEDURE IF EXISTS `blu_add_fk_if_missing`;
DROP PROCEDURE IF EXISTS `blu_record_migration_if_missing`;

DELIMITER $$

CREATE PROCEDURE `blu_add_column_if_missing`(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE PROCEDURE `blu_drop_column_if_exists`(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64)
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` DROP COLUMN `', p_column, '`');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE PROCEDURE `blu_add_fk_if_missing`(
    IN p_table VARCHAR(64),
    IN p_constraint VARCHAR(64),
    IN p_fk_sql TEXT
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND CONSTRAINT_NAME = p_constraint
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_constraint, '` ', p_fk_sql);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE PROCEDURE `blu_record_migration_if_missing`(
    IN p_migration VARCHAR(255),
    IN p_batch INT
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'migrations'
    ) AND NOT EXISTS (
        SELECT 1 FROM `migrations` WHERE `migration` = p_migration
    ) THEN
        INSERT INTO `migrations` (`migration`, `batch`) VALUES (p_migration, p_batch);
    END IF;
END$$

DELIMITER ;

START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 1) drafting_request_crm_category (2026_07_28_120000)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `drafting_request_crm_category` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `drafting_request_id` BIGINT UNSIGNED NOT NULL,
    `crm_category_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `drf_crm_category_unique` (`drafting_request_id`, `crm_category_id`),
    CONSTRAINT `drafting_request_crm_category_drafting_request_id_foreign`
        FOREIGN KEY (`drafting_request_id`) REFERENCES `drafting_requests` (`id`) ON DELETE CASCADE,
    CONSTRAINT `drafting_request_crm_category_crm_category_id_foreign`
        FOREIGN KEY (`crm_category_id`) REFERENCES `crm_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copy legacy single crm_category_id into pivot (if column still exists)
SET @has_crm_category_id = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'drafting_requests'
      AND COLUMN_NAME = 'crm_category_id'
);
SET @sql = IF(
    @has_crm_category_id > 0,
    'INSERT IGNORE INTO `drafting_request_crm_category` (`drafting_request_id`, `crm_category_id`)
     SELECT `id`, `crm_category_id` FROM `drafting_requests` WHERE `crm_category_id` IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 2) drafting_requests.vo_hours (2026_07_29_081000)
-- -----------------------------------------------------------------------------
CALL blu_add_column_if_missing(
    'drafting_requests',
    'vo_hours',
    '`vo_hours` DECIMAL(8,2) NULL AFTER `is_priority`'
);

-- -----------------------------------------------------------------------------
-- 3) drafting_request_revisions.link (2026_07_29_084500)
-- -----------------------------------------------------------------------------
CALL blu_add_column_if_missing(
    'drafting_request_revisions',
    'link',
    '`link` VARCHAR(2048) NULL AFTER `code`'
);

-- -----------------------------------------------------------------------------
-- 4) drafting_request_comments.drafting_request_revision_id (2026_07_29_085000)
-- -----------------------------------------------------------------------------
CALL blu_add_column_if_missing(
    'drafting_request_comments',
    'drafting_request_revision_id',
    '`drafting_request_revision_id` BIGINT UNSIGNED NULL AFTER `drafting_request_id`'
);

CALL blu_add_fk_if_missing(
    'drafting_request_comments',
    'drafting_request_comments_drafting_request_revision_id_foreign',
    'FOREIGN KEY (`drafting_request_revision_id`) REFERENCES `drafting_request_revisions` (`id`) ON DELETE SET NULL'
);

-- -----------------------------------------------------------------------------
-- 5) announcement_likes (2026_07_30_070000)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcement_likes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `announcement_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `announcement_likes_announcement_id_user_id_unique` (`announcement_id`, `user_id`),
    CONSTRAINT `announcement_likes_announcement_id_foreign`
        FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
    CONSTRAINT `announcement_likes_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6) clients expand + client_contacts (2026_07_30_080000)
-- -----------------------------------------------------------------------------
CALL blu_add_column_if_missing('clients', 'abn', '`abn` VARCHAR(255) NULL AFTER `name`');
CALL blu_add_column_if_missing('clients', 'office_phone', '`office_phone` VARCHAR(255) NULL AFTER `abn`');
CALL blu_add_column_if_missing('clients', 'website', '`website` VARCHAR(255) NULL AFTER `office_phone`');
CALL blu_add_column_if_missing('clients', 'address', '`address` VARCHAR(255) NULL AFTER `website`');
CALL blu_add_column_if_missing('clients', 'city', '`city` VARCHAR(255) NULL AFTER `address`');
CALL blu_add_column_if_missing('clients', 'state', '`state` VARCHAR(255) NULL AFTER `city`');
CALL blu_add_column_if_missing('clients', 'post_code', '`post_code` VARCHAR(32) NULL AFTER `state`');
CALL blu_add_column_if_missing('clients', 'country', '`country` VARCHAR(255) NULL AFTER `post_code`');
CALL blu_add_column_if_missing('clients', 'is_default', '`is_default` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`');

-- Copy legacy phone → office_phone when empty
SET @has_client_phone = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clients'
      AND COLUMN_NAME = 'phone'
);
SET @sql = IF(
    @has_client_phone > 0,
    'UPDATE `clients` SET `office_phone` = `phone` WHERE `office_phone` IS NULL AND `phone` IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `client_contacts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `client_id` BIGINT UNSIGNED NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `name` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `mobile` VARCHAR(255) NULL,
    `title` VARCHAR(255) NULL,
    `remark` VARCHAR(255) NULL,
    `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `client_contacts_client_id_type_index` (`client_id`, `type`),
    CONSTRAINT `client_contacts_client_id_foreign`
        FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed main contact from legacy client columns (only when no main contact yet)
SET @has_legacy_contact = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clients'
      AND COLUMN_NAME = 'contact_name'
);
SET @sql = IF(
    @has_legacy_contact > 0,
    'INSERT INTO `client_contacts`
        (`client_id`, `type`, `name`, `email`, `mobile`, `title`, `remark`, `sort_order`, `created_at`, `updated_at`)
     SELECT c.`id`, ''main'', c.`contact_name`, c.`email`, c.`phone`, NULL, NULL, 0, NOW(), NOW()
     FROM `clients` c
     WHERE NOT EXISTS (
         SELECT 1 FROM `client_contacts` cc
         WHERE cc.`client_id` = c.`id` AND cc.`type` = ''main''
     )',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed empty account contact row per client
INSERT INTO `client_contacts` (
    `client_id`, `type`, `name`, `email`, `mobile`, `title`, `remark`, `sort_order`, `created_at`, `updated_at`
)
SELECT
    c.`id`,
    'account',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NOW(),
    NOW()
FROM `clients` c
WHERE NOT EXISTS (
    SELECT 1 FROM `client_contacts` cc
    WHERE cc.`client_id` = c.`id` AND cc.`type` = 'account'
);

-- Drop legacy client contact columns (only if still present)
CALL blu_drop_column_if_exists('clients', 'contact_name');
CALL blu_drop_column_if_exists('clients', 'email');
CALL blu_drop_column_if_exists('clients', 'phone');

CALL blu_add_column_if_missing(
    'drafting_requests',
    'client_contact_id',
    '`client_contact_id` BIGINT UNSIGNED NULL AFTER `client_id`'
);

CALL blu_add_fk_if_missing(
    'drafting_requests',
    'drafting_requests_client_contact_id_foreign',
    'FOREIGN KEY (`client_contact_id`) REFERENCES `client_contacts` (`id`) ON DELETE SET NULL'
);

-- -----------------------------------------------------------------------------
-- 7) users.initials (2026_07_30_100000)
-- -----------------------------------------------------------------------------
CALL blu_add_column_if_missing(
    'users',
    'initials',
    '`initials` VARCHAR(10) NULL AFTER `name`'
);

-- -----------------------------------------------------------------------------
-- 8) Permissions: dashboard.activity.project (2026_07_30_092000)
-- -----------------------------------------------------------------------------
INSERT INTO `permissions` (`slug`, `name`, `status`, `sort_order`, `created_at`, `updated_at`)
SELECT
    'dashboard.activity.project',
    'Dashboard — Activity project select',
    'active',
    12,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM `permissions` WHERE `slug` = 'dashboard.activity.project'
);

UPDATE `permissions`
SET
    `name` = 'Dashboard — Activity project select',
    `status` = 'active',
    `sort_order` = 12,
    `updated_at` = NOW()
WHERE `slug` = 'dashboard.activity.project';

SET @has_group_key = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions' AND COLUMN_NAME = 'group_key'
);
SET @sql = IF(
    @has_group_key > 0,
    'UPDATE `permissions` SET `group_key` = ''general'', `parent_slug` = ''dashboard.view'' WHERE `slug` = ''dashboard.activity.project''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO `permission_role` (`role`, `permission_id`)
SELECT 'admin', p.`id`
FROM `permissions` p
WHERE p.`slug` = 'dashboard.activity.project';

INSERT IGNORE INTO `permission_role` (`role`, `permission_id`)
SELECT pr.`role`, p.`id`
FROM `permissions` p
JOIN `permissions` jlv ON jlv.`slug` = 'job.list.view'
JOIN `permission_role` pr ON pr.`permission_id` = jlv.`id`
WHERE p.`slug` = 'dashboard.activity.project';

-- -----------------------------------------------------------------------------
-- 9) Permissions: job.list.edit (2026_08_04_100000)
-- -----------------------------------------------------------------------------
INSERT INTO `permissions` (`slug`, `name`, `status`, `sort_order`, `created_at`, `updated_at`)
SELECT
    'job.list.edit',
    'Edit board table',
    'active',
    91,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM `permissions` WHERE `slug` = 'job.list.edit'
);

UPDATE `permissions`
SET
    `name` = 'Edit board table',
    `status` = 'active',
    `sort_order` = 91,
    `updated_at` = NOW()
WHERE `slug` = 'job.list.edit';

SET @sql = IF(
    @has_group_key > 0,
    'UPDATE `permissions` SET `group_key` = ''archi-project'', `parent_slug` = ''job.list.view'' WHERE `slug` = ''job.list.edit''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO `permission_role` (`role`, `permission_id`)
SELECT 'admin', p.`id`
FROM `permissions` p
WHERE p.`slug` = 'job.list.edit';

INSERT IGNORE INTO `permission_role` (`role`, `permission_id`)
SELECT 'project-manager', p.`id`
FROM `permissions` p
WHERE p.`slug` = 'job.list.edit';

INSERT IGNORE INTO `permission_role` (`role`, `permission_id`)
SELECT pr.`role`, p.`id`
FROM `permissions` p
JOIN `permissions` jlv ON jlv.`slug` = 'job.list.view'
JOIN `permission_role` pr ON pr.`permission_id` = jlv.`id`
WHERE p.`slug` = 'job.list.edit';

-- -----------------------------------------------------------------------------
-- 10) Project-manager dashboard perms (2026_07_29_083500)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `permission_role` (`role`, `permission_id`)
SELECT 'project-manager', p.`id`
FROM `permissions` p
WHERE p.`slug` IN ('dashboard.view', 'timesheet.view', 'job.list.view', 'profile.view')
  AND p.`status` = 'active';

-- -----------------------------------------------------------------------------
-- 11) Restore Assigned / On Hold / Query statuses (2026_08_04_100100)
-- -----------------------------------------------------------------------------
SET @has_workflow_statuses = (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'workflow_statuses'
);

SET @sql = IF(
    @has_workflow_statuses > 0,
    'INSERT INTO `workflow_statuses` (`kind`, `code`, `name`, `status`, `archived_at`, `created_at`, `updated_at`)
     SELECT ''archi'', ''assigned'', ''Assigned'', ''active'', NULL, NOW(), NOW()
     FROM DUAL
     WHERE NOT EXISTS (
         SELECT 1 FROM `workflow_statuses`
         WHERE `kind` = ''archi'' AND (`code` = ''assigned'' OR `name` = ''Assigned'')
     )',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    @has_workflow_statuses > 0,
    'UPDATE `workflow_statuses`
     SET `kind` = ''archi'', `code` = ''assigned'', `name` = ''Assigned'',
         `status` = COALESCE(NULLIF(`status`, ''''), ''active''), `archived_at` = NULL, `updated_at` = NOW()
     WHERE `kind` = ''archi'' AND (`code` = ''assigned'' OR `name` = ''Assigned'')',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    @has_workflow_statuses > 0,
    'INSERT INTO `workflow_statuses` (`kind`, `code`, `name`, `status`, `archived_at`, `created_at`, `updated_at`)
     SELECT ''archi'', ''on_hold'', ''On Hold'', ''active'', NULL, NOW(), NOW()
     FROM DUAL
     WHERE NOT EXISTS (
         SELECT 1 FROM `workflow_statuses`
         WHERE `kind` = ''archi'' AND (`code` = ''on_hold'' OR `name` = ''On Hold'')
     )',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    @has_workflow_statuses > 0,
    'UPDATE `workflow_statuses`
     SET `kind` = ''archi'', `code` = ''on_hold'', `name` = ''On Hold'',
         `status` = COALESCE(NULLIF(`status`, ''''), ''active''), `archived_at` = NULL, `updated_at` = NOW()
     WHERE `kind` = ''archi'' AND (`code` = ''on_hold'' OR `name` = ''On Hold'')',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    @has_workflow_statuses > 0,
    'INSERT INTO `workflow_statuses` (`kind`, `code`, `name`, `status`, `archived_at`, `created_at`, `updated_at`)
     SELECT ''archi'', ''query'', ''Query'', ''active'', NULL, NOW(), NOW()
     FROM DUAL
     WHERE NOT EXISTS (
         SELECT 1 FROM `workflow_statuses`
         WHERE `kind` = ''archi'' AND (`code` = ''query'' OR `name` = ''Query'')
     )',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    @has_workflow_statuses > 0,
    'UPDATE `workflow_statuses`
     SET `kind` = ''archi'', `code` = ''query'', `name` = ''Query'',
         `status` = COALESCE(NULLIF(`status`, ''''), ''active''), `archived_at` = NULL, `updated_at` = NOW()
     WHERE `kind` = ''archi'' AND (`code` = ''query'' OR `name` = ''Query'')',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 12) Mark Laravel migrations as ran (so artisan migrate won't re-apply)
-- -----------------------------------------------------------------------------
SET @batch = (SELECT COALESCE(MAX(`batch`), 0) + 1 FROM `migrations`);

CALL blu_record_migration_if_missing('2026_07_28_120000_create_drafting_request_crm_category_table', @batch);
CALL blu_record_migration_if_missing('2026_07_29_080000_archive_apm_assigned_on_hold_query_statuses', @batch);
CALL blu_record_migration_if_missing('2026_07_29_081000_add_vo_hours_to_drafting_requests', @batch);
CALL blu_record_migration_if_missing('2026_07_29_083500_ensure_project_manager_dashboard_permissions', @batch);
CALL blu_record_migration_if_missing('2026_07_29_084500_add_link_to_drafting_request_revisions_table', @batch);
CALL blu_record_migration_if_missing('2026_07_29_085000_add_revision_id_to_drafting_request_comments_table', @batch);
CALL blu_record_migration_if_missing('2026_07_30_070000_create_announcement_likes_table', @batch);
CALL blu_record_migration_if_missing('2026_07_30_080000_expand_clients_and_contacts', @batch);
CALL blu_record_migration_if_missing('2026_07_30_092000_add_dashboard_activity_project_permission', @batch);
CALL blu_record_migration_if_missing('2026_07_30_100000_add_initials_to_users_table', @batch);
CALL blu_record_migration_if_missing('2026_08_04_100000_add_job_list_edit_permission', @batch);
CALL blu_record_migration_if_missing('2026_08_04_100100_restore_apm_assigned_on_hold_query_statuses', @batch);

COMMIT;

-- Cleanup helpers
DROP PROCEDURE IF EXISTS `blu_add_column_if_missing`;
DROP PROCEDURE IF EXISTS `blu_drop_column_if_exists`;
DROP PROCEDURE IF EXISTS `blu_add_fk_if_missing`;
DROP PROCEDURE IF EXISTS `blu_record_migration_if_missing`;
