import { IExecCommandResult } from "../main";
import { ExecException } from "child_process";

beforeEach(() => {
  jest.resetModules();
});

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
