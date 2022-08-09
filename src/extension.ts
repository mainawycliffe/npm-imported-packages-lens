import * as vscode from "vscode";
import { tsquery } from "@phenomnomnominal/tsquery";
import fetchPackageInfoFromNPM from "./utils/fetchPackageInfoFromNPM";
import constructPackageNameFromAstNode from "./utils/constructPackageNameFromAstNode";
import buildCodeLens from "./utils/buildCodeLens";
import composeHoverMarkdownContent from "./utils/composeHoverMarkdownContent";

export function activate(context: vscode.ExtensionContext) {
  context.globalState.get<any>(context.extension.id, {});

  let regCodeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideCodeLenses(document, token) {
        // This is an option that can be enabled/disabled in the settings.
        const configurations =
          vscode.workspace.getConfiguration("npmPackageLinks");
        if (!configurations.get("useCodeLens")) {
          return;
        }
        const ast = tsquery.ast(document.getText());
        const nodes = tsquery(ast, "ImportDeclaration");
        return (
          nodes
            // get package name, returns "" if not a package
            .map((node) => constructPackageNameFromAstNode(node, document))
            // remove empty packages
            .filter(({ packageName }) => packageName !== "")
            .map(({ importLineText, packageName }) =>
              buildCodeLens(importLineText, packageName)
            )
            .flat()
        );
      },
    }
  );

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

  let regCommandDisposable = vscode.commands.registerCommand(
    "openPackage",
    async (...args: [string, "npm" | "github" | "homepage"]) => {
      const [packageName, destination] = args;
      if (destination === "npm") {
        const link = vscode.Uri.parse(
          `https://www.npmjs.com/package/${packageName}`
        );
        await vscode.commands.executeCommand("vscode.open", link);
      }

      if (destination !== "npm") {
        const packageDetails = await fetchPackageInfoFromNPM(packageName);

        if (!packageDetails) {
          return;
        }

        if (destination === "github") {
          const repoURL = (packageDetails.repository.url as string)
            .replace("git+", "")
            .replace(".git", "");
          const link = vscode.Uri.parse(repoURL);
          await vscode.commands.executeCommand("vscode.open", link);
        } else {
          const homeURL = (packageDetails.homepage as string).replace(
            "git+",
            ""
          );
          const link = vscode.Uri.parse(homeURL);
          await vscode.commands.executeCommand("vscode.open", link);
        }
      }

      vscode.window.showInformationMessage(
        "Link has been opened in your browser"
      );
    }
  );

  context.subscriptions.push(
    regHoverProviderDisposable,
    regCodeLensProviderDisposable,
    regCommandDisposable,
    regHoverForPackageJSON
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
