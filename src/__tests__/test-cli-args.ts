import { IArgs, parseInputParameters } from "../cli-args";
import fs = require("fs");

describe("test command", () => {
  describe("check required input directory", () => {
    test("process exit if there is no <chart-directory> required arg", () => {
      const inputArgs = ["test"];
      //@ts-ignore
      const mockProcessExit = jest.spyOn(process, "exit").mockImplementation(code => {});

      parseInputParameters(inputArgs);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      mockProcessExit.mockRestore();
    });

    test("handles error when directory is invalid", () => {
      const inputArgs = ["test", "/not-valid-folder"];
      //@ts-ignore
      const mockProcessExit = jest.spyOn(process, "exit").mockImplementation(code => {});

      parseInputParameters(inputArgs);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      mockProcessExit.mockRestore();
    });

    test("handles dot as input", () => {
      const path = ".";
      const chartPath = `${path}/Chart.yaml`;
      fs.writeFileSync(chartPath, "");
      const inputArgs = ["test", path];

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe(".");
      expect(parsedArgs.debug).toBe(false);

      fs.unlinkSync(chartPath);
    });

    test("handle absolute path as input", () => {
      const path = "/tmp";
      const chartPath = `${path}/Chart.yaml`;
      fs.writeFileSync(chartPath, "");
      const inputArgs = ["test", path];
      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe(path);

      expect(parsedArgs.debug).toBe(false);

      fs.unlinkSync(chartPath);
    });

    test("handle relative path as input", () => {
      const path = "./src";
      const chartPath = `${path}/Chart.yaml`;
      fs.writeFileSync(chartPath, "");
      const inputArgs = ["test", path];

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe(path);
      expect(parsedArgs.debug).toBe(false);

      fs.unlinkSync(chartPath);
    });
  });
});

test("yargs causes process exit if no args", () => {
  //@ts-ignore
  const mockProcessExit = jest.spyOn(process, "exit").mockImplementation(code => {});
  const inputArgs = [];

  parseInputParameters(inputArgs);
  expect(mockProcessExit).toHaveBeenCalledWith(1);
  mockProcessExit.mockRestore();
});

test("handles debug flag", () => {
  const path = ".";
  const chartPath = `${path}/Chart.yaml`;
  fs.writeFileSync(chartPath, "");
  const inputArgs = ["test", path, "--debug"];

  const parsedArgs = parseInputParameters(inputArgs);

  expect(parsedArgs.inputDirectory).toBe(path);
  expect(parsedArgs.debug).toBe(true);

  fs.unlinkSync(chartPath);
});

describe("Handle json flag", () => {
  test("option --json", () => {
    const path = ".";
    const chartPath = `${path}/Chart.yaml`;
    fs.writeFileSync(chartPath, "");
    const inputArgs = ["test", path, "--json"];

    const parsedArgs: IArgs = parseInputParameters(inputArgs);

    expect(parsedArgs.json).toBeTruthy();

    fs.unlinkSync(chartPath);
  });
});
