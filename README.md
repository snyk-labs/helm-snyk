# helm-snyk

This Helm plugin allows you to test the images found within a given Helm chart for security vulnerabilities using Snyk.

## Usage as Helm plugin
First install the plugin (requires Helm)
```
helm plugin install https://github.com/snyk-labs/helm-snyk
```

Set your `SNYK_TOKEN` environment variable:
```
export SNYK_TOKEN=<your-snyk-token>
```
If you don't have a Snyk token, go to [https://snyk.io/login](https://snyk.io/login) to sign up. You can them obtain your token from [https://app.snyk.io/account](https://app.snyk.io/account) or for information on using service accounts, see [https://snyk.io/docs/service-accounts/](https://snyk.io/docs/service-accounts/).

Then `cd` to a directory containing a Helm chart you want to test and run:
```
helm snyk .
```

Alternatively, you can specify a full path:
```
helm snyk /path/to/helm/chart
```

To save the output to a file either use piping or use the `--output` option. For example:
```
helm snyk . --output=<filename.json>
```

## Usage as CLI tool
```
git clone git@github.com:snyk-labs/helm-snyk.git
npm install
npm start -- <helm-chart-directory> [--output=<output-file.json>]
```
