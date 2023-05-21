import { tsquery } from "@phenomnomnominal/tsquery";
import * as vscode from "vscode";
import constructPackageNameFromAstNode from "./constructPackageNameFromAstNode";
import composeHoverMarkdownContent from "./composeHoverMarkdownContent";

export function isInsideScriptTags(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let scriptStart: number = 0,
    scriptEnd: number = 0;
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    if (line.text.includes("<script")) {
      scriptStart = line.lineNumber;
      break;
    }
  }
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    if (line.text.includes("</script>")) {
      scriptEnd = line.lineNumber;
      break;
    }
  }
  const positionLine = position.line;
  if (positionLine > scriptStart && positionLine < scriptEnd) {
    return true;
  }
  return false;
}

export const provideHoverForSvelte: vscode.HoverProvider["provideHover"] = (
  document,
  position,
  token
) => {
  if (!isInsideScriptTags(document, position)) {
    return null;
  }
  // tsquery seems to work with vue files, which is great considering that vue
  // files are not valid ts files. More testing needed, here
  const nodes = tsquery.ast(document.getText());
  const importNodes = tsquery(nodes, `ImportDeclaration`);
  const currentPositionNode = importNodes.filter((node) => {
    const startOfLine = document.positionAt(node.getStart());
    const endOfLine = document.positionAt(node.getEnd());
    if (startOfLine.line <= position.line && position.line <= endOfLine.line) {
      return true;
    }
    return false;
  });

  // should always be a node of 1
  if (currentPositionNode.length !== 1) {
    return null;
  }
  const currentPositionNodeFirst = currentPositionNode[0];
  const { packageName, range: packageRange } = constructPackageNameFromAstNode(
    currentPositionNodeFirst,
    document
  );
  if (packageName === "") {
    return null;
  }
  return composeHoverMarkdownContent(packageName, packageRange);
};
