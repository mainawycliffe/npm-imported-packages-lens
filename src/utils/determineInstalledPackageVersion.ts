import * as vscode from "vscode";
import { registryPackageAPIResponseSchema } from "./fetchPackageInfoFromNPM";

export function isPackageJSONFileEmpty(file: vscode.Uri) {
  const content = vscode.workspace.fs.readFile(file);
  try {
    const parsedContent = registryPackageAPIResponseSchema.parse(
      JSON.parse(content.toString()),
    );
    // if dependencies, devDependencies, and peerDependencies are all empty, we
    // consider the file empty and return true
    if (
      !parsedContent.dependencies &&
      !parsedContent.devDependencies &&
      !parsedContent.peerDependencies
    ) {
      return true;
    }
    return false;
  } catch (_) {
    return true;
  }
}

/**
 *
 * We start in the current directory and go up the directory tree until we find
 * a package.json file. If we don't find a package.json file in the current
 * directory or its parent directory, we return the first package.json file.
 *
 */
export function determineClosestPackageJSONFile(
  files: vscode.Uri[],
  currentPath?: string,
) {
  // if there is only one package.json file, we return that file or if there is
  // no current path, we return the first file
  if (files.length === 1 || !currentPath) {
    return files[0];
  }

  // we take the current path, remove the file name, and then go up the
  // directory and check if there is a package.json file in that directory
  // or any of its parent directories
  const currentDirectory = currentPath?.split("/").slice(0, -1).join("/");

  // if we don't find a package.json file in the current directory or its parent
  // directory we return the first package.json file
  if (!currentDirectory) {
    return files[0];
  }
  const packageJSONFile = files.find((file) => {
    // we add a backslash to the current directory to ensure that we are not in
    // a  directory with a similar name to the current directory
    if (file.path.includes(`${currentDirectory}/`)) {
      return true;
    }
    return false;
  });

  // once we find a package.json file, we check if it is empty and if it is not
  // we return it as the closest package.json file
  if (packageJSONFile && !isPackageJSONFileEmpty(packageJSONFile)) {
    return packageJSONFile;
  }
  // if we don't find a package.json file in the current directory or its parent
  // we repeat the process for the parent directory
  return determineClosestPackageJSONFile(files, currentDirectory);
}

export default async function determineInstalledPackageVersion(
  packageName: string,
) {
  const files = await vscode.workspace.findFiles("**/package.json");
  const currentPath = vscode.window.activeTextEditor?.document.uri.path;
  const packageJSONFile =
    files.length === 1
      ? files[0]
      : determineClosestPackageJSONFile(files, currentPath);
  const content = await vscode.workspace.fs.readFile(packageJSONFile);
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
