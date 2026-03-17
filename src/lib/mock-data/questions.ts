// Mock Questions Data for U-Exam Platform
// Covers all 8 question types: MC, True/False, Short Answer, Essay,
// Fill-in-blank, Matching, Ordering, Image-based

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "FILL_IN_BLANK"
  | "MATCHING"
  | "ORDERING"
  | "IMAGE_BASED";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export type QuestionStatus = "DRAFT" | "PUBLISHED";

export type MockQuestion = {
  id: string;
  type: QuestionType;
  content: string;
  options: string[] | null;
  correctAnswer: string | string[] | null;
  matchingPairs: { left: string; right: string }[] | null;
  orderingItems: string[] | null;
  imageUrl: string | null;
  difficulty: DifficultyLevel;
  points: number;
  category: string;
  tags: string[];
  status: QuestionStatus;
  creatorId: string;
  creatorName: string;
  tenantId: string;
  explanation: string | null;
  createdAt: string;
  updatedAt: string;
};

export const MOCK_QUESTIONS: MockQuestion[] = [
  // --- Multiple Choice (4 questions) ---
  {
    id: "q_001",
    type: "MULTIPLE_CHOICE",
    content:
      "โปรโตคอล HTTP ใช้พอร์ตมาตรฐานใดในการสื่อสาร?",
    options: ["พอร์ต 21", "พอร์ต 25", "พอร์ต 80", "พอร์ต 443"],
    correctAnswer: "พอร์ต 80",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "EASY",
    points: 1,
    category: "เครือข่ายคอมพิวเตอร์",
    tags: ["HTTP", "Network", "Protocol"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "HTTP (Hypertext Transfer Protocol) ใช้พอร์ต 80 เป็นค่าเริ่มต้น ส่วนพอร์ต 443 ใช้สำหรับ HTTPS",
    createdAt: "2025-06-01T10:00:00.000Z",
    updatedAt: "2025-06-01T10:00:00.000Z",
  },
  {
    id: "q_002",
    type: "MULTIPLE_CHOICE",
    content:
      "โครงสร้างข้อมูลแบบ Stack ทำงานตามหลักการใด?",
    options: ["FIFO", "LIFO", "Priority", "Random Access"],
    correctAnswer: "LIFO",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "EASY",
    points: 1,
    category: "โครงสร้างข้อมูล",
    tags: ["Stack", "Data Structure", "LIFO"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "Stack ใช้หลักการ LIFO (Last In, First Out) คือข้อมูลที่เข้ามาหลังสุดจะถูกนำออกก่อน",
    createdAt: "2025-06-05T09:00:00.000Z",
    updatedAt: "2025-06-10T14:30:00.000Z",
  },
  {
    id: "q_003",
    type: "MULTIPLE_CHOICE",
    content:
      "คำสั่ง SQL ใดที่ใช้เชื่อมตารางโดยแสดงเฉพาะแถวที่มีค่าตรงกันในทั้งสองตาราง?",
    options: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"],
    correctAnswer: "INNER JOIN",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 2,
    category: "ฐานข้อมูล",
    tags: ["SQL", "JOIN", "Database"],
    status: "PUBLISHED",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation:
      "INNER JOIN จะเชื่อมข้อมูลจากสองตารางและแสดงเฉพาะแถวที่มี key ตรงกันทั้งสองฝั่ง",
    createdAt: "2025-06-15T11:00:00.000Z",
    updatedAt: "2025-06-15T11:00:00.000Z",
  },
  {
    id: "q_004",
    type: "MULTIPLE_CHOICE",
    content:
      "Design Pattern แบบ Singleton มีจุดประสงค์หลักคืออะไร?",
    options: [
      "สร้าง object ได้หลาย instance พร้อมกัน",
      "จำกัดให้สร้าง object ได้เพียง instance เดียว",
      "แยก interface ออกจาก implementation",
      "ห่อหุ้ม algorithm ไว้ภายใน class",
    ],
    correctAnswer: "จำกัดให้สร้าง object ได้เพียง instance เดียว",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 2,
    category: "วิศวกรรมซอฟต์แวร์",
    tags: ["Design Pattern", "Singleton", "OOP"],
    status: "PUBLISHED",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation:
      "Singleton Pattern ให้แน่ใจว่า class มีเพียง instance เดียว และมี global access point ไปยัง instance นั้น",
    createdAt: "2025-07-01T08:00:00.000Z",
    updatedAt: "2025-07-01T08:00:00.000Z",
  },

  // --- True/False (3 questions) ---
  {
    id: "q_005",
    type: "TRUE_FALSE",
    content:
      "โปรโตคอล TCP เป็นแบบ Connection-oriented ที่รับประกันการส่งข้อมูลถึงปลายทาง",
    options: ["ถูก", "ผิด"],
    correctAnswer: "ถูก",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "EASY",
    points: 1,
    category: "เครือข่ายคอมพิวเตอร์",
    tags: ["TCP", "UDP", "Network"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "TCP เป็น Connection-oriented protocol ที่มีกลไก handshake, acknowledgment และ retransmission เพื่อรับประกันการส่งข้อมูล",
    createdAt: "2025-07-05T10:00:00.000Z",
    updatedAt: "2025-07-05T10:00:00.000Z",
  },
  {
    id: "q_006",
    type: "TRUE_FALSE",
    content:
      "ใน JavaScript ตัวแปรที่ประกาศด้วย let และ const จะถูก hoist ขึ้นไปด้านบนของ scope เหมือนกับ var",
    options: ["ถูก", "ผิด"],
    correctAnswer: "ผิด",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 1,
    category: "การเขียนโปรแกรม",
    tags: ["JavaScript", "Hoisting", "Variable"],
    status: "PUBLISHED",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation:
      "let และ const ถูก hoist แต่อยู่ใน Temporal Dead Zone (TDZ) จนกว่าจะถึงบรรทัดที่ประกาศ จึงไม่สามารถเข้าถึงได้ก่อนประกาศ ต่างจาก var ที่ hoist พร้อม initialize เป็น undefined",
    createdAt: "2025-07-10T09:00:00.000Z",
    updatedAt: "2025-07-10T09:00:00.000Z",
  },
  {
    id: "q_007",
    type: "TRUE_FALSE",
    content: "HTTP method PUT เป็น idempotent method",
    options: ["ถูก", "ผิด"],
    correctAnswer: "ถูก",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 1,
    category: "วิศวกรรมซอฟต์แวร์",
    tags: ["REST", "API", "HTTP"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "PUT เป็น idempotent เพราะไม่ว่าจะเรียกกี่ครั้ง ผลลัพธ์บน server จะเหมือนกัน (replace ข้อมูลทั้งหมดด้วยค่าที่ส่งมา)",
    createdAt: "2025-07-15T11:00:00.000Z",
    updatedAt: "2025-07-15T11:00:00.000Z",
  },

  // --- Short Answer (2 questions) ---
  {
    id: "q_008",
    type: "SHORT_ANSWER",
    content:
      "Binary Search มี Time Complexity ในกรณี worst case เป็นเท่าใด? (ตอบในรูปแบบ Big O notation)",
    options: null,
    correctAnswer: "O(log n)",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 2,
    category: "โครงสร้างข้อมูล",
    tags: ["Algorithm", "Binary Search", "Time Complexity"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "Binary Search แบ่งครึ่งข้อมูลในทุกรอบของการค้นหา จึงมี Time Complexity เป็น O(log n)",
    createdAt: "2025-08-01T10:00:00.000Z",
    updatedAt: "2025-08-01T10:00:00.000Z",
  },
  {
    id: "q_009",
    type: "SHORT_ANSWER",
    content:
      "ใน CSS Box Model คุณสมบัติใดที่กำหนดระยะห่างระหว่างเนื้อหา (content) กับขอบ (border)?",
    options: null,
    correctAnswer: "padding",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "EASY",
    points: 1,
    category: "การพัฒนาเว็บ",
    tags: ["CSS", "Box Model", "Web Development"],
    status: "PUBLISHED",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation:
      "padding คือระยะห่างระหว่าง content กับ border ส่วน margin คือระยะห่างด้านนอก border",
    createdAt: "2025-08-05T09:00:00.000Z",
    updatedAt: "2025-08-05T09:00:00.000Z",
  },

  // --- Essay (2 questions) ---
  {
    id: "q_010",
    type: "ESSAY",
    content:
      "จงอธิบายข้อดีและข้อเสียของ Microservices Architecture เทียบกับ Monolithic Architecture พร้อมยกตัวอย่างสถานการณ์ที่เหมาะสมกับแต่ละแบบ (ตอบไม่น้อยกว่า 200 คำ)",
    options: null,
    correctAnswer: null,
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "HARD",
    points: 10,
    category: "วิศวกรรมซอฟต์แวร์",
    tags: ["Architecture", "Microservices", "Monolith"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation: null,
    createdAt: "2025-08-10T10:00:00.000Z",
    updatedAt: "2025-08-10T10:00:00.000Z",
  },
  {
    id: "q_011",
    type: "ESSAY",
    content:
      "จงอธิบาย Database Normalization ตั้งแต่ 1NF ถึง 3NF พร้อมยกตัวอย่างตารางที่ละเมิดแต่ละ normal form และวิธีแก้ไข",
    options: null,
    correctAnswer: null,
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "HARD",
    points: 10,
    category: "ฐานข้อมูล",
    tags: ["Database", "Normalization", "SQL"],
    status: "PUBLISHED",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation: null,
    createdAt: "2025-08-15T11:00:00.000Z",
    updatedAt: "2025-08-15T11:00:00.000Z",
  },

  // --- Fill-in-blank (2 questions) ---
  {
    id: "q_012",
    type: "FILL_IN_BLANK",
    content:
      "แท็ก HTML ที่ใช้กำหนดส่วนหัวของเว็บเพจคือ <___> และแท็กที่ใช้กำหนดส่วนท้ายคือ <___>",
    options: null,
    correctAnswer: ["header", "footer"],
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "EASY",
    points: 2,
    category: "การพัฒนาเว็บ",
    tags: ["HTML", "Semantic", "Web"],
    status: "PUBLISHED",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation:
      "HTML5 Semantic tags: <header> สำหรับส่วนหัว และ <footer> สำหรับส่วนท้ายของหน้าหรือ section",
    createdAt: "2025-09-01T10:00:00.000Z",
    updatedAt: "2025-09-01T10:00:00.000Z",
  },
  {
    id: "q_013",
    type: "FILL_IN_BLANK",
    content:
      "คำสั่ง git ___ ใช้สำหรับสร้าง branch ใหม่ และคำสั่ง git ___ ใช้สำหรับรวม branch เข้าด้วยกัน",
    options: null,
    correctAnswer: ["branch", "merge"],
    matchingPairs: null,
    orderingItems: null,
    imageUrl: null,
    difficulty: "EASY",
    points: 2,
    category: "เครื่องมือพัฒนา",
    tags: ["Git", "Version Control", "Branch"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "git branch <name> สร้าง branch ใหม่ และ git merge <branch> รวม branch ที่ระบุเข้ากับ branch ปัจจุบัน",
    createdAt: "2025-09-05T09:00:00.000Z",
    updatedAt: "2025-09-05T09:00:00.000Z",
  },

  // --- Matching (2 questions) ---
  {
    id: "q_014",
    type: "MATCHING",
    content: "จับคู่ HTTP Status Code กับความหมายที่ถูกต้อง",
    options: null,
    correctAnswer: null,
    matchingPairs: [
      { left: "200", right: "OK - สำเร็จ" },
      { left: "301", right: "Moved Permanently - ย้ายถาวร" },
      { left: "404", right: "Not Found - ไม่พบหน้า" },
      { left: "500", right: "Internal Server Error - เซิร์ฟเวอร์ผิดพลาด" },
    ],
    orderingItems: null,
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 4,
    category: "การพัฒนาเว็บ",
    tags: ["HTTP", "Status Code", "Web"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "HTTP Status Codes แบ่งเป็นกลุ่ม: 2xx สำเร็จ, 3xx redirect, 4xx client error, 5xx server error",
    createdAt: "2025-09-10T10:00:00.000Z",
    updatedAt: "2025-09-10T10:00:00.000Z",
  },
  {
    id: "q_015",
    type: "MATCHING",
    content: "จับคู่ภาษาโปรแกรมกับ paradigm หลักที่เกี่ยวข้อง",
    options: null,
    correctAnswer: null,
    matchingPairs: [
      { left: "Haskell", right: "Functional Programming" },
      { left: "Java", right: "Object-Oriented Programming" },
      { left: "C", right: "Procedural Programming" },
      { left: "Prolog", right: "Logic Programming" },
    ],
    orderingItems: null,
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 4,
    category: "การเขียนโปรแกรม",
    tags: ["Programming", "Paradigm", "Language"],
    status: "PUBLISHED",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation:
      "แต่ละภาษามี paradigm หลักที่แตกต่างกัน แม้ภาษาสมัยใหม่จะรองรับหลาย paradigm (multi-paradigm)",
    createdAt: "2025-09-15T11:00:00.000Z",
    updatedAt: "2025-09-15T11:00:00.000Z",
  },

  // --- Ordering (2 questions) ---
  {
    id: "q_016",
    type: "ORDERING",
    content:
      "จงเรียงลำดับขั้นตอนของ Software Development Life Cycle (SDLC) แบบ Waterfall ให้ถูกต้อง",
    options: null,
    correctAnswer: null,
    matchingPairs: null,
    orderingItems: [
      "Requirements Analysis",
      "System Design",
      "Implementation",
      "Testing",
      "Deployment",
      "Maintenance",
    ],
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 3,
    category: "วิศวกรรมซอฟต์แวร์",
    tags: ["SDLC", "Waterfall", "Software Engineering"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "Waterfall Model เรียงตามลำดับ: วิเคราะห์ความต้องการ -> ออกแบบ -> พัฒนา -> ทดสอบ -> ติดตั้ง -> บำรุงรักษา",
    createdAt: "2025-10-01T10:00:00.000Z",
    updatedAt: "2025-10-01T10:00:00.000Z",
  },
  {
    id: "q_017",
    type: "ORDERING",
    content:
      "จงเรียงลำดับ OSI Model จากชั้นล่างสุด (Layer 1) ไปชั้นบนสุด (Layer 7)",
    options: null,
    correctAnswer: null,
    matchingPairs: null,
    orderingItems: [
      "Physical",
      "Data Link",
      "Network",
      "Transport",
      "Session",
      "Presentation",
      "Application",
    ],
    imageUrl: null,
    difficulty: "MEDIUM",
    points: 3,
    category: "เครือข่ายคอมพิวเตอร์",
    tags: ["OSI", "Network", "Layer"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "OSI 7 Layers (ล่างขึ้นบน): Physical, Data Link, Network, Transport, Session, Presentation, Application",
    createdAt: "2025-10-05T09:00:00.000Z",
    updatedAt: "2025-10-05T09:00:00.000Z",
  },

  // --- Image-based (3 questions) ---
  {
    id: "q_018",
    type: "IMAGE_BASED",
    content:
      "จากแผนภาพ ER Diagram ที่กำหนดให้ ความสัมพันธ์ระหว่าง Entity 'Student' กับ 'Course' เป็นแบบใด?",
    options: ["One-to-One", "One-to-Many", "Many-to-Many", "Self-referencing"],
    correctAnswer: "Many-to-Many",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: "/images/questions/er-diagram-student-course.png",
    difficulty: "MEDIUM",
    points: 2,
    category: "ฐานข้อมูล",
    tags: ["ER Diagram", "Database", "Relationship"],
    status: "PUBLISHED",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation:
      "นักศึกษา 1 คนลงทะเบียนได้หลายวิชา และ 1 วิชามีนักศึกษาหลายคน จึงเป็น Many-to-Many ต้องมีตารางกลาง (Enrollment)",
    createdAt: "2025-10-10T10:00:00.000Z",
    updatedAt: "2025-10-10T10:00:00.000Z",
  },
  {
    id: "q_019",
    type: "IMAGE_BASED",
    content:
      "จาก Flowchart ที่กำหนดให้ ถ้าค่า input = 7 ผลลัพธ์ output จะเป็นเท่าใด?",
    options: ["7", "14", "21", "49"],
    correctAnswer: "14",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: "/images/questions/flowchart-multiply.png",
    difficulty: "EASY",
    points: 2,
    category: "การเขียนโปรแกรม",
    tags: ["Flowchart", "Algorithm", "Logic"],
    status: "PUBLISHED",
    creatorId: "usr_004",
    creatorName: "ดร.นภา วงศ์ประเสริฐ",
    tenantId: "tenant_001",
    explanation:
      "Flowchart ตรวจสอบว่า input เป็นเลขคี่ ถ้าใช่จะคูณด้วย 2 ดังนั้น 7 x 2 = 14",
    createdAt: "2025-10-15T11:00:00.000Z",
    updatedAt: "2025-10-15T11:00:00.000Z",
  },
  {
    id: "q_020",
    type: "IMAGE_BASED",
    content:
      "จาก UML Class Diagram ที่กำหนดให้ ความสัมพันธ์แบบใดที่แสดงระหว่าง class 'Animal' กับ class 'Dog'?",
    options: ["Association", "Composition", "Aggregation", "Inheritance"],
    correctAnswer: "Inheritance",
    matchingPairs: null,
    orderingItems: null,
    imageUrl: "/images/questions/uml-class-inheritance.png",
    difficulty: "EASY",
    points: 2,
    category: "วิศวกรรมซอฟต์แวร์",
    tags: ["UML", "Class Diagram", "OOP"],
    status: "DRAFT",
    creatorId: "usr_005",
    creatorName: "อรุณ แสงทอง",
    tenantId: "tenant_001",
    explanation:
      "ลูกศรหัวสามเหลี่ยมกลวงชี้จาก Dog ไป Animal แสดง Inheritance (Is-a relationship) Dog สืบทอดจาก Animal",
    createdAt: "2025-10-20T10:00:00.000Z",
    updatedAt: "2025-10-20T10:00:00.000Z",
  },
];
