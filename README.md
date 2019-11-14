# Check your Helm chart for vulnerabilities

The Helm plugin for [Snyk](https://snyk.io/) provides a subcommand for testing the images in a given Helm chart for known vulnerabilities.

## Installation

Install the plugin using the built-in `helm plugin` command:

```
helm plugin install https://github.com/snyk-labs/helm-snyk
```

The plugin connects to the Snyk service to lookup vulnerability information. If you don't have a Snyk account, go to [snyk.io/login](https://snyk.io/login) to sign up for free. You can then obtain an access token from [app.snyk.io/account](https://app.snyk.io/account) or for information on using service accounts, see [snyk.io/docs/service-accounts/](https://snyk.io/docs/service-accounts/).

Once you have an account, you should set the `SNYK_TOKEN` environment variable:

```
export SNYK_TOKEN=<your-snyk-token>
```

The plugin also requires a local Docker installation and uses this to download and test each of the images discovered in the chart.


## Usage

With the plugin installed, simply run the new `helm snyk test` command and point it to the directory of the chart. For instance:

```console
$ helm snyk test stable/redis
Image: docker.io/bitnami/redis:5.0.5-debian-9-r181
Testing docker.io/bitnami/redis:5.0.5-debian-9-r181...
✗ Low severity vulnerability found in tar
  Description: CVE-2005-2541
  Info: https://snyk.io/vuln/SNYK-LINUX-TAR-105079
  Introduced through: meta-common-packages@meta
  From: meta-common-packages@meta > tar@1.29b-1.1
✗ Low severity vulnerability found in systemd/libsystemd0
  Description: CVE-2019-9619
  Info: https://snyk.io/vuln/SNYK-LINUX-SYSTEMD-442642
  Introduced through: systemd/libsystemd0@232-25+deb9u12, util-linux/bsdutils@1:2.29.2-1+deb9u1, procps@2:3.3.12-3+deb9u1, sysvinit/sysvinit-utils@2.88dsf-59.9, systemd/libudev1@232-25+deb9u12, util-linux/mount@2.29.2-1+deb9u1
  From: systemd/libsystemd0@232-25+deb9u12
  From: util-linux/bsdutils@1:2.29.2-1+deb9u1 > systemd/libsystemd0@232-25+deb9u12
  From: procps@2:3.3.12-3+deb9u1 > procps/libprocps6@2:3.3.12-3+deb9u1 > systemd/libsystemd0@232-25+deb9u12
  and 4 more...
...
```

The plugin also supports the various arguments for modifying the chart, including `--set` and `--values`. So for instance you can test the same chart but override the image tag like so: 

```console
helm snyk test --set image.tag=latest
```

As well as the user-friendly output above the plugin also supports outputting the results as a JSON document. This can be useful for further analysis or integration with other tooling.

```console
$ helm snyk test stable/mysql --json
{
  "helmChart": "mysql@1.3.0",
  "images": [
    {
      "imageName": "dduportal/bats:0.4.0",
      "results": {
        "vulnerabilities": [
          {
            "CVSSv3": null,
            "creationTime": "2019-02-06T14:40:43.295348Z",
            "credit": [
              ""
            ],
            "cvssScore": null,
            "description": "## Overview\nCVE-2011-3374",
            "disclosureTime": null,
            "id": "SNYK-LINUX-APT-116518",
            "identifiers": {
              "ALTERNATIVE": [
                "SNYK-DEBIAN8-APT-407500",
...
```

For further options and features see the help instructions with the `--help` flag.


