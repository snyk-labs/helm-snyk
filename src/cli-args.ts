const yargs = require("yargs");
const fs = require("fs");

interface IArgs {
  inputDirectory: string;
  output: string;
  json: boolean;
  notest: boolean;
  debug: boolean;
  helmTemplateOptions: string;
}

const parseInputParameters = (inputArgs): IArgs => {
  const scriptName = "helm snyk";
  const usageMsg = "Usage: $0 <command>";
  const testCommandUsage = "test <chart-directory> [options]";
  const testCommandDescription = "Check images in your charts for vulnerabilities";
  const scriptExample = "$0 test . --output=snyk-out.json";
  const argv = yargs(inputArgs)
    .version()
    .scriptName(scriptName)
    .usage(usageMsg)
    .command(testCommandUsage, testCommandDescription)
    .help("help")
    .alias("help", "h")
    .options(optionsConfiguration())
    .hide("notest")
    .demandCommand(2)
    .check(isValidChartDirectory)
    .example(scriptExample).argv;

  return parseOptions(argv);
};

const optionsConfiguration = () => {
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
    },
    set: {
      type: "string",
      describe:
        "(helm template option) --set='stringArray' set values on the command line (can specify multiple or separate values with commas: --set='key1=val1,key2=val2')"
    },
    setFile: {
      type: "string",
      describe:
        "(helm template option) --set='stringArray' set values on the command line (can specify multiple or separate values with commas: --set-file='key1=val1,key2=val2')"
    },
    setString: {
      type: "string",
      describe:
        "(helm template option) --set-string='stringArray' set STRING values on the command line (can specify multiple or separate values with commas: --set-string='key1=val1,key2=val2')"
    },
    values: {
      type: "string",
      describe: "(helm template option) --values='file' specify values in a YAML file (can specify multiple --values='file1,file2')"
    }
  };
};

const isValidChartDirectory = argv => {
  if (fs.existsSync(`${argv.chartDirectory}/Chart.yaml`) || fs.existsSync(`${argv.chartDirectory}/Chart.yml`)) return true;

  const msgError = `Invalid Chart directory. ${argv.chartDirectory} is not a valid path for a Chart!`;
  throw new Error(msgError);
};

const parseOptions = (argv: any) => {
  const options = {
    inputDirectory: "",
    output: "",
    json: false,
    notest: false,
    debug: false,
    helmTemplateOptions: ""
  } as IArgs;

  options.inputDirectory = argv.chartDirectory;
  if (argv.json) {
    options.json = argv.json;
  }
  if (argv.output) {
    options.output = argv.output;
  }
  if (argv.notest) {
    options.notest = argv.notest;
  }
  if (argv.debug) {
    options.debug = argv.debug;
  }
  options.helmTemplateOptions = parseHelmTemplateOptions(argv);

  return options;
};

const parseHelmTemplateOptions = (argv: any) => {
  const helmTemplateOptions: string[] = [];

  if (argv.set) {
    helmTemplateOptions.push(`--set ${argv.set}`);
  }
  if (argv.setFile) {
    helmTemplateOptions.push(`--set-file ${argv.setFile}`);
  }
  if (argv.setString) {
    helmTemplateOptions.push(`--set-string ${argv.setString}`);
  }
  if (argv.values) {
    const values: string[] = [];
    for (const value of argv.values.split(",")) {
      values.push(`--values ${value}`);
    }
    helmTemplateOptions.push(values.join(" "));
  }
  return helmTemplateOptions.join(" ");
};

export { IArgs, parseInputParameters };
