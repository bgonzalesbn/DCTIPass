import path from "path";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

// Load Mongo credentials from backend/.env so we do not leak them via CLI arguments.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const employeeNumber = process.argv[2];
if (!employeeNumber) {
  console.error("Usage: node query-user-groups.mjs <employeeNumber>");
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment");
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

function normalizeGroupId(value) {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  return null;
}

(async () => {
  try {
    await client.connect();
    const db = client.db();
    const user = await db
      .collection("users")
      .findOne({ employeeNumber: String(employeeNumber) });

    if (!user) {
      console.log(
        JSON.stringify(
          {
            user: null,
            message: `User ${employeeNumber} not found`,
          },
          null,
          2,
        ),
      );
      return;
    }

    const userId = user._id;

    const memberships = await db
      .collection("group_memberships")
      .find({
        $or: [{ userId }, { userId: userId.toString() }],
      })
      .sort({ joinedAt: -1 })
      .toArray();

    const groupIds = memberships
      .map((record) => normalizeGroupId(record.groupId))
      .filter((id) => id !== null);

    const uniqueGroupIds = [
      ...new Map(groupIds.map((id) => [id.toString(), id])).values(),
    ];

    const groups = uniqueGroupIds.length
      ? await db
          .collection("groups")
          .find({ _id: { $in: uniqueGroupIds } })
          .toArray()
      : [];

    const groupMap = new Map(groups.map((g) => [g._id.toString(), g]));

    const activeMembership =
      memberships.find((m) => m.deletedAt === null) || null;

    const payload = {
      user: {
        _id: userId,
        employeeNumber: user.employeeNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      activeMembership: activeMembership
        ? {
            groupId: activeMembership.groupId,
            role: activeMembership.role,
            joinedAt: activeMembership.joinedAt,
            groupName:
              groupMap.get(String(activeMembership.groupId))?.name ?? null,
          }
        : null,
      memberships: memberships.map((m) => ({
        groupId: m.groupId,
        role: m.role,
        joinedAt: m.joinedAt,
        deletedAt: m.deletedAt,
        groupName: groupMap.get(String(m.groupId))?.name ?? null,
      })),
    };

    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
