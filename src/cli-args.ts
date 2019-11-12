const yargs = require("yargs");
const fs = require("fs");

interface IArgs {
  inputDirectory: string;
  output: string;
  json: boolean;
  notest: boolean;
  debug: boolean;
}

function getOptions() {
  return {
    output: {
      type: "string"
    },
    json: {
      type: "boolean"
    },
    debug: {
      type: "boolean"
    },
    notest: {
      type: "boolean"
    }
  };
}

function parseInputParameters(inputArgs): IArgs {
  const returnObj = {
    inputDirectory: "",
    output: "",
    json: false,
    notest: false,
    debug: false
  } as IArgs;

  const argv = yargs(inputArgs)
    .version()
    .scriptName("helm snyk")
    .usage("Usage: $0 <command>")
    .command("test <chart-directory> [options]", "Check images in your charts for vulnerabilities")
    .help("help")
    .alias("help", "h")
    .options(getOptions())
    .hide("notest")
    .demandCommand(2)
    .check(isValidChartDirectory)
    .example("$0 test . --output=snyk-out.json").argv;

  returnObj.inputDirectory = argv.chartDirectory;

  if (argv.json) {
    returnObj.json = argv.json;
  }

  if (argv.output) {
    returnObj.output = argv.output;
  }

  if (argv.notest) {
    returnObj.notest = argv.notest;
  }

  if (argv.debug) {
    returnObj.debug = argv.debug;
  }

  return returnObj;
}

const isValidChartDirectory = argv => {
  if (fs.existsSync(`${argv.chartDirectory}/Chart.yaml`) || fs.existsSync(`${argv.chartDirectory}/Chart.yml`)) return true;

  const msgError = `Invalid Chart directory. ${argv.chartDirectory} is not a valid path for a Chart!`;
  throw new Error(msgError);
};

export { IArgs, parseInputParameters };
