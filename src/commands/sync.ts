import { readENV, readMapping, GRAPHQL_ENDPOINT } from "../helper/utils";
import { gql, GraphQLClient } from 'graphql-request';
import { syncUsers } from "../actions/syncUsers";

export default async function (options: Record<string, string | boolean>): Promise<void> {
  try {
    let entity = options.entity || "";
    let file = options.file || "";
    let fileForDelete = options.fileForDelete || "";
    let mapFile = options.map || "";

    const env = readENV();

    if (!entity) entity = env.entity || env.ENTITY;

    if (!entity) {
      console.log("Entity not specified");
      return;
    } else if (entity != "User") {
      console.log("Unsupported entity: '%s'", entity);
      return;
    }

    if (!file) file = env.CSV || env.csv;
    if (!fileForDelete) fileForDelete = env.CSVDELETE || env.csvdelete;
    if (!file && !fileForDelete) {
      console.log("CSV file not specified");
      return;
    }

    if (!mapFile) mapFile = env.MAP || env.map;
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
  } catch (e) {
    console.log("Error: %s", (e as Error).message);
  }
}