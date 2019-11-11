import { IArgs, parseInputParameters } from "../cli-args";

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

    test("handles dot as input", () => {
      const inputArgs = ["test", "."];

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe(".");
      expect(parsedArgs.debug).toBe(false);
    });

    test("handle absolute path as input", () => {
      const inputArgs = ["test", "/some/other/path"];
      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe("/some/other/path");

      expect(parsedArgs.debug).toBe(false);
    });

    test("handle relative path as input", () => {
      const inputArgs = ["test", "~/other/path"];

      const parsedArgs = parseInputParameters(inputArgs);

      expect(parsedArgs.inputDirectory).toBe("~/other/path");
      expect(parsedArgs.debug).toBe(false);
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
  const inputArgs = ["test", ".", "--debug"];
  const parsedArgs: IArgs = parseInputParameters(inputArgs);
  expect(parsedArgs.inputDirectory).toBe(".");
  expect(parsedArgs.debug).toBe(true);
});

describe("Handle json flag", () => {
  test("option --json", () => {
    const inputArgs = ["test", ".", "--json"];

    const parsedArgs: IArgs = parseInputParameters(inputArgs);

    expect(parsedArgs.json).toBeTruthy();
  });
});
