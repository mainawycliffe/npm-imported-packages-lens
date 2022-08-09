import * as vscode from "vscode";
import { tsquery } from "@phenomnomnominal/tsquery";
import constructPackageNameFromAstNode from "./utils/constructPackageNameFromAstNode";
import composeHoverMarkdownContent from "./utils/composeHoverMarkdownContent";

export function activate(context: vscode.ExtensionContext) {
  let regHoverProviderDisposable = vscode.languages.registerHoverProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      async provideHover(document, position, token) {
        const nodes = tsquery.ast(document.getText());
        const importNodes = tsquery(nodes, `ImportDeclaration`);
        const currentPositionNode = importNodes.filter((node) => {
          const startOfLine = document.positionAt(node.getStart());
          const endOfLine = document.positionAt(node.getEnd());
          if (
            startOfLine.line <= position.line &&
            position.line <= endOfLine.line
          ) {
            return true;
          }
          return false;
        });

        // should always be a node of 1
        if (currentPositionNode.length !== 1) {
          return null;
        }
        const currentPositionNodeFirst = currentPositionNode[0];
        const npmPackageInfo = constructPackageNameFromAstNode(
          currentPositionNodeFirst,
          document
        );
        if (npmPackageInfo.packageName === "") {
          return null;
        }
        return composeHoverMarkdownContent(npmPackageInfo.packageName);
      },
    }
  );

  let regHoverForPackageJSON = vscode.languages.registerHoverProvider(
    {
      pattern: "**/package.json",
    },
    {
      async provideHover(document, position, token) {
        const packageJSONContent = JSON.parse(document.getText());
        const hoveredText = document
          .lineAt(position)
          .text.trim()
          .replace(",", "");

        const allDependenciesInPackageJSON = {
          ...packageJSONContent.dependencies,
          ...packageJSONContent.devDependencies,
          ...packageJSONContent.peerDependencies,
        } as Record<string, string>;

        // if the hovered text is a dependency in the package.json file
        const hoveredTextInDependencyList = Object.entries(
          allDependenciesInPackageJSON
        ).filter(([packageName, version]) => {
          const dependencyLine = `"${packageName}": "${version}"`;
          if (dependencyLine === hoveredText) {
            return true;
          }
          return false;
        });
        if (hoveredTextInDependencyList.length !== 1) {
          return null;
        }
        const [packageName] = hoveredTextInDependencyList[0];
        return composeHoverMarkdownContent(packageName);
      },
    }
  );

  context.subscriptions.push(
    regHoverProviderDisposable,
    regHoverForPackageJSON
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
