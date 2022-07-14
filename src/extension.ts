// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

export function determinePackageNameForNPM(importPath: string): string {
  return "";
}

export function buildLink(importTextLine: vscode.TextLine) {
  // to determine a package name is a little tricky, make cross reference with
  // because paths are included, also exclude local files
  const packageName = importTextLine.text.split('"')[1];

  const startCharacter = importTextLine.text.indexOf(packageName);
  const endCharacter = startCharacter + packageName.length;
  const linkRange = new vscode.Range(
    importTextLine.lineNumber,
    startCharacter,
    importTextLine.lineNumber,
    endCharacter
  );

  const linkUri = vscode.Uri.parse(
    `https://www.npmjs.com/package/${packageName}`
  );
  return new vscode.DocumentLink(linkRange, linkUri);
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.languages.registerDocumentLinkProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideDocumentLinks(document, token) {
        console.log(document, token);
        vscode.window.showInformationMessage(
          "Hello World from Link Package NPM!"
        );

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
          });
      },
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
