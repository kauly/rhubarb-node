import ffmpegPath from "ffmpeg-static";
import { spawnSync } from "child_process";
import { EventEmitter } from "events";
import fs from "fs";
import path from "path";

export type RhubarbOutput = {
  metadata: {
    soundFile: string;
    duration: number;
  };
  mouthCues: { start: number; end: number; value: string }[];
};

export type Recognizer = "phonetic" | "pocketSphinx";

type RunCommandProps = {
  audio: Buffer;
  recognizer?: Recognizer;
  rhubarbPath?: string;
};

function printFfmpegPath() {
  console.log(ffmpegPath);
}

class CommandExecutor extends EventEmitter {
  executeCommand(command: string) {
    const child = spawnSync(command, { shell: true });
    if (child.error) {
      throw new Error(child.error.message);
    }

    return child.stdout.toString();
  }
}

function runCommand({
  audio,
  recognizer = "phonetic",
  rhubarbPath = "",
}: RunCommandProps) {
  const commandExecutor = new CommandExecutor();
  const currentDir = process.cwd();
  const rhubarb = path.join(
    currentDir,
    rhubarbPath || "node_modules/rhubarb-node/rhubarb/rhubarb"
  );
  const outputDir = path.join(currentDir, "tmp");
  const outputWav = path.join(outputDir, "output.wav");
  const tmpWav = path.join(outputDir, "tmp.wav");
  const outputJson = path.join(outputDir, "output.json");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    // Write audioBuffer to a temporary file
    fs.writeFileSync(tmpWav, audio);

    // FFmpeg command to convert the temporary file to WAV format
    const ffmpegCommand = `${ffmpegPath} -i ${tmpWav} -acodec pcm_s16le -ar 44100 -ac 2 ${outputWav}`;

    commandExecutor.executeCommand(ffmpegCommand);
    // Execute Rhubarb command
    const rhubarbCommand = `${rhubarb} -r ${recognizer} -f json ${outputWav} -o ${outputJson}`;
    commandExecutor.executeCommand(rhubarbCommand);

    const data = fs.readFileSync(outputJson, "utf8");
    const json = JSON.parse(data) as RhubarbOutput;

    return json;
  } catch (err) {
    throw err;
  } finally {
    fs.unlinkSync(tmpWav);
    fs.unlinkSync(outputWav);
    fs.unlinkSync(outputJson);
  }
}

export { printFfmpegPath, runCommand };
