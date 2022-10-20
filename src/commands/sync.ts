import { readENV, parseCSV, readMapping } from "../helper/utils";
import { GRAPHQL_ENDPOINT } from "../helper/client";
import { gql, GraphQLClient } from 'graphql-request';
import { writeFileSync, createReadStream } from "fs";

type KeyVal<T=string> = Record<string, T>;
const TEMP_FILE = "_temp.json";

function mapRow(csvRow: KeyVal, map: KeyVal):Record<string, any> {
  return Object.keys(csvRow).reduce((acc, cur) => {
    const mappedColumn = map[cur];
    if(mappedColumn) {
      acc[mappedColumn]=csvRow[cur];
    }
    return acc;
  }, {} as Record<string, any>);
}

export default async function(options:Record<string, string|boolean>):Promise<void> {
  let entity = options.entity || "";
  let file = options.file || "";
  let mapFile = options.map || "";
  try{
    const env = readENV();

    if(!entity) entity = env.entity || env.ENTITY;

    if(!entity) {
      console.log("Entity not specified");
      return;
    } else if(entity != "User") {
      console.log("Unsupported entity: '%s'", entity);
      return;
    }

    if (!file) file = env.CSV || env.csv;
    if (!file) {
      console.log("CSV file not specified");
      return;
    }

    if (!mapFile) mapFile = env.MAP || env.map;
    if (!mapFile) {
      console.log("Map file not specified");
      return;
    }

    const token = env.token || env.TOKEN;
    if(!token) {
      console.log("Error: .env file does not have token\nPlease add token in the .env file");
      return;
    }
    const client = new GraphQLClient(GRAPHQL_ENDPOINT, { headers: { 'x-api-key': token } });
    {
      if(options.verbose) console.log("Verifying AssetRemix account..");
      const data = await client.request<{
        me: {
          email: string;
          tenant: {
            displayName: string;
          }
        }
      }>(gql`query { me { email tenant { displayName } } }`);
      if(!data?.me) {
        console.log("Error: Invalid token.\nPlease generate an API token from your AssetRemix workspace.");
        return;
      }
      if(options.verbose) console.log("Token is valid");
      if(options.verbose) console.log("Account: %s\nWorkspace: %s",data.me.email, data.me.tenant.displayName);
    }

    let mappedData:Record<string, any>[]= [];
    {
      const map = readMapping(mapFile as string);
      const csvData = await parseCSV(file as string);
      mappedData = csvData.map(row=>mapRow(row, map));
    }

    {
      const emailsToCheck = mappedData.map(m=>m.email);
      const data = await client.request<{
        searchUsers?: {
          node: {
            id: number;
            email: string;
          }[]
        }
      }>(gql`query($pagination: Pagination!, $searchBy: SearchBy!) {
        searchUsers(pagination: $pagination, searchBy: $searchBy) {
          node {
            id
            email
          }
        }
      }`, {
        pagination: {},
        searchBy:{
          searchBy:[
            {
              column:"email",
              searchMode:"AND",
              searchType: "IN",
              valueType: "ARRAY",
              value: JSON.stringify(emailsToCheck)
            }
          ]
        }
      });
      if(!data?.searchUsers?.node) {
        throw new Error("Cannot connect to server.");
      }
      const existingEmailToID = data.searchUsers.node.reduce((acc, cur)=>{
        acc[cur.email] = cur.id;
        return acc;
      }, {} as Record<string, number>);

      const inputs = mappedData.reduce((acc, cur)=>{
        const foundId = existingEmailToID[cur.email];
        if(foundId) {
          acc.inputUpdate.push({
            ...cur,
            id: foundId
          });
        }else{
          acc.inputCreate.push({
            ...cur,
            password: "random-new-password",
            createAccount: true
          });
        }
        return acc;
      }, {
        model: entity,
        inputCreate: [],
        inputUpdate: []
      } as {
        model: string;
        inputCreate: any[];
        inputUpdate: any[];
      });
      writeFileSync(TEMP_FILE, JSON.stringify(inputs));

      const result = await client.request<{
        uploadBulkEntity: boolean
      }>(gql`mutation ($model: String!, $file: Upload!, $intent: [BulkUploadIntents!]!) { uploadBulkEntity(file: $file, model: $model, intent: $intent) }`, {
        model: entity,
        intent: [
          ...(inputs.inputCreate.length? ["create"] : []),
          ...(inputs.inputUpdate.length? ["update"] : [])
        ],
        file: createReadStream(TEMP_FILE)
      });
      if(!result?.uploadBulkEntity) {
        throw new Error("Failed to upload");
      }
      if(options.verbose) console.log(JSON.stringify(result, null, 1));
      console.log("Request sent successfully");
    }
  }catch(e){
    console.log("Error: %s", (e as Error).message);
  }
}