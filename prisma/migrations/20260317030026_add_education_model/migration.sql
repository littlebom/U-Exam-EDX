-- CreateTable
CREATE TABLE "educations" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "education_level" VARCHAR(50) NOT NULL,
    "institution" VARCHAR(255) NOT NULL,
    "faculty" VARCHAR(255),
    "major" VARCHAR(255),
    "graduation_year" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "educations" ADD CONSTRAINT "educations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: Copy existing flat education fields into new educations table
INSERT INTO "educations" ("id", "profile_id", "education_level", "institution", "faculty", "major", "graduation_year", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", "education_level", COALESCE("institution", ''), "faculty", "major", "graduation_year", 0, NOW(), NOW()
FROM "candidate_profiles"
WHERE "education_level" IS NOT NULL;
