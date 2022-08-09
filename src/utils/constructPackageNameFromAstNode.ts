import * as vscode from "vscode";
import { SyntaxKind } from "typescript";
import ts = require("typescript");
import determinePackageNameForNPM from "./determinePackageNameForNPM";

export default function constructPackageNameFromAstNode(
  node: ts.Node,
  document: vscode.TextDocument
) {
  const importPath = node
    .getChildren()
    .filter((n) => {
      if (n.kind === SyntaxKind.StringLiteral) {
        return true;
      }
      return false;
    })
    .map((n) => n.getFullText());
  const line = document.positionAt(node.getStart());
  const text = document.lineAt(line.line);
  const packageName = determinePackageNameForNPM(
    importPath[0]?.replace(/'/g, "")?.replace(/"/g, "").trim()
  );
  return {
    importLineText: text,
    packageName: packageName,
  };
}
