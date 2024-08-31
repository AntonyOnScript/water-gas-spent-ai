-- CreateTable
CREATE TABLE `measures` (
    `measure_uuid` VARCHAR(191) NOT NULL,
    `measure_datetime` DATETIME(3) NOT NULL,
    `measure_type` ENUM('gas', 'water') NOT NULL,
    `measure_value` DOUBLE NOT NULL,
    `customer_code` VARCHAR(191) NOT NULL,
    `has_confirmed` BOOLEAN NOT NULL DEFAULT false,
    `image_url` LONGTEXT NOT NULL,

    UNIQUE INDEX `measures_measure_uuid_key`(`measure_uuid`),
    PRIMARY KEY (`measure_uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
