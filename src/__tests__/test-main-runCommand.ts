import { IExecCommandResult } from "../main";
import { ExecException } from "child_process";
import fs from "fs";
import { async } from "q";

beforeEach(() => {
  jest.resetModules();
});

const mainModule = require("../main");

test("validate zero exit code and stdout captured", async () => {
  // jest.resetModules();
  jest.doMock("child_process", () => {
    return {
      exec: jest.fn((command, callback) => callback(null, "ok", ""))
    };
  });
  const mainModule = require("../main");

  const res: IExecCommandResult = await mainModule.runCommand("foo bar");
  expect(res.exitCode).toBe(0);
  expect(res.stdout.trim()).toBe("ok");
  expect(res.stderr.trim()).toBe("");
});

test("validate non-zero exit code captured", async () => {
  const command = "foo bar exit 1";
  const err = {
    cmd: command,
    code: 1
  } as ExecException;

  jest.doMock("child_process", () => {
    return {
      exec: jest.fn((command, callback) => callback(err, "failed", ""))
    };
  });
  const mainModule = require("../main");

  const res: IExecCommandResult = await mainModule.runCommand(command).catch((nonZeroExitResult: IExecCommandResult) => {
    expect(nonZeroExitResult.exitCode).toBe(1);
    expect(nonZeroExitResult.stdout.trim()).toBe("failed");
    expect(nonZeroExitResult.stderr.trim()).toBe("");
  });
  expect(res).toBe(undefined);
});

test("validate stderr captured", async () => {
  jest.doMock("child_process", () => {
    return {
      exec: jest.fn((command, callback) => callback(null, "", "error"))
    };
  });
  const mainModule = require("../main");

  const res: IExecCommandResult = await mainModule.runCommand("foo bar with stderr");
  expect(res.exitCode).toBe(0);
  expect(res.stdout.trim()).toBe("");
  expect(res.stderr.trim()).toBe("error");
});

describe("Assemble Snyk command", () => {
  test("Command without options", () => {
    const imageName = "someImage";
    const optionsList = {};

    const cmd = mainModule.assembleSnykCommand(imageName, optionsList);

    expect(cmd).toEqual(`snyk test --docker ${imageName}`);
  });

  test("Command with json option", () => {
    const imageName = "someImage";
    const optionsList = { json: true };

    const cmd = mainModule.assembleSnykCommand(imageName, optionsList);

    expect(cmd).toEqual(`snyk test --docker ${imageName} --json`);
  });
});

describe("Handle results", () => {
  test("Handle text result for simple image", () => {
    const optionsList = {};
    const commandResult = [
      {
        image: "MyImage",
        result: `
          Testing docker.io/bitnami/redis:5.0.5-debian-9-r181...

          ✗ Low severity vulnerability found in tar
            Description: CVE-2005-2541
            Info: https://snyk.io/vuln/SNYK-LINUX-TAR-105079
            Introduced through: meta-common-packages@meta
            From: meta-common-packages@meta > tar@1.29b-1.1
          `
      }
    ];
    const expectedResult = `Image: ${commandResult[0].image}
${commandResult[0].result}
`;

    const resultHandled = mainModule.handleResult(commandResult, optionsList);

    expect(resultHandled).toEqual(expectedResult);
  });

  test("Handle text result for multi image", () => {
    const optionsList = {};
    const commandResult = [
      {
        image: "MyImage1",
        result: `
          Testing docker.io/bitnami/redis:5.0.5-debian-9-r181...

          ✗ Low severity vulnerability found in tar
            Description: CVE-2005-2541
            Info: https://snyk.io/vuln/SNYK-LINUX-TAR-105079
            Introduced through: meta-common-packages@meta
            From: meta-common-packages@meta > tar@1.29b-1.1
          `
      },
      {
        image: "MyImage2",
        result: `
          Testing docker.io/bitnami/redis:5.0.5-debian-9-r181...

          ✗ Low severity vulnerability found in tar
            Description: CVE-2005-2541
            Info: https://snyk.io/vuln/SNYK-LINUX-TAR-105079
            Introduced through: meta-common-packages@meta
            From: meta-common-packages@meta > tar@1.29b-1.1
          `
      }
    ];
    const expectedResult = `Image: ${commandResult[0].image}
${commandResult[0].result}
Image: ${commandResult[1].image}
${commandResult[1].result}
`;

    const resultHandled = mainModule.handleResult(commandResult, optionsList);

    expect(resultHandled).toEqual(expectedResult);
  });

  test("Handle json result for simple image", () => {
    const optionsList = { json: true };
    const commandResult = [
      {
        image: "MyImage",
        result: `
          Testing docker.io/bitnami/redis:5.0.5-debian-9-r181...

          ✗ Low severity vulnerability found in tar
            Description: CVE-2005-2541
            Info: https://snyk.io/vuln/SNYK-LINUX-TAR-105079
            Introduced through: meta-common-packages@meta
            From: meta-common-packages@meta > tar@1.29b-1.1
          `
      }
    ];
    const expectedResult = [
      {
        image: commandResult[0].image,
        result: commandResult[0].result
      }
    ];

    const resultHandled = mainModule.handleResult(commandResult, optionsList);

    expect(resultHandled).toEqual(expectedResult);
  });

  test("Handle json result for multi image", () => {
    const optionsList = { json: true };
    const commandResult = [
      {
        image: "MyImage1",
        result: `
          Testing docker.io/bitnami/redis:5.0.5-debian-9-r181...

          ✗ Low severity vulnerability found in tar
            Description: CVE-2005-2541
            Info: https://snyk.io/vuln/SNYK-LINUX-TAR-105079
            Introduced through: meta-common-packages@meta
            From: meta-common-packages@meta > tar@1.29b-1.1
          `
      },
      {
        image: "MyImage2",
        result: `
          Testing docker.io/bitnami/redis:5.0.5-debian-9-r181...

          ✗ Low severity vulnerability found in tar
            Description: CVE-2005-2541
            Info: https://snyk.io/vuln/SNYK-LINUX-TAR-105079
            Introduced through: meta-common-packages@meta
            From: meta-common-packages@meta > tar@1.29b-1.1
          `
      }
    ];
    const expectedResult = [
      {
        image: commandResult[0].image,
        result: commandResult[0].result
      },
      {
        image: commandResult[1].image,
        result: commandResult[1].result
      }
    ];

    const resultHandled = mainModule.handleResult(commandResult, optionsList);

    expect(resultHandled).toEqual(expectedResult);
  });
});

describe("Handle output", () => {
  test("Output without options", () => {
    const optionsList = {};
    const expectedOutput = "summary";
    const log = jest.spyOn(global.console, "log");

    mainModule.handleOutput(expectedOutput, optionsList);

    expect(log).toHaveBeenCalledWith(expectedOutput);
  });

  test('Output with "json" option', () => {
    const optionsList = { json: true };
    const expectedOutput = {
      result: "test"
    };
    const log = jest.spyOn(global.console, "log");

    mainModule.handleOutput(expectedOutput, optionsList);

    expect(log).toHaveBeenCalledWith(JSON.stringify(expectedOutput, null, 2));
  });

  test('Output with "output" option', () => {
    const optionsList = { output: "/tmp/file.html" };
    const expectedOutput = "summary";
    const writeFile = jest.spyOn(fs, "writeFileSync");

    mainModule.handleOutput(expectedOutput, optionsList);

    expect(writeFile).toHaveBeenCalledWith(optionsList.output, expectedOutput);
  });

  test('Output with "json" and "output" options', () => {
    const optionsList = { output: "/tmp/file.json", json: true };
    const expectedOutput = {
      result: "test"
    };
    const writeFile = jest.spyOn(fs, "writeFileSync");

    mainModule.handleOutput(expectedOutput, optionsList);

    expect(writeFile).toHaveBeenCalledWith(optionsList.output, JSON.stringify(expectedOutput, null, 2));
  });
});
