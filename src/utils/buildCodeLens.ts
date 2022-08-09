import * as vscode from "vscode";

export default function buildCodeLens(
  importTextLine: vscode.TextLine,
  packageName: string
) {
  const codeLensRange = importTextLine.range;
  return [
    new vscode.CodeLens(codeLensRange, {
      title: `View ${packageName} on NPM`,
      command: "openPackage",
      arguments: [packageName, "npm"],
    }),
    new vscode.CodeLens(codeLensRange, {
      title: `GitHub`,
      command: "openPackage",
      arguments: [packageName, "github"],
    }),
    new vscode.CodeLens(codeLensRange, {
      title: `Homepage`,
      command: "openPackage",
      arguments: [packageName, "homepage"],
    }),
  ];
}
