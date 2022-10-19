import { readFileSync, existsSync, createReadStream } from "fs";
import { parse } from "dotenv";
import { parse as papaparse } from "papaparse";

export function readENV():Record<string, string> {
  if(!existsSync(".env")) {
    throw new Error("Error: Config not found.\nMake sure to put the token in a .env file in the current directory.");
  }
  const content = readFileSync(".env", "utf-8");
  return parse(content);
}

export function readMapping():Record<string, string> {
  if(!existsSync("map.json")) {
    throw new Error("Error: Mapper not found.\nMake sure to put the CSV column mapper as map.json file in the current directory.");
  }
  const content = readFileSync("map.json", "utf-8");
  return JSON.parse(content);
}

export function parseCSV(file: string):Promise<Record<string, string>[]> {
  return new Promise((res,rej)=>{
    if(!existsSync(file)) {
      rej(new Error(`File ${file} not found`));
      return;
    }
    const readable = createReadStream(file, "utf-8");
    papaparse(readable, {
      complete: ({data})=>{
        if(data.length<2) {
          rej(new Error("CSV file should have at least 1 row after header"));
          return;
        }
        const header = data[0] as string[];
        const result = (data as string[][]).slice(1).map((row)=>{
          return header.reduce((acc, cur, index)=>{
            const columnName = cur.trim();
            if(!columnName) throw new Error("CSV header should not be blank");
            acc[columnName]=row[index] || "";
            return acc;
          }, {} as Record<string, string>);
        });
        res(result);
      },
      error: (e)=>{
        rej(e);
      }
    });
  })
}