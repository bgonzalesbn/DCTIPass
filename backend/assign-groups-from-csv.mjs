import fs from "fs";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DEFAULT_CSV_PATH = path.resolve(
  process.cwd(),
  "..",
  "docs",
  "cargardata_Final.csv",
);

const CSV_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : DEFAULT_CSV_PATH;
const DRY_RUN = process.argv.includes("--dry-run");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment");
  process.exit(1);
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((value) => value.trim());
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function normalizeEmployeeNumber(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  const normalized = text.replace(/,/g, "");
  const match = normalized.match(/^(.+?)\.0+$/);
  if (match) return match[1];
  return normalized;
}

function normalizeShift(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (text.startsWith("mañ")) return "Mañana";
  if (text.startsWith("man")) return "Mañana";
  if (text.startsWith("tar")) return "Tarde";
  return null;
}

function groupLetter(groupNumber) {
  const num = Number(groupNumber);
  if (!Number.isFinite(num)) return null;
  const index = Math.trunc(num);
  if (index < 1 || index > 4) return null;
  return String.fromCharCode("A".charCodeAt(0) + index - 1);
}

function dayOfMonth(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCDate();
}

async function run() {
  console.log(`CSV: ${CSV_PATH}`);
  if (!fs.existsSync(CSV_PATH)) {
    console.error("CSV not found");
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csvContent);

  console.log(`Rows loaded: ${rows.length}`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  const groups = await db.collection("groups").find({}).toArray();
  const groupMap = new Map(groups.map((g) => [g.name, g]));

  let assigned = 0;
  let alreadyAssigned = 0;
  let missingEmployee = 0;
  let userNotFound = 0;
  let missingGroup = 0;
  let invalidRow = 0;

  for (const row of rows) {
    const employeeNumber = normalizeEmployeeNumber(row["Número de empleado"]);
    if (!employeeNumber) {
      missingEmployee += 1;
      continue;
    }

    const groupNum = row["Número de grupo"];
    const letter = groupLetter(groupNum);
    const shift = normalizeShift(row["Grupo"]);
    const day = dayOfMonth(row["Día"]);

    if (!letter || !shift || !day) {
      invalidRow += 1;
      continue;
    }

    const groupName = `Grupo ${letter} - Sesión ${shift} - ${day}`;
    const targetGroup = groupMap.get(groupName);
    if (!targetGroup) {
      missingGroup += 1;
      continue;
    }

    const user = await db
      .collection("users")
      .findOne({ employeeNumber: String(employeeNumber) });

    if (!user) {
      userNotFound += 1;
      continue;
    }

    const activeMembership = await db.collection("group_memberships").findOne({
      userId: user._id,
      deletedAt: null,
    });

    if (
      activeMembership &&
      String(activeMembership.groupId) === String(targetGroup._id)
    ) {
      alreadyAssigned += 1;
      continue;
    }

    if (!DRY_RUN) {
      await db
        .collection("group_memberships")
        .updateMany(
          { userId: user._id, deletedAt: null },
          { $set: { deletedAt: new Date() } },
        );

      await db.collection("group_memberships").insertOne({
        userId: user._id,
        groupId: new ObjectId(targetGroup._id),
        role: "member",
        joinedAt: new Date(),
        deletedAt: null,
      });
    }

    assigned += 1;
  }

  await client.close();

  console.log(
    JSON.stringify(
      {
        assigned,
        alreadyAssigned,
        missingEmployee,
        userNotFound,
        missingGroup,
        invalidRow,
        dryRun: DRY_RUN,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
