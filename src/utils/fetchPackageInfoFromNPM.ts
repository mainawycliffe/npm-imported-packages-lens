import * as got from "got";

export default async function fetchPackageInfoFromNPM(packageName: string) {
  const res = await got.got.get(
    `https://registry.npmjs.com/${packageName}/latest`
  );
  if (res.statusCode === 200) {
    return JSON.parse(res.body);
  }
  if (res.statusCode === 404) {
    return undefined;
  }
  throw new Error(`Failed to fetch package info for ${packageName}`);
}
