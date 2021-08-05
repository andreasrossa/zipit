import { Command, flags } from "@oclif/command";
import * as archiver from "archiver";
import * as fs from "fs";
import * as rimraf from "rimraf";

const FILE_EXTENSION = ".zip";
const nameRegex = /([a-z-]+?)-([0-9]+\.[0-9]+\.[0-9]+)/g;

declare global {
  interface String {
    goodLastIndexOf: (i: string) => number | undefined;
  }
}

String.prototype.goodLastIndexOf = function (i: string) {
  const a = String(this);
  const result = a.lastIndexOf(i);
  return result === -1 ? undefined : result;
};

class Zipit extends Command {
  static description = "zips shit up - f a s t";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),

    input: flags.string({ char: "i", description: "input folder" }),
    pattern: flags.string({
      char: "p",
      description: "regex pattern to match source files",
    }),
    clear: flags.boolean({
      char: "c",
      description: "deletes the temporary .zipittemp folder on completion",
    }),
  };

  static args = [
    {
      name: "output",
      required: true,
      description: "output folder",
      default: "./zippedit",
    },
  ];

  async run() {
    const {
      args: { output = "./zippedit" },
      flags: { input = ".", pattern, clear },
    } = this.parse(Zipit);

    const tempFolderName = ".zipittemp";
    const tempFolder = `${input}/${tempFolderName}`;

    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }

    if (!fs.existsSync(output)) {
      fs.mkdirSync(output);
    }

    console.log("Collecting files...");
    const files = fs
      .readdirSync(input, { withFileTypes: true })
      .filter((it) => it.isFile())
      .map((it) => it.name);

    let processedFiles = 0;

    for (const file of files) {
      let r = null;
      try {
        r = await handleFile(file, tempFolder, input, output, pattern);
      } catch (err) {
        console.warn(`Failed to handle file ${file}`);
        continue;
      }

      if (r === true) {
        processedFiles++;
        console.log(`Processed '${file}' successfully!`)
      }
    }

    if (clear === true) {
      rimraf.sync(tempFolder, {
        lstat: fs.lstat,
      });
    }

    console.log(`\n\nFinished! Processed ${processedFiles} files successfully.`);
  }
}

const handleFile = async (
  file: string,
  tempFolder: string,
  input: string,
  output: string,
  pattern?: string
): Promise<boolean> => {
  const fileName = (() => {
    if (!file.includes(".")) return file;

    let r = file;
    if (file.startsWith(".")) {
      r = file.slice(1, undefined);
    }

    return r.slice(0, r.goodLastIndexOf(".")) + FILE_EXTENSION;
  })();

  let regex = nameRegex;

  if (pattern !== undefined) {
    try {
      regex = RegExp(pattern, "g");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw Error(`Provided pattern is invalid - ${err.message}`);
      }

      throw Error(`Failed while instantiating pattern regex: ${err}`);
    }
  }

  let regexResult = null;

  try {
    regexResult = regex.exec(fileName);
  } catch (err) {
    console.error(`failed while executing regex on '${fileName}'`);
  }

  if (regexResult === null) {
    console.warn(
      `File ${file} does not match the specified pattern: ${regex.source} - Skipping...`
    );
    return false;
  } else if (regexResult.length !== 3) {
    throw Error(
      "File matched the regex, but the regex contains more or less than 2 capture groups."
    );
  }

  let modFolder;
  try {
    modFolder = fs.mkdtempSync(`${tempFolder}/`);
    fs.mkdirSync(`${modFolder}/mods`);
    fs.mkdirSync(`${modFolder}/config`);
    fs.copyFileSync(`${input}/${file}`, `${modFolder}/mods/${file}`);
  } catch (err) {
    throw Error(
      `Failed while creating folder structure: ${(<Error>err).message}`
    );
  }

  const zipFilePath = `${output}/${fileName}`;

  const zipfile = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", {});

  archive.on("warning", function (err) {
    if (err.code === "ENOENT") {
      console.warn(err.message);
    } else {
      throw err;
    }
  });

  archive.on("error", function (err) {
    throw Error(`Failed while creating zip: ${err.message}`);
  });

  archive.pipe(zipfile);
  archive.directory(modFolder, false);
  await archive.finalize();

  return true;
};

export = Zipit;
