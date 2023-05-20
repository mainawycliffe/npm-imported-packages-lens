import * as vscode from "vscode";
import provideHoverForPackageJSON from "./utils/provideHoverForPackageJSON";
import provideHoverForESImports from "./utils/provideHoverForESImports";
import { provideHoverForVue } from "./utils/provideHoverForVue";

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

  const regHoverForVue = vscode.languages.registerHoverProvider(["vue"], {
    provideHover: provideHoverForVue,
  });

  context.subscriptions.push(
    regHoverProviderDisposable,
    regHoverForPackageJSON,
    regHoverForVue
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
