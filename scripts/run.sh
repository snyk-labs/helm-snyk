#! /bin/bash -e

#export HELM_PLUGIN_DIR="$(helm home)/plugins/helm-snyk"

echo $HELM_PLUGIN_DIR

unameOut="$(uname -s)"

case "${unameOut}" in
    Linux*)     os=linux;;
    Darwin*)    os=macos;;
    *)          os="UNKNOWN:${unameOut}"
esac

filename="helm-snyk-${os}"
$HELM_PLUGIN_DIR/bin/$filename "$@"
