import { IArgs, parseInputParameters } from "../cli-args";

test("handles dot or actual path as input", () => {
  let inputArgs = [
    "."
  ];
  let parsedArgs: IArgs = parseInputParameters(inputArgs);
  expect(parsedArgs.inputDirectory).toBe(".");
  expect(parsedArgs.debug).toBe(false);

  inputArgs = [
    "/some/other/path"
  ];
  parsedArgs = parseInputParameters(inputArgs);
  expect(parsedArgs.inputDirectory).toBe("/some/other/path");
  expect(parsedArgs.debug).toBe(false);

  inputArgs = [
    "~/other/path"
  ];
  parsedArgs = parseInputParameters(inputArgs);
  expect(parsedArgs.inputDirectory).toBe("~/other/path");
  expect(parsedArgs.debug).toBe(false);
});

test("yargs causes process exit if no args", () => {
  //@ts-ignore
  const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code) => {});
  const inputArgs = [];
  const parsedArgs = parseInputParameters(inputArgs);
  expect(mockProcessExit).toHaveBeenCalledWith(1);
  mockProcessExit.mockRestore();
});

test("handles debug flag", () => {
  let inputArgs = [
    ".",
    "--debug"
  ];
  let parsedArgs: IArgs = parseInputParameters(inputArgs);
  expect(parsedArgs.inputDirectory).toBe(".");
  expect(parsedArgs.debug).toBe(true);

  inputArgs = [
    ".",
    "-d" // make sure it works with the short form '-d', too
  ];
  parsedArgs = parseInputParameters(inputArgs);
  expect(parsedArgs.inputDirectory).toBe(".");
  expect(parsedArgs.debug).toBe(true);
});
