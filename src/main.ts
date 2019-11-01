import Docker = require("dockerode");
import * as path from "path";
import yaml from "js-yaml";
import stream from "stream";
import fs from "fs";
import { IArgs, parseInputParameters } from "./cli-args";
import { ChildProcess, exec, ExecException } from "child_process";

const SNYK_CLI_DOCKER_IMAGE_NAME = "snyk/snyk:docker";

interface ISnykTest {
  exitCode: number;
  outputText: string;
}

export interface IExecCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function runCommand(fullCommand: string): Promise<IExecCommandResult> {
  return new Promise<IExecCommandResult>((resolve, reject) => {
    const res: ChildProcess = exec(fullCommand, (err: ExecException | null, stdout: string, stderr: string) => {
      if (err) {
        const retValue = {
          exitCode: err.code,
          stdout: stdout,
          stderr: stderr
        } as IExecCommandResult;
        reject(retValue); // I could also resolve it here and then read the exit code in the calling block
      } else {
        const retValue = {
          exitCode: 0,
          stdout: stdout,
          stderr: stderr
        } as IExecCommandResult;
        resolve(retValue);
      }
    });
  });
}

async function pullImage(imageName: string): Promise<string> {
  const docker = new Docker();
  return new Promise<string>((resolve, reject) => {
    docker.pull(imageName, (err, stream) => {
      if (err) {
        console.error("failed pulling image");
        console.error(`err.code: ${err.code}`);
        console.error(`err.message: ${err.message}`);
        reject(err);
      } else {
        let message = "";

        stream.on("data", data => {
          message += data;
        });
        stream.on("end", () => {
          console.error("done. Message:");
          console.error(message);
          resolve(message);
        });
        stream.on("error", err => {
          reject(err);
        });
      }
    });
  });
}

async function runSnykTestWithDocker(snykToken: string, snykCLIImageName: string, imageToTest: string): Promise<string> {
  const docker = new Docker();

  const myStdOutCaptureStream = new stream.Writable();
  let stdoutString = "";
  myStdOutCaptureStream._write = function(chunk, encoding, done) {
    stdoutString += chunk.toString();
    done();
  };

  const myStdErrCaptureStream = new stream.Writable();
  let stderrString = "";
  myStdErrCaptureStream._write = function(chunk, encoding, done) {
    stderrString += chunk.toString();
    done();
  };

  const createOptions = {
    env: [`SNYK_TOKEN=${snykToken}`],
    Binds: ["/var/run/docker.sock:/var/run/docker.sock"],
    Tty: false
  };

  const startOptions = {};
  const command = `snyk test --docker ${imageToTest} --json`;

  return new Promise((resolve, reject) => {
    // @ts-ignore
    docker.run(snykCLIImageName, [command], [myStdOutCaptureStream, myStdErrCaptureStream], createOptions, startOptions, (err, data, container) => {
      if (err) {
        reject(err);
      } else {
        console.error(`runSnykTestWithDocker(${imageToTest}): data.StatusCode: ${data.StatusCode}`);
        // exit code 0: 0 means no issues detected
        // exit code 1: issues detected by Snyk
        // exit code 2:some error, for example the image you're trying to test doesn't exist locally, etc
        resolve(stdoutString);
      }
    });
  });
}

function loadMultiDocYamlFromString(strMultiDocYaml: string) {
  const docs = yaml.safeLoadAll(strMultiDocYaml);
  return docs;
}

export function isValidImageName(imageName: string): boolean {
  // This regex is from https://stackoverflow.com/questions/39671641/regex-to-parse-docker-tag posted 2016-Sept-24, falling under MIT license
  const newRegexString = "^(?:(?=[^:\\/]{1,253})(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*(?::[0-9]{1,5})?/)?((?![._-])(?:[a-z0-9._-]*)(?<![._-])(?:/(?![._-])[a-z0-9._-]*(?<![._-]))*)(?::(?![.-])[a-zA-Z0-9_.-]{1,128})?$";

  const regex = RegExp(newRegexString);
  const isMatch = regex.test(imageName);
  return isMatch;
}

export function flatImageSearch(allYamlStr: string): string[] {
  const setImages = new Set();

  const allLines: string[] = allYamlStr.split("\n");

  for (const nextLine of allLines) {
    const trimmedLine = nextLine.trim();

    if (trimmedLine.startsWith("image:")) {
      const splited = trimmedLine.split(/: (.+)?/, 2); // split only the first colon
      if (splited.length == 2) {
        let imageName = splited[1].trim();
        if ((imageName.startsWith('"') && imageName.endsWith('"')) || (imageName.startsWith("'") && imageName.endsWith("'"))) {
          imageName = imageName.substr(1, imageName.length - 2);
        }
        if (isValidImageName(imageName)) {
          setImages.add(imageName);
        } else {
          console.error(`warning: image name thrown out because it didn't pass validation: ${imageName}`)
        }
      }
    }
  }
  return Array.from(setImages) as string[];
}

function writeOutputToFile(outputFilename: string, outputObj: any) {
  try {
    console.error(`writing output to: ${outputFilename}`);
    const strOutput = JSON.stringify(outputObj, null, 2);
    fs.writeFileSync(outputFilename, strOutput);
  } catch (err) {
    console.error("error caught writing output file:");
    console.error(err);
  }
}

function getHelmChartLabelForOutput(helmChartDirectory: string): string {
  try {
    const fullPath = path.join(helmChartDirectory, "Chart.yaml");
    const chartfileContentsStr: string = fs.readFileSync(fullPath, "utf8");
    const parsedObj = yaml.safeLoad(chartfileContentsStr);

    const name = parsedObj.name;
    const version = parsedObj.version;

    return `${name}@${version}`;
  } catch (err) {
    console.error("error while trying to read Chart.yaml file");
    console.error(err);
    throw err; // This file is required so bail if not found
  }
}

export async function mainWithParams(args: IArgs, snykToken: string) {
  const helmCommand = `helm template ${args.inputDirectory}`;
  const helmCommandResObj: IExecCommandResult = await runCommand(helmCommand);
  const renderedTemplates = helmCommandResObj.stdout;

  const allImages: string[] = flatImageSearch(renderedTemplates);

  console.error("found all the images:");
  allImages.forEach((i: string) => console.error(`  - ${i}`));

  const doTest = !args.notest;
  if (doTest) {
    // pull the Snyk CLI image
    const pullImageResultMessage = await pullImage(SNYK_CLI_DOCKER_IMAGE_NAME);
  }

  const helmChartLabel = getHelmChartLabelForOutput(args.inputDirectory);

  const allOutputData: any = {
    helmChart: helmChartLabel,
    images: []
  };

  for (const imageName of allImages) {
    try {
      if (doTest) {
        const pullImageToTestesultMessage = await pullImage(imageName);
        const outputSnykTestDocker = await runSnykTestWithDocker(snykToken, SNYK_CLI_DOCKER_IMAGE_NAME, imageName);
        const testResultJsonObject = JSON.parse(outputSnykTestDocker);

        const imageInfo: any = {
          imageName: imageName,
          results: testResultJsonObject
        };
        allOutputData.images.push(imageInfo);
      } else {
        const imageInfo: any = {
          imageName: imageName,
          results: {}
        };
        allOutputData.images.push(imageInfo);
      }
    } catch (err) {
      console.error("Error caught: " + err.message);
    }
  }

  if (args.output) {
    writeOutputToFile(args.output, allOutputData);
  } else {
    const strOutput = JSON.stringify(allOutputData, null, 2);
    console.log(strOutput);
  }

  return allOutputData;
}

async function main() {
  const snykToken: string = process.env.SNYK_TOKEN ? process.env.SNYK_TOKEN : "";
  if (!snykToken) {
    console.error("SNYK_TOKEN environment variable is not set");
    process.exit(2);
  }

  const args: IArgs = parseInputParameters();
  if (!args.inputDirectory || (args.inputDirectory && args.inputDirectory === ".")) {
    args.inputDirectory = process.cwd();
  }

  await mainWithParams(args, snykToken);
}

if (require.main === module) {
  main();
}
