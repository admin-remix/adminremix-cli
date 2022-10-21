import { readENV, readMapping, GRAPHQL_ENDPOINT } from "../helper/utils";
import { gql, GraphQLClient } from 'graphql-request';
import { syncUsers } from "../actions/syncUsers";
import { schedule, validate } from "node-cron";

async function doSync(options: Record<string, string>, environment?: Record<string, string>): Promise<void> {
  const env = environment || readENV();

  const entity = options.entity || env.entity || env.ENTITY;
  if (!entity) {
    console.log("Entity not specified");
    return;
  } else if (entity != "User") {
    console.log("Unsupported entity: '%s'", entity);
    return;
  }
  const file = options.file || env.CSV || env.csv;
  const fileForDelete = options.fileForDelete || env.CSVDELETE || env.csvdelete;
  if (!file && !fileForDelete) {
    console.log("CSV file not specified");
    return;
  }

  const mapFile = options.map || env.MAP || env.map;
  if (!mapFile) {
    console.log("Map file not specified");
    return;
  }

  const token = env.token || env.TOKEN;
  if (!token) {
    console.log("Error: .env file does not have token\nPlease add token in the .env file");
    return;
  }
  const client = new GraphQLClient(GRAPHQL_ENDPOINT, { headers: { 'x-api-key': token } });
  {
    if (options.verbose) console.log("Verifying AssetRemix account..");
    const data = await client.request<{
      me: {
        email: string;
        tenant: {
          displayName: string;
        }
      }
    }>(gql`query { me { email tenant { displayName } } }`);
    if (!data?.me) {
      console.log("Error: Invalid token.\nPlease generate an API token from your AssetRemix workspace.");
      return;
    }
    if (options.verbose) console.log("Token is valid");
    if (options.verbose) console.log("Account: %s\nWorkspace: %s", data.me.email, data.me.tenant.displayName);
  }

  const map = readMapping(mapFile as string);

  let result = false;
  if (entity === "User") {
    result = await syncUsers({
      client,
      map,
      file: file as string,
      fileForDelete: fileForDelete as string
    })
  }
  if (result) console.log("Request sent successfully");
}

export default async function (options: Record<string, string>): Promise<void> {
  try {
    const env = readENV();

    await doSync(options, env);

    const cron = options.cron || env.CRON || env.cron;
    if (cron) {
      if (!validate(cron)) throw new Error("Cron expression is wrong.");
      console.log("Schedule set. Waiting..");
      schedule(cron, () => {
        doSync(options).then(() => {
          console.log("Waiting for next interval..");
        }).catch(e => {
          console.log("Error: %s", (e as Error).message);
        });
      })
    }

  } catch (e) {
    console.log("Error: %s", (e as Error).message);
  }
}