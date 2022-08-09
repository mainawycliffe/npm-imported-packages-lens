import * as vscode from "vscode";
import provideHoverForPackageJSON from "./utils/provideHoverForPackageJSON";
import provideHoverForESImports from "./utils/provideHoverForESImports";

export function activate(context: vscode.ExtensionContext) {
  let regHoverProviderDisposable = vscode.languages.registerHoverProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideHover: provideHoverForESImports,
    }
  );

  let regHoverForPackageJSON = vscode.languages.registerHoverProvider(
    {
      pattern: "**/package.json",
    },
    {
      provideHover: provideHoverForPackageJSON,
    }
  );

  context.subscriptions.push(
    regHoverProviderDisposable,
    regHoverForPackageJSON
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
