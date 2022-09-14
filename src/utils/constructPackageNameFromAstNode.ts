import * as vscode from "vscode";
import { SyntaxKind } from "typescript";
import ts from "typescript";
import determinePackageNameForNPM from "./determinePackageNameForNPM";

export type ImportPathDetails = {
  packageName: string;
  range: vscode.Range;
};

export default function constructPackageNameFromAstNode(
  node: ts.Node,
  document: vscode.TextDocument
): ImportPathDetails {
  // we taking TSQuery AST, looking for import string and then returning the
  // import path
  const importPath = node
    .getChildren()
    .filter((n) => {
      if (n.kind === SyntaxKind.StringLiteral) {
        return true;
      }
      return false;
    })
    .map((n) => n.getFullText());

  // we want to show hover on the path itself, not the whole import
  // statement, so we are getting the range of the path
  const importRange = node
    .getChildren()
    .filter((n) => {
      if (n.kind === SyntaxKind.StringLiteral) {
        return true;
      }
      return false;
    })
    .map(
      (n) =>
        new vscode.Range(
          document.positionAt(n.getStart()),
          document.positionAt(n.getEnd())
        )
    )[0];

  // if there is no import path, we return empty string
  const packageName = determinePackageNameForNPM(
    importPath[0]?.replace(/'/g, "")?.replace(/"/g, "").trim()
  );
  return {
    packageName,
    range: importRange,
  };
}
