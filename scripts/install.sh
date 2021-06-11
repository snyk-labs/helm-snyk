#!/bin/bash

# Install helm-snyk as helm plugin getting the latest release version and copying it to
# helm/plugins folder
set -eou pipefail

latest_version=$(curl -Is "https://github.com/snyk-labs/helm-snyk/releases/latest" | grep -E "^Location:" | rev | cut -d"/" -f1 | rev | tr -d "\r\n")

echo "Installing helm-snyk ${latest_version} ..."

mkdir -p $HELM_PLUGIN_DIR
cd $HELM_PLUGIN_DIR

unameOut="$(uname -s)"

case "${unameOut}" in
    Linux*)     os=linux;;
    Darwin*)    os=macos;;
    *)
        echo "Unsupported OS: ${unameOut}"
        exit 1
esac

url="https://github.com/snyk-labs/helm-snyk/releases/download/${latest_version}/helm-snyk-${os}"

curl -sSL -O $url
curl -sSL -O "${url}.sha256"

if [ "${os}" == "macos" ]; then
    shasum -a 256 -c helm-snyk-macos.sha256
else
    sha256sum -c helm-snyk-linux.sha256
fi


rm -rf bin && mkdir bin && mv "helm-snyk-${os}" ./bin/helm-snyk
chmod a+x ./bin/helm-snyk
rm *.sha256

echo "helm-snyk ${latest_version} is installed."
echo
echo "See https://github.com/snyk-labs/helm-snyk for help getting started."
