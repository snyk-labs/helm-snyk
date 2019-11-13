import { IArgs, parseInputParameters } from "../cli-args";
import fs = require("fs");

let mockProcessExit;
let consoleMock;

beforeEach(() => {
  //@ts-ignore
  mockProcessExit = jest.spyOn(process, "exit").mockImplementation(code => {});
  consoleMock = jest.spyOn(console, "error").mockImplementation(jest.fn());
});

afterEach(() => {
  consoleMock.mockRestore();
  mockProcessExit.mockRestore();
});

describe("handle helm template options", () => {
  let path;
  let chartPath;

  beforeEach(() => {
    path = ".";
    chartPath = `${path}/Chart.yaml`;
    fs.writeFileSync(chartPath, "");
  });

  afterEach(() => {
    fs.unlinkSync(chartPath);
  });

  describe("when without options", () => {
    test("execute `helm snyk test .`", () => {
      const inputArgs = ["test", path];
      const expectedOptions = "";

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.helmTemplateOptions).toBe(expectedOptions);
    });
  });

  describe("when with options", () => {
    test("execute `helm snyk test . --set='key1=val1,key2=val2'`", () => {
      const helmOption = "--set='key1=val1,key2=val2'";
      const inputArgs = ["test", path, helmOption];
      const expectedOptions = "--set key1=val1,key2=val2";

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.helmTemplateOptions).toBe(expectedOptions);
    });

    test("execute `helm snyk test . --set-file='key1=path1,key2=path2'`", () => {
      const helmOption = "--set-file='key1=path1,key2=path2'";
      const inputArgs = ["test", path, helmOption];
      const expectedOptions = "--set-file key1=path1,key2=path2";

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.helmTemplateOptions).toBe(expectedOptions);
    });

    test("execute `helm snyk test . --set-string='key1=val1,key2=val2'`", () => {
      const helmOption = "--set-string='key1=val1,key2=val2'";
      const inputArgs = ["test", path, helmOption];
      const expectedOptions = "--set-string key1=val1,key2=val2";

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.helmTemplateOptions).toBe(expectedOptions);
    });

    test("execute `helm snyk test . --values='file1,file2'`", () => {
      const helmOption = "--values='file1,file2'";
      const inputArgs = ["test", path, helmOption];
      const expectedOptions = "--values file1 --values file2";

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.helmTemplateOptions).toBe(expectedOptions);
    });

    test("execute `helm snyk test . --set='key1=val1,key2=val2' --values='file1,file2'`", () => {
      const helmOption1 = "--set='key1=val1,key2=val2'";
      const helmOption2 = "--values='file1,file2'";
      const inputArgs = ["test", path, helmOption1, helmOption2];
      const expectedOptions = "--set key1=val1,key2=val2 --values file1 --values file2";

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.helmTemplateOptions).toBe(expectedOptions);
    });
  });
});

describe("test command", () => {
  describe("check required input directory", () => {
    test("process exit if there is no <chart-directory> required arg", () => {
      const inputArgs = ["test"];

      parseInputParameters(inputArgs);

      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test("handles error when directory is invalid", () => {
      const inputArgs = ["test", "/not-valid-folder"];

      parseInputParameters(inputArgs);

      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test("handles dot as input", () => {
      const path = ".";
      const chartPath = `${path}/Chart.yaml`;
      fs.writeFileSync(chartPath, "");
      const inputArgs = ["test", path];

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe(".");

      fs.unlinkSync(chartPath);
    });

    test("handle absolute path as input", () => {
      const path = "/tmp";
      const chartPath = `${path}/Chart.yaml`;
      fs.writeFileSync(chartPath, "");
      const inputArgs = ["test", path];
      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe(path);

      fs.unlinkSync(chartPath);
    });

    test("handle relative path as input", () => {
      const path = "./src";
      const chartPath = `${path}/Chart.yaml`;
      fs.writeFileSync(chartPath, "");
      const inputArgs = ["test", path];

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe(path);

      fs.unlinkSync(chartPath);
    });
  });
});

test("yargs causes process exit if no args", () => {
  const inputArgs = [];

  parseInputParameters(inputArgs);

  expect(mockProcessExit).toHaveBeenCalledWith(1);
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
