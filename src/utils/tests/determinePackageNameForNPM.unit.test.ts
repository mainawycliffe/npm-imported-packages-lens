import determinePackageNameForNPM from "../determinePackageNameForNPM";

type TestData = {
  importPath: string;
  expectedPackageName: string;
};

test.each`
  importPath                    | expectedPackageName
  ${""}                         | ${""}
  ${"./some/local/file.ts"}     | ${""}
  ${"~/some/local/file.ts"}     | ${""}
  ${"../../some/local/file.js"} | ${""}
  ${"/some/local/file.ts"}      | ${""}
  ${"@angular/common/http"}     | ${"@angular/common"}
  ${"@angular/core"}            | ${"@angular/core"}
  ${"react/some/file.ts"}       | ${"react"}
  ${`'@angular/common/http'`}   | ${"@angular/common"}
  ${`'@angular/core'`}          | ${"@angular/core"}
  ${`'react/some/file.ts'`}     | ${"react"}
  ${`"@angular/common/http"`}   | ${"@angular/common"}
  ${`"@angular/core"`}          | ${"@angular/core"}
  ${`"react/some/file.ts"`}     | ${"react"}
`(
  "If import path is $importPath, expect $expectedPackageName",
  ({ importPath, expectedPackageName }: TestData) => {
    expect(determinePackageNameForNPM(importPath)).toBe(expectedPackageName);
  }
);
