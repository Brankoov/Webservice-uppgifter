import express from "express";
import "dotenv/config";
import { validateSecret } from "./security/validateEnv.js";
import { closeDB, getDB, runDB } from "./db/database.js";
import type { Db } from "mongodb";

const app = express();
app.use(express.json());

const port: number = Number(process.env.PORT) || 3000; // Could crash
const secret = validateSecret(process.env.MY_GLOBAL_TEST_SECRET);

// definiera ett enkelt User-interface
interface User {
  id: number;
  name: string;
  email: string;
}

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hello world!" });
});

// Healthcheck
app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// Lista alla users
app.get("/users", async (_req, res) => {
  try {
    const users = await getDB().collection("users").find({}).toArray();
    res.json(users);
  } catch (e) {
    console.error("GET /users error:", e); // <-- NYTT: logga
    res.status(500).send("db error");
  }
});

// Dynamisk path-parameter :id (req = input, res = output)
// + returnera direkt vid fel (undvik multiple responses)
app.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id); // casting string -> number
  if (isNaN(id)) return res.status(400).send("id must be a number");

  try {
    const user = await getDB().collection("users").findOne({ id });
    if (!user) return res.status(404).send("not found");
    return res.json(user);
  } catch (e) {
    console.error("GET /users/:id error:", e); // <-- NYTT: logga
    return res.status(500).send("db error");
  }
});

// Skapa user via body: { "id": 42, "name": "Anna" } kräver eller genererar en unik emai
app.post("/users", async (req, res) => {
  const { id, name, email } = req.body as Partial<User>;
  if (typeof id !== "number" || typeof name !== "string") {
    return res.status(400).send("invalid payload");
  }
  const finalEmail =
    typeof email === "string" && email.length > 0
      ? email
      : `user${id}@demo.local`; // enkel unik fallback baserat på id

  try {
    await getDB().collection("users").insertOne({ id, name, email: finalEmail });
    return res.status(201).send("created");
  } catch (e) {
    console.error("POST /users insert error:", e);
    return res.status(500).send("db error");
  }
});

// Enkel endpoint som skickar 201 med en User i svaret
// + (NYTT) sparar även i DB för att snabbt testa skriv-rättigheter
// /demo-user – inkludera en email så den inte krockar med email-indexet
app.post("/demo-user", async (_req, res) => {
  const user: User = { id: 999, name: "BrankDemo", email: "brankdemo999@demo.local" };
  try {
    await getDB().collection("users").insertOne(user);
    return res.status(201).json(user);
  } catch (e) {
    console.error("POST /demo-user insert error:", e);
    return res.status(500).send("db error");
  }
});

app.get("/api/v1/database/comments/:username", async (req, res) => {
 const db: Db = getDB()
 const result = await db
 .collection("comments")
 .find({ name: req.params.username }) // Mercedes Tyler
 .limit(25)
 .toArray()
if (result.length === 0) {
 res.status(404).send({ message: "Nothing was found" })
 return
 }
 res.send(result)
})



async function startServer() {
  try {
    // Starta databasen FÖRE app.listen() (uppgift #3)
    await runDB();
    app.listen(port, "0.0.0.0", () => {
      console.log(`Listening to port ${port}`);
      console.log(`Start the app: http://localhost:${port}`);
    });

    const cleanup = async () => {
      console.log("Cleaning up...");
      await closeDB();
      process.exit(0);
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (error) {
    console.log(error);
  }
}
startServer();
