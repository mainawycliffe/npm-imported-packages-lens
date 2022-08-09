import * as vscode from "vscode";
import composeHoverMarkdownContent from "./composeHoverMarkdownContent";

const provideHoverForPackageJSON: vscode.HoverProvider["provideHover"] = (
  document,
  position,
  token
) => {
  const packageJSONContent = JSON.parse(document.getText());
  const hoveredText = document.lineAt(position).text.trim().replace(",", "");

  const allDependenciesInPackageJSON = {
    ...packageJSONContent.dependencies,
    ...packageJSONContent.devDependencies,
    ...packageJSONContent.peerDependencies,
  } as Record<string, string>;

  // if the hovered text is a dependency in the package.json file
  const hoveredTextInDependencyList = Object.entries(
    allDependenciesInPackageJSON
  ).filter(([packageName, version]) => {
    const dependencyLine = `"${packageName}": "${version}"`;
    if (dependencyLine === hoveredText) {
      return true;
    }
    return false;
  });
  if (hoveredTextInDependencyList.length !== 1) {
    return null;
  }
  const [packageName] = hoveredTextInDependencyList[0];
  return composeHoverMarkdownContent(packageName);
};

export default provideHoverForPackageJSON;
