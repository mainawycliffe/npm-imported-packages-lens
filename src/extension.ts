import * as vscode from "vscode";
import got from "got";

export async function fetchPackageInfoFromNPM(packageName: string) {
  const res = await got.get(`https://registry.npmjs.com/${packageName}/latest`);
  console.log(JSON.stringify(JSON.parse(res.body), null, 2));
  return JSON.parse(res.body);
}

export function determinePackageNameForNPM(
  importTextLine: vscode.TextLine
): string {
  // to determine a package name is a little tricky, make cross reference with
  // because paths are included, also exclude local files
  const importPath = importTextLine.text
    .replace("'", '"')
    // replaceAll is currently unavaible on the target es version for this
    // project, so excuse this dirty workaround
    .replace("'", '"')
    .split('"')[1];

  // if import path is undfined
  if (!importPath) {
    return "";
  }

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

export async function buildLink(
  importTextLine: vscode.TextLine,
  packageName: string
) {
  const startCharacter = importTextLine.text.indexOf(packageName);
  const endCharacter = startCharacter + packageName.length;
  const linkRange = new vscode.Range(
    importTextLine.lineNumber,
    startCharacter,
    importTextLine.lineNumber,
    endCharacter
  );

  return [
    new vscode.CodeLens(linkRange, {
      title: `View ${packageName} on `,
      command: "",
    }),
    new vscode.CodeLens(linkRange, {
      title: `NPM`,
      command: "openPackage",
      arguments: [packageName, "npm"],
    }),
    new vscode.CodeLens(linkRange, {
      title: `GitHub`,
      command: "openPackage",
      arguments: [packageName, "github"],
    }),
    new vscode.CodeLens(linkRange, {
      title: `Homepage`,
      command: "openPackage",
      arguments: [packageName, "homepage"],
    }),
  ];
}

export function activate(context: vscode.ExtensionContext) {
  context.globalState.get<any>(context.extension.id, {});

  let regCodeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideCodeLenses(document, token) {
        const res = Array.from(Array(document.lineCount).keys())
          .map((line) => document.lineAt(line))
          .filter((lineContent) => {
            if (lineContent.text.includes("import")) {
              return true;
            }
            return false;
          })
          // get package name, returns "" if not a package
          .map((importLineText) => {
            const packageName = determinePackageNameForNPM(importLineText);
            return {
              packageName,
              importLineText,
            };
          })
          // remove empty packages
          .filter(({ packageName }) => packageName !== "")
          .map(({ importLineText, packageName }) => {
            return buildLink(importLineText, packageName);
          });

        let lenses: vscode.CodeLens[] = [];

        res.forEach(async (lensesArray) => {
          const lensesNested = await lensesArray;
          lensesNested.forEach((lens) => {
            lenses.push(lens);
          });
        });

        return lenses;
      },
    }
  );

  let regCommandDisposable = vscode.commands.registerCommand(
    "openPackage",
    async (...args: [string, "npm" | "github" | "homepage"]) => {
      console.log("Yay!", args);
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
