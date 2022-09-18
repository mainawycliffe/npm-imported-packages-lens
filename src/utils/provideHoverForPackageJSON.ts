import * as vscode from "vscode";
import composeHoverMarkdownContent from "./composeHoverMarkdownContent";
import { z } from "zod";

// we want to validate that the package.json is valid or has the fields we want
// i.e. peerDependencies, dependencies, devDependencies
const partialPackageJSONSchema = z.object(
  {
    dependencies: z.optional(z.record(z.string())),
    devDependencies: z.optional(z.record(z.string())),
    peerDependencies: z.optional(z.record(z.string())),
  },
  {
    description:
      "Partial package.json schema with dependencies, devDependencies and peerDependencies",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    invalid_type_error:
      "Invalid package.json, the dependencies, devDependencies and peerDependencies should be a key-value object",
  }
);

const provideHoverForPackageJSON: vscode.HoverProvider["provideHover"] = (
  document,
  position,
  token
) => {
  const packageJSONContent = partialPackageJSONSchema.parse(
    JSON.parse(document.getText())
  );
  const hoveredText = document.lineAt(position).text.trim().replace(",", "");
  const allDependenciesInPackageJSON: Record<string, string> = {
    ...packageJSONContent.dependencies,
    ...packageJSONContent.devDependencies,
    ...packageJSONContent.peerDependencies,
  };
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
