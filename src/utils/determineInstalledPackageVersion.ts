import * as vscode from "vscode";
import { registryPackageAPIResponseSchema } from "./fetchPackageInfoFromNPM";

export default async function determineInstalledPackageVersion(
  packageName: string
) {
  const files = await vscode.workspace.findFiles("**/package.json");
  const content = await vscode.workspace.fs.readFile(files[0]);
  const { dependencies, devDependencies, peerDependencies } =
    registryPackageAPIResponseSchema.parse(JSON.parse(content.toString()));
  const allDependencies = {
    ...(dependencies ?? {}),
    ...(devDependencies ?? {}),
    ...(peerDependencies ?? {}),
  };
  if (!allDependencies[packageName]) {
    return "latest";
  }
  return allDependencies[packageName].replace("^", "").replace("~", "");
}
