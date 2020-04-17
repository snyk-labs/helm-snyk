#! /bin/bash
set -e

npm run pkg
shasum -a 256 helm-snyk-linux > helm-snyk-linux.sha256
shasum -a 256 helm-snyk-macos > helm-snyk-macos.sha256
shasum -a 256 helm-snyk-win.exe > helm-snyk-win.exe.sha256