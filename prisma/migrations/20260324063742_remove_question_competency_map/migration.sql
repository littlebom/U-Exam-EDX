/*
  Warnings:

  - You are about to drop the `question_competency_maps` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "question_competency_maps" DROP CONSTRAINT "question_competency_maps_competency_area_id_fkey";

-- DropForeignKey
ALTER TABLE "question_competency_maps" DROP CONSTRAINT "question_competency_maps_question_id_fkey";

-- DropTable
DROP TABLE "question_competency_maps";
