const yargs = require("yargs");

interface IArgs {
  inputDirectory: string;
  output: string;
  json: boolean;
  notest: boolean;
}

function getOptions() {
  return {
    o: {
      alias: ["output"],
      type: "string"
    },
    j: {
      alias: ["json"],
      type: "boolean"
    },
    d: {
      alias: ["debug"],
      type: "boolean"
    },
    n: {
      alias: ["notest"],
      type: "boolean"
    }
  };
}

function parseInputParameters(): IArgs {
  const returnObj = {
    inputDirectory: "",
    output: "",
    json: false,
    notest: false
  } as IArgs;

  const argv = yargs
    .version()
    .usage("Usage: npq install <package> [options]")
    .help("help")
    .alias("help", "h")
    .options(getOptions())
    .demandCommand(1) // because one directory max
    .example("helm-snyk . --output=snyk-out.json")
    .check(argvObj => {
      // argv._ should contain the hyphen-less commands
      if (argvObj._.length === 0) {
        returnObj.inputDirectory = ".";
      } else if (argvObj._.length === 1) {
        // todo: make sure this is a legit directory (or ".")
        returnObj.inputDirectory = argvObj._[0];
      } else {
        throw new Error("only one positional argument is allowed and it should be a directory");
      }
      return true; // from check
    })
    .strict().argv;

  if (argv.output) {
    returnObj.output = argv.output;
  }

  if (argv.notest) {
    returnObj.notest = argv.notest;
  }

  return returnObj;
}

export { IArgs, parseInputParameters };
