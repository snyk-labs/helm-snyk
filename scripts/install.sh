#! /bin/bash -e

#export HELM_PLUGIN_DIR="$(helm home)/plugins/helm-snyk"

echo $HELM_PLUGIN_DIR

version="$(cat plugin.yaml | grep "version" | cut -d '"' -f 2)"
latest_version=$(curl -Is "https://github.com/snyk-labs/helm-snyk/releases/latest" | grep "Location" | sed s#.*tag/##g | tr -d "\r")

echo "Installing helm-snyk v${latest_version} ..."

mkdir -p $HELM_PLUGIN_DIR
cd $HELM_PLUGIN_DIR
ls -la
pwd

unameOut="$(uname -s)"

case "${unameOut}" in
    Linux*)     os=linux;;
    Darwin*)    os=macos;;
    *)          os="UNKNOWN:${unameOut}"
esac

arch=`uname -m`
# url="https://github.com/snyk-labs/helm-snyk/releases/download/v${version}/conftest_${version}_${os}_${arch}.tar.gz"
url="https://github.com/snyk-labs/helm-snyk/releases/download/v${latest_version}/helm-snyk-${os}"
echo URL:
echo $url

if [ "$url" = "" ]
then
    echo "Unsupported OS / architecture: ${os}_${arch}"
    exit 1
fi

#filename=`echo ${url} | sed -e "s/^.*\///g"`
filename="helm-snyk-${os}"

if [ -n $(command -v curl) ]
then
    curl -sSL -O $url
elif [ -n $(command -v wget) ]
then
    wget -q $url
else
    echo "Need curl or wget"
    exit -1
fi

rm -rf bin && mkdir bin && mv $filename ./bin/$filename
chmod a+x ./bin/$filename  # may not need this when installed via helm

echo "helm-snyk ${latest_version} is installed."
echo
echo "See https://github.com/snyk-labs/helm-snyk for help getting started."
