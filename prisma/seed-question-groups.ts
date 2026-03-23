/**
 * Seed Question Groups + assign existing questions to groups
 * Run: npx tsx prisma/seed-question-groups.ts
 */
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const GROUPS_PER_SUBJECT: Record<string, Array<{ name: string; color: string; description: string }>> = {
  IT101: [
    { name: "พื้นฐานคอมพิวเตอร์", color: "#2563eb", description: "ฮาร์ดแวร์ ซอฟต์แวร์ ระบบปฏิบัติการ" },
    { name: "อินเทอร์เน็ตและเว็บ", color: "#059669", description: "เครือข่าย เว็บไซต์ อีเมล" },
    { name: "สำนักงานอัตโนมัติ", color: "#d97706", description: "Word Excel PowerPoint" },
  ],
  PRG501: [
    { name: "พื้นฐานโปรแกรมมิ่ง", color: "#7c3aed", description: "ตัวแปร เงื่อนไข ลูป" },
    { name: "โครงสร้างข้อมูล", color: "#dc2626", description: "Array List Stack Queue" },
    { name: "OOP", color: "#0891b2", description: "Class Object Inheritance Polymorphism" },
  ],
  DB301: [
    { name: "SQL พื้นฐาน", color: "#2563eb", description: "SELECT INSERT UPDATE DELETE" },
    { name: "การออกแบบฐานข้อมูล", color: "#059669", description: "ER Diagram Normalization" },
  ],
  NET201: [
    { name: "OSI Model", color: "#7c3aed", description: "7 Layers ของ OSI" },
    { name: "TCP/IP", color: "#dc2626", description: "IP Address Subnet Routing" },
  ],
  SEC401: [
    { name: "ภัยคุกคาม", color: "#dc2626", description: "Malware Phishing Social Engineering" },
    { name: "การป้องกัน", color: "#059669", description: "Firewall Encryption Authentication" },
  ],
};

async function main() {
  console.log("🔖 Seeding Question Groups...\n");

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");

  const subjects = await prisma.subject.findMany({
    where: { tenantId: tenant.id },
    include: { questions: { select: { id: true }, orderBy: { createdAt: "asc" } } },
  });

  for (const subject of subjects) {
    const groupDefs = GROUPS_PER_SUBJECT[subject.code];
    if (!groupDefs) continue;

    console.log(`📚 ${subject.name} (${subject.code}) — ${subject.questions.length} questions`);

    const groups = [];
    for (let i = 0; i < groupDefs.length; i++) {
      const def = groupDefs[i];
      const existing = await prisma.questionGroup.findFirst({
        where: { subjectId: subject.id, name: def.name },
      });

      if (existing) {
        groups.push(existing);
        console.log(`  ♻️  ${def.name} (exists)`);
      } else {
        const group = await prisma.questionGroup.create({
          data: {
            tenantId: tenant.id,
            subjectId: subject.id,
            name: def.name,
            description: def.description,
            color: def.color,
            sortOrder: i,
          },
        });
        groups.push(group);
        console.log(`  ✅ ${def.name}`);
      }
    }

    // Assign questions to groups (round-robin)
    if (groups.length > 0 && subject.questions.length > 0) {
      for (let i = 0; i < subject.questions.length; i++) {
        const group = groups[i % groups.length];
        await prisma.question.update({
          where: { id: subject.questions[i].id },
          data: { questionGroupId: group.id },
        });
      }
      console.log(`  📝 Assigned ${subject.questions.length} questions to ${groups.length} groups\n`);
    }
  }

  console.log("✨ Question Groups seeded successfully!");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
