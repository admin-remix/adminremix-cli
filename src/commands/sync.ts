import { readENV, parseCSV, readMapping } from "../helper/utils";
import { callGraphQL } from "../helper/client";

type KeyVal<T=string> = Record<string, T>;

function mapRow(csvRow: KeyVal, map: KeyVal):Record<string, any> {
  return Object.keys(csvRow).reduce((acc, cur) => {
    const mappedColumn = map[cur];
    if(mappedColumn) {
      acc[mappedColumn]=csvRow[cur];
    }
    return acc;
  }, {} as Record<string, any>);
}

export default async function(entity: string, file: string, options:Record<string, boolean>):Promise<void> {
  if(entity != "User") {
    console.log("Unsupported entity: '%s'", entity);
    return;
  }
  try{
    const env = readENV();
    const token = env.token || env.TOKEN;
    if(!token) {
      console.log("Error: .env file does not have token\nPlease add token in the .env file");
      return;
    }
    if(options.verbose) console.log("Verifying AssetRemix account..");
    const { data } = await callGraphQL<{
      data: {
        me: {
          email: string;
          tenant: {
            displayName: string;
          }
        }
      }
    }>({
      url: 'https://dev-graphql.adminremix.com',
      token,
      query: `{ me { email tenant { displayName } } }`
    });
    if(!data?.me) {
      console.log("Error: Invalid token.\nPlease generate an API token from your AssetRemix workspace.");
      return;
    }
    if(options.verbose) console.log("Token is valid");
    if(options.verbose) console.log("Account: %s\nWorkspace: %s",data.me.email, data.me.tenant.displayName);

    const map = readMapping();

    const csvData = await parseCSV(file);
    const mappedData = csvData.map(row=>mapRow(row, map));
    console.log(mappedData);
    //TODO: sync here
  }catch(e){
    console.log("Error: %s", (e as Error).message);
    return;
  }
}