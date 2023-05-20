import * as vscode from "vscode";
import provideHoverForPackageJSON from "./utils/provideHoverForPackageJSON";
import provideHoverForESImports from "./utils/provideHoverForESImports";

export function activate(context: vscode.ExtensionContext) {
  const regHoverProviderDisposable = vscode.languages.registerHoverProvider(
    ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    {
      provideHover: provideHoverForESImports,
    }
  );

  const regHoverForPackageJSON = vscode.languages.registerHoverProvider(
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
