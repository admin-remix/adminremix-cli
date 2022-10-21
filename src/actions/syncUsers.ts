import { gql, GraphQLClient } from 'graphql-request';
import { getUsersByEmails } from "./getUsersByEmails";
import { writeFileSync, createReadStream } from "fs";
import { mapRow, parseCSV } from '../helper/utils';

const TEMP_FILE = "_temp.json";

export async function syncUsers({
  client,
  map,
  file,
  fileForDelete,
}: {
  client: GraphQLClient;
  map: Record<string, string>;
  file: string;
  fileForDelete: string;
}): Promise<boolean> {
  let mappedData: Record<string, any>[] = [];
  let deletableEmails: Set<string> = new Set<string>();

  if (file) {
    const csvData = await parseCSV(file);
    mappedData = csvData.map(row => mapRow(row, map));
  }

  if (fileForDelete) {
    const csvDelete = await parseCSV(fileForDelete);
    try {
      deletableEmails = new Set<string>(csvDelete.map(row => mapRow(row, map).email));
    } catch (e) {
      throw new Error(`File ${fileForDelete} does not have email.\nMake sure all records have email.`);
    }
  }

  const existingUsers = await getUsersByEmails(client, [
    ...mappedData.map(m => m.email),
    ...deletableEmails
  ]);
  let intent: string[] = [];
  {
    const inputs = mappedData.reduce((acc: {
      inputCreate: any[];
      inputUpdate: any[];
    }, cur) => {
      if (deletableEmails.has(cur.email)) return acc;
      const found = existingUsers[cur.email];
      if (found) {
        acc.inputUpdate.push({
          ...cur,
          ...found
        });
      } else {
        acc.inputCreate.push({
          ...cur,
          password: "random-new-password",
          createAccount: true,
          memberOfDepartments: []
        });
      }
      return acc;
    }, {
      inputCreate: (deletableEmails.size ? Array.from(deletableEmails) : []).reduce((acc2, cur2) => {
        if (existingUsers[cur2]) {
          acc2.push({
            email: cur2,
            deleteAccount: true
          })
        }
        return acc2;
      }, [] as any[]),
      inputUpdate: []
    } as {
      inputCreate: any[];
      inputUpdate: any[];
    });
    intent = [
      ...(inputs.inputCreate.length ? ["create"] : []),
      ...(inputs.inputUpdate.length ? ["update"] : [])
    ];
    if (!intent.length) {
      console.log("No data to upload");
      return false;
    }
    writeFileSync(TEMP_FILE, JSON.stringify({
      ...inputs,
      model: "User"
    }));
  }

  const result = await client.request<{
    uploadBulkEntity: boolean
  }>(gql`mutation ($model: String!, $file: Upload!, $intent: [BulkUploadIntents!]!) { uploadBulkEntity(file: $file, model: $model, intent: $intent) }`, {
    model: "User",
    intent,
    file: createReadStream(TEMP_FILE)
  });
  if (!result?.uploadBulkEntity) {
    throw new Error("Failed to upload");
  }
  return true;
}