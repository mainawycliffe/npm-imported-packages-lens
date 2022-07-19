import * as vscode from "vscode";
import got from "got";
import { tsquery } from "@phenomnomnominal/tsquery";
import { SyntaxKind } from "typescript";
import ts = require("typescript");

export async function fetchPackageInfoFromNPM(packageName: string) {
  const res = await got.get(`https://registry.npmjs.com/${packageName}/latest`);
  return JSON.parse(res.body);
}

export function determinePackageNameForNPM(importPath: string): string {
  // if import path is undefined
  if (!importPath) {
    return "";
  }
  const cleanImportPath = importPath.replace(/'/g, "").replace(/"/g, "").trim();
  // local imports, not an npm package
  if (
    cleanImportPath.startsWith("/") ||
    cleanImportPath.startsWith("./") ||
    cleanImportPath.startsWith("../") ||
    cleanImportPath.startsWith("~")
  ) {
    return "";
  }

  // npm package belongs to organization or is in tsconfig
  if (cleanImportPath.startsWith("@")) {
    const pathsArray = cleanImportPath.split("/");
    return `${pathsArray[0]}/${pathsArray[1]}`;
  }

  // return only the first path without a package
  return cleanImportPath.split("/")[0];
}

export function constructPackageNameFromAstNode(
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

export function buildCodeLens(
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
    new vscode.CodeLens(codeLensRange, {
      title: "StackOverflow",
      command: "openPackage",
      arguments: [packageName, "stackoverflow"],
    }),
  ];
}

export function activate(context: vscode.ExtensionContext) {
  context.globalState.get<any>(context.extension.id, {});

  let regCodeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideCodeLenses(document, token) {
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

  let regCommandDisposable = vscode.commands.registerCommand(
    "openPackage",
    async (
      ...args: [string, "npm" | "github" | "homepage" | "stackoverflow"]
    ) => {
      const [packageName, destination] = args;
      if (destination === "npm") {
        const link = vscode.Uri.parse(
          `https://www.npmjs.com/package/${packageName}`
        );
        await vscode.commands.executeCommand("vscode.open", link);
      }

      if (destination !== "npm") {
        const packageDetails = await fetchPackageInfoFromNPM(packageName);

        if (destination === "github") {
          const repoURL = (packageDetails.repository.url as string)
            .replace("git+", "")
            .replace(".git", "");
          const link = vscode.Uri.parse(repoURL);
          await vscode.commands.executeCommand("vscode.open", link);
        } else if (destination === "stackoverflow") {
          const soURL = `https://stackoverflow.com/search?q=${packageName}`;
          const link = vscode.Uri.parse(soURL);
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
    regCodeLensProviderDisposable,
    regCommandDisposable
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
