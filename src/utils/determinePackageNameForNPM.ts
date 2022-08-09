export default function determinePackageNameForNPM(importPath: string): string {
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
