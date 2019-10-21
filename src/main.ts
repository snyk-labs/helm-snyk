import Docker = require("dockerode");
import * as path from "path";
import yaml from "js-yaml";
import stream from "stream";
import fs from "fs";
import { IArgs, parseInputParameters } from "./cli-args";
import util from "util";
const exec = util.promisify(require("child_process").exec);

const SNYK_CLI_DOCKER_IMAGE_NAME = "snyk/snyk-cli:docker";

interface ISnykTest {
  exitCode: number;
  outputText: string;
}

interface IExecCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

async function runCommand(fullCommand: string): Promise<IExecCommandResult> {
  try {
    const { stdout, stderr } = await exec(fullCommand);

    const retValue = {
      exitCode: 0,
      stdout: stdout,
      stderr: stderr
    } as IExecCommandResult;
    return retValue;
  } catch (err) {
    // non-zero exit code from running command
    // console.error(err);
    // console.error("code:\n", err.code);
    // console.error("message:\n", err.message);
    // console.error("stderr:\n", err.stderr);
    // console.error("stdout:\n", err.stdout);

    const retValue = {
      exitCode: err.code,
      stdout: err.stdout,
      stderr: err.stderr
    } as IExecCommandResult;
    return retValue;
  }
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

async function runSnykTestWithDocker(
  snykCLIImageName: string,
  imageToTest: string
): Promise<string> {
  const myLocalDirectory = "/Users/jeff/snyk-bizdev/helm-snyk"; //TODO: Make variable
  const projectDirBind = `${myLocalDirectory}:/project`;

  const docker = new Docker();

  const myStdOutCaptureStream = new stream.Writable();
  let stdoutString = "";
  myStdOutCaptureStream._write = function(chunk, encoding, done) {
    stdoutString += chunk.toString();
    done();
  };

  const token = process.env.SNYK_TOKEN;
  const createOptions = {
    env: [`SNYK_TOKEN=${token}`, "MONITOR=false"],
    Binds: ["/var/run/docker.sock:/var/run/docker.sock", projectDirBind]
  };

  const startOptions = {};

  const command = `test --docker ${imageToTest} --json`;

  return new Promise((resolve, reject) => {
    // @ts-ignore
    docker.run(
      snykCLIImageName,
      [command],
      myStdOutCaptureStream,
      createOptions,
      startOptions,
      (err, data, container) => {
        if (err) {
          reject(err);
        } else {
          if (data.StatusCode === 1) {
            // remove the "Failed to run the process ..." message (coming from the docker-entrypoint.sh in the Snyk CLI Docker)
            stdoutString = stdoutString.replace(
              "Failed to run the process ...",
              ""
            );
            console.error(
              `runSnykTestWithDocker(${imageToTest}): removed that failed message`
            );
          }
          console.error(
            `runSnykTestWithDocker(${imageToTest}): data.StatusCode: ${data.StatusCode}`
          );
          resolve(stdoutString);
        }
      }
    );
  });
}

function loadMultiDocYamlFromString(strMultiDocYaml: string) {
  const docs = yaml.safeLoadAll(strMultiDocYaml);
  return docs;
}

function searchAllDocsForImages(yamlDocs): string[] {
  let allImages: string[] = [];
  for (const nextRenderedDoc of yamlDocs) {
    if (nextRenderedDoc) {
      // sometimes docs are empty
      const images: string[] = searchDocForImages(nextRenderedDoc);
      if (images.length > 0) {
        allImages = [...allImages, ...images];
      }
    }
  }
  return allImages;
}

function searchDocForImages(doc): string[] {
  const setImages = new Set();

  // TODO: use optional chaining for doc.spec, etc when typescript 3.7 goes GA
  const spec = doc.spec;
  if (spec) {
    const containers = spec.containers;
    const initContainers = spec.initContainers;

    if (containers) {
      for (const c of containers) {
        setImages.add(c.image);
      }
    }

    if (initContainers) {
      for (const c of initContainers) {
        setImages.add(c.image);
      }
    }
  }

  return Array.from(setImages) as string[];
}

function writeOutputToFile(outputFilename: string, outputObj: any) {
  try {
    console.error(`writing output to ${outputFilename}`);
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

async function main() {
  const args: IArgs = parseInputParameters();

  console.error("parsed input parameters:");
  console.error(` - inputDirectory: ${args.inputDirectory}`);
  console.error(` - output: ${args.output}`);
  console.error(` - json: ${args.json}`);

  if (
    !args.inputDirectory ||
    (args.inputDirectory && args.inputDirectory === ".")
  ) {
    args.inputDirectory = process.cwd();
  }

  console.error("updated parameters:");
  console.error(` - inputDirectory: ${args.inputDirectory}`);
  console.error(` - output: ${args.output}`);
  console.error(` - json: ${args.json}`);

  const helmCommand = `helm template ${args.inputDirectory}`;
  const helmCommandResObj = await runCommand(helmCommand);
  const renderedTemplates = helmCommandResObj.stdout;

  const yamlDocs = loadMultiDocYamlFromString(renderedTemplates);
  const allImages: string[] = searchAllDocsForImages(yamlDocs);

  console.error("found all the images:");
  allImages.forEach((i: string) => console.error(`  - ${i}`));

  // pull the Snyk CLI image
  const pullImageResultMessage = await pullImage(SNYK_CLI_DOCKER_IMAGE_NAME);

  const helmChartLabel = getHelmChartLabelForOutput(args.inputDirectory);

  const allOutputData: any = {
    helmChart: helmChartLabel,
    images: []
  };

  for (const imageName of allImages) {
    try {
      const pullImageToTestesultMessage = await pullImage(imageName);

      const outputSnykTestDocker = await runSnykTestWithDocker(
        SNYK_CLI_DOCKER_IMAGE_NAME,
        imageName
      );

      const testResultJsonObject = JSON.parse(outputSnykTestDocker);

      const imageInfo: any = {
        imageName: imageName,
        results: testResultJsonObject
      };

      allOutputData.images.push(imageInfo);
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
}

main();
