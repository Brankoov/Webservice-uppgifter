import express from "express"
import "dotenv/config"
import { env } from "node:process"

const app = express()
const port: number = Number(env.PORT) || 3000 // Could crash
const secret = process.env.MY_GLOBAL_TEST_SECRET

app.get("/", (req, res) => {
    res.status(200).send("Hello World!")
})
//Starts server on port variable
app.listen(port,  "0.0.0.0", () => {
    console.log("Listening on port " + (port))
    console.log(secret)
})