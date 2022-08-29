import * as vscode from "vscode";
import fetchPackageInfoFromNPM from "./fetchPackageInfoFromNPM";

export default async function composeHoverMarkdownContent(packageName: string) {
  try {
    // fetch info about package from npm
    const packageDetails = await fetchPackageInfoFromNPM(packageName);

    if (!packageDetails) {
      return null;
    }

    const gitRepositoryURL = (packageDetails.repository.url as string)
      .replace("git+", "")
      .replace(".git", "");

    const docsHomePageURL = (packageDetails.homepage as string).replace(
      "git+",
      ""
    );

    const reportBugURL = packageDetails.bugs.url;

    const packageDescription = packageDetails.description;

    const hoverContent = new vscode.MarkdownString(
      `**NPM Package Links for ${packageName}**

${packageDescription ? packageDescription : ""}

[NPM](https://npmjs.com/package/${packageName}) | [GitHub](${gitRepositoryURL}) | [Homepage](${docsHomePageURL})
${
  reportBugURL
    ? `

[View Issues/Report Bug](${reportBugURL})

`
    : ""
}
`,
      true
    );

    hoverContent.isTrusted = true;

    return new vscode.Hover(hoverContent);
  } catch (e) {
    console.error(e);
    return null;
  }
}
