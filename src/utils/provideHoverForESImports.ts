import { tsquery } from "@phenomnomnominal/tsquery";
import * as vscode from "vscode";
import composeHoverMarkdownContent from "./composeHoverMarkdownContent";
import constructPackageNameFromAstNode from "./constructPackageNameFromAstNode";

const provideHoverForESImports: vscode.HoverProvider["provideHover"] = (
  document,
  position,
  token
) => {
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

export default provideHoverForESImports;
