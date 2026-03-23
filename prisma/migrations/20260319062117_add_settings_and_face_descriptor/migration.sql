-- AlterTable
ALTER TABLE "candidate_profiles" ADD COLUMN     "face_descriptor" JSONB;

-- AlterTable
ALTER TABLE "exam_schedules" ADD COLUMN     "settings" JSONB;
