#!/bin/sh
# Builds doctest-this-function-<version>.vsix (a .vsix is just a zip). No Node/vsce needed.
# Usage: sh build-vsix.sh
set -e
cd "$(dirname "$0")"
VERSION=$(python3 -c "import json; print(json.load(open('package.json'))['version'])")
PUBLISHER=$(python3 -c "import json; print(json.load(open('package.json'))['publisher'])")
OUT="$PWD/doctest-this-function-$VERSION.vsix"
STAGE=$(mktemp -d)
mkdir "$STAGE/extension"
cp package.json extension.js shell.js run_doctest.py README.md "$STAGE/extension/"

cat > "$STAGE/[Content_Types].xml" <<XML
<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension=".json" ContentType="application/json"/><Default Extension=".vsixmanifest" ContentType="text/xml"/><Default Extension=".js" ContentType="application/javascript"/><Default Extension=".py" ContentType="text/plain"/><Default Extension=".md" ContentType="text/markdown"/></Types>
XML

cat > "$STAGE/extension.vsixmanifest" <<XML
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Language="en-US" Id="doctest-this-function" Version="$VERSION" Publisher="$PUBLISHER"/>
    <DisplayName>Python Doctest: This Function</DisplayName>
    <Description xml:space="preserve">Right-click a Python function to run only its doctests.</Description>
    <Categories>Testing</Categories>
  </Metadata>
  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/>
  </Assets>
</PackageManifest>
XML

rm -f "$OUT"
(cd "$STAGE" && zip -q -X -r "$OUT" '[Content_Types].xml' extension.vsixmanifest extension)
rm -rf "$STAGE"
echo "Built $OUT"
