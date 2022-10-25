import { readENV, readMapping, GRAPHQL_ENDPOINT, temp } from "../helper/utils";
import { gql, GraphQLClient } from "graphql-request";
import { syncUsers } from "../actions/syncUsers";
import { schedule, validate } from "node-cron";
import { lstatSync, existsSync } from "fs";
import AdmZip from "adm-zip";
import { join } from "path";

async function doSync(
  options: Record<string, string>,
  environment?: Record<string, string>
): Promise<void> {
  const env = environment || readENV();

  const entity = options.entity || env.entity || env.ENTITY;
  if (!entity) {
    console.log("Entity not specified");
    return;
  } else if (entity != "User") {
    console.log("Unsupported entity: '%s'", entity);
    return;
  }

  const token = options.token || env.token || env.TOKEN;
  if (!token) {
    console.log(
      "Error: Token not specified\nPlease provide token through option or add token in the .env file"
    );
    return;
  }

  let file = options.file || env.FILE || env.file;
  let fileForDelete =
    options.fileForDelete || env.FILEFORDELETE || env.filefordelete;
  if (!file && !fileForDelete) {
    console.log("CSV file not specified");
    return;
  }
  let folder = options.path || env.PATH || env.path || "";
  if (folder) {
    const stat = lstatSync(folder);
    if (stat.isFile()) {
      const zip = new AdmZip(folder);
      const entries = zip.getEntries().map((m) => m.entryName);
      if (options.verbose) console.log("Path is a zip file.");
      if (file && !entries.includes(file)) {
        throw new Error(`File ${file} does not exist in zip.`);
      }
      if (fileForDelete && !entries.includes(fileForDelete)) {
        throw new Error(`File ${fileForDelete} does not exist in zip.`);
      }
      const tempFolder = temp.mkdirSync({
        prefix: "adminremix",
      });
      if (options.verbose) console.log("Unzipping to:", tempFolder);
      if (file) {
        zip.extractEntryTo(file, tempFolder);
        file = join(tempFolder, file);
      }
      if (fileForDelete) {
        zip.extractEntryTo(fileForDelete, tempFolder);
        fileForDelete = join(tempFolder, fileForDelete);
      }
    } else if (stat.isDirectory()) {
      if (file) {
        file = join(folder, file);
        if (!existsSync(file)) throw new Error(`File ${file} does not exist`);
      }
      if (fileForDelete) {
        fileForDelete = join(folder, fileForDelete);
        if (!existsSync(fileForDelete))
          throw new Error(`File ${fileForDelete} does not exist`);
      }
    } else {
      throw new Error(
        `Path ${folder} does not exist.\nMake sure the path is a directory or a zip file.`
      );
    }
  }

  const mapFile = options.map || env.MAP || env.map;
  if (!mapFile) {
    console.log("Map file not specified");
    return;
  }

  const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: { "x-api-key": token },
  });
  {
    if (options.verbose) console.log("Verifying AssetRemix account..");
    const data = await client.request<{
      me: {
        email: string;
        tenant: {
          displayName: string;
        };
      };
    }>(
      gql`
        query {
          me {
            email
            tenant {
              displayName
            }
          }
        }
      `
    );
    if (!data?.me) {
      console.log(
        "Error: Invalid token.\nPlease generate an API token from your AssetRemix workspace."
      );
      return;
    }
    if (options.verbose) console.log("Token is valid");
    if (options.verbose)
      console.log(
        "Account: %s\nWorkspace: %s",
        data.me.email,
        data.me.tenant.displayName
      );
  }

  const map = readMapping(mapFile as string);

  let result = false;
  if (entity === "User") {
    result = await syncUsers({
      client,
      map,
      file: file as string,
      fileForDelete: fileForDelete as string,
      options,
    });
  }
  if (result) console.log("Request sent successfully");
}

export default async function (options: Record<string, string>): Promise<void> {
  try {
    const env = readENV();

    await doSync(options, env);
    temp.cleanupSync();
    const cron = options.cron || env.CRON || env.cron;
    if (cron) {
      if (!validate(cron)) throw new Error("Cron expression is wrong.");
      console.log("Schedule set. Waiting..");
      schedule(cron, () => {
        doSync(options)
          .then(() => {
            console.log("Waiting for next interval..");
            temp.cleanupSync();
          })
          .catch((e) => {
            console.log("Error: %s", (e as Error).message);
            temp.cleanupSync();
          });
      });
    }
  } catch (e) {
    console.log("Error: %s", (e as Error).message);
  }
}
