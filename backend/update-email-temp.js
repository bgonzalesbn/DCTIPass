const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("ITExperience");

  // Find who has the gmail
  const gmailUser = await db
    .collection("users")
    .findOne({ email: "bgonzalezsbn@gmail.com" });
  console.log(
    "Gmail user:",
    gmailUser?.firstName,
    gmailUser?.lastName,
    "- employeeNumber:",
    gmailUser?.employeeNumber,
  );

  // Current user
  const user = await db
    .collection("users")
    .findOne({ employeeNumber: "18732" });
  console.log("User 18732 email:", user.email);

  await client.close();
}

run().catch((e) => console.error(e.message));
