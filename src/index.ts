import express from "express";
import "dotenv/config";
import { validateSecret } from "./security/validateEnv.js";
import { closeDB, getDB, runDB } from "./db/database.js";

const app = express();
app.use(express.json());

const port: number = Number(process.env.PORT) || 3000; // Could crash
const secret = validateSecret(process.env.MY_GLOBAL_TEST_SECRET);

// definiera ett enkelt User-interface
interface User {
  id: number;
  name: string;
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
    res.status(500).send("db error");
  }
});

// Uppgift #4: dynamisk path-parameter :id (req = input, res = output)
// + Uppgift #5: returnera direkt vid fel för att inte svara två gånger
app.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id); // casting string -> number
  if (isNaN(id)) return res.status(400).send("id must be a number");

  try {
    const user = await getDB().collection("users").findOne({ id });
    if (!user) return res.status(404).send("not found");
    return res.json(user);
  } catch {
    return res.status(500).send("db error");
  }
});

// Skapa user via body: { "id": 42, "name": "Anna" }
app.post("/users", async (req, res) => {
  const { id, name } = req.body as Partial<User>;
  if (typeof id !== "number" || typeof name !== "string") {
    return res.status(400).send("invalid payload");
  }
  try {
    await getDB().collection("users").insertOne({ id, name });
    return res.status(201).send("created");
  } catch {
    return res.status(500).send("db error");
  }
});

// Uppgift #6: enkel endpoint som skickar 201 med en User i svaret
app.post("/demo-user", (_req, res) => {
  const user: User = { id: 999, name: "BrankDemo" };
  return res.status(201).json(user);
});

async function startServer() {
  try {
    // Uppgift #3: starta databasen FÖRE app.listen()
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
