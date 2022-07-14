import * as vscode from "vscode";

export function determinePackageNameForNPM(importPath: string): string {
  // local imports, not an npm package
  if (
    importPath.startsWith("/") ||
    importPath.startsWith("./") ||
    importPath.startsWith("../") ||
    importPath.startsWith("~")
  ) {
    return "";
  }

  // npm package belongs to organization or is in tsconfig
  if (importPath.startsWith("@")) {
    const pathsArray = importPath.split("/");
    return `${pathsArray[0]}/${pathsArray[1]}`;
  }

  // return only the first path without a package
  return importPath.split("/")[0];
}

export function buildLink(importTextLine: vscode.TextLine) {
  // to determine a package name is a little tricky, make cross reference with
  // because paths are included, also exclude local files
  const importLine = importTextLine.text
    .replace("'", '"')
    // replaceAll is currently unavaible on the target es version for this
    // project, so excuse this dirty workaround
    .replace("'", '"')
    .split('"')[1];

  const packageName = determinePackageNameForNPM(importLine);

  if (packageName === "") {
    return null;
  }

  const startCharacter = importTextLine.text.indexOf(packageName);
  const endCharacter = startCharacter + packageName.length;
  const linkRange = new vscode.Range(
    importTextLine.lineNumber,
    startCharacter,
    importTextLine.lineNumber,
    endCharacter
  );

  const linkUri = `https://www.npmjs.com/package/${packageName}`;

  return new vscode.CodeLens(linkRange, {
    title: `View ${packageName} on npmjs.com`,
    command: "openPackageOnNPM",
    arguments: [linkUri],
  });
}

export function activate(context: vscode.ExtensionContext) {
  let regCodeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideCodeLenses(document, token) {
        return Array.from(Array(document.lineCount).keys())
          .map((line) => document.lineAt(line))
          .filter((lineContent) => {
            if (lineContent.text.includes("import")) {
              return true;
            }
            return false;
          })
          .map((importLineText) => {
            return buildLink(importLineText);
          })
          .filter((importPath) => {
            if (importPath) {
              return importPath;
            }
            return false;
          }) as vscode.CodeLens[];
      },
    }
  );

  let regCommandDisposable = vscode.commands.registerCommand(
    "openPackageOnNPM",
    async (...args) => {
      const link = vscode.Uri.parse(args[0]);
      await vscode.commands.executeCommand("vscode.open", link);
      vscode.window.showInformationMessage(
        "Link has been opened in your browser"
      );
    }
  );

  context.subscriptions.push(regCodeLensProviderDisposable);
  context.subscriptions.push(regCommandDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
