import { runCommand } from "../index";
import fs from "fs";
import path from "path";

// load audio from local file
const audio = fs.readFileSync(path.join(__dirname, "audio.mp3"));
const audioBuffer = Buffer.from(audio);

const output = runCommand({
  audio: audioBuffer,
  rhubarbPath: "src/rhubarb/rhubarb",
  recognizer: "phonetic",
});

console.log("🚀 ~ output:", output);
