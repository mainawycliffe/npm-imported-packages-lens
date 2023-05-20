import * as got from "got";
import { z } from "zod";
import determineInstalledPackageVersion from "./determineInstalledPackageVersion";

export const registryPackageAPIResponseSchema = z.object(
  {
    name: z.string(),
    homepage: z.optional(z.string()),
    description: z.string().optional().nullable(),
    version: z.string(),
    license: z.string().optional().nullable(),
    repository: z.optional(
      z.object({
        url: z.string(),
      })
    ),
    bugs: z.optional(
      z.object({
        url: z.string(),
      })
    ),
    dependencies: z.record(z.string()).nullable().optional(),
    devDependencies: z.record(z.string()).nullable().optional(),
    peerDependencies: z.record(z.string()).nullable().optional(),
  },
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    invalid_type_error: "Invalid package information from NPM registry",
  }
);

type RegistryPackageAPIResponseType = z.infer<
  typeof registryPackageAPIResponseSchema
>;

export default async function fetchPackageInfoFromNPM(
  packageName: string
): Promise<RegistryPackageAPIResponseType | undefined> {
  const packageVersion = await determineInstalledPackageVersion(packageName);
  const res = await got.got.get(
    `https://registry.npmjs.com/${packageName}/${packageVersion}`
  );
  if (res.statusCode === 200) {
    return registryPackageAPIResponseSchema.parse(JSON.parse(res.body));
  }
  if (res.statusCode === 404) {
    return undefined;
  }
  throw new Error(`Failed to fetch package info for ${packageName}`);
}
