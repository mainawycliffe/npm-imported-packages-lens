import * as vscode from "vscode";
import provideHoverForPackageJSON from "./utils/provideHoverForPackageJSON";
import provideHoverForESImports from "./utils/provideHoverForESImports";
import { provideHoverForVue } from "./utils/provideHoverForVue";
import { provideHoverForAstro } from "./utils/provideHoverForAstro";
import { provideHoverForSvelte } from "./utils/provideHoverForSvelte";

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

  const regHoverForAstro = vscode.languages.registerHoverProvider(["astro"], {
    provideHover: provideHoverForAstro,
  });

  const regHoverForSvelte = vscode.languages.registerHoverProvider(["svelte"], {
    provideHover: provideHoverForSvelte,
  });

  context.subscriptions.push(
    regHoverProviderDisposable,
    regHoverForPackageJSON,
    regHoverForVue,
    regHoverForAstro,
    regHoverForSvelte
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
