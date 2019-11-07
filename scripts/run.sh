#! /bin/bash -e

unameOut="$(uname -s)"

case "${unameOut}" in
    Linux*)     os=linux;;
    Darwin*)    os=macos;;
    *)          os="UNKNOWN:${unameOut}"
esac

filename="helm-snyk-${os}"
$HELM_PLUGIN_DIR/bin/$filename "$@"
