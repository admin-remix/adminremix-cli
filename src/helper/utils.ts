import { readFileSync, existsSync, createReadStream } from "fs";
import { parse } from "dotenv";
import { parse as papaparse } from "papaparse";
import { track } from "temp";

export const GRAPHQL_ENDPOINT = "https://dev-graphql.adminremix.com";
export const temp = track();

const ENV_FILE = ".env";
const MAP_FILE = "map.json";

export function hasENV(): boolean {
  return existsSync(ENV_FILE);
}

export function readENV(): Record<string, string> {
  if (!hasENV()) return {};
  const content = readFileSync(ENV_FILE, "utf-8");
  return parse(content);
}

export function readMapping(file?: string): Record<string, string> {
  if (!existsSync(file || MAP_FILE)) {
    throw new Error(
      `Error: Mapper not found.\nMake sure to put the CSV column mapper as ${
        file || MAP_FILE
      } file in the current directory.`
    );
  }
  const content = readFileSync(file || MAP_FILE, "utf-8");
  return JSON.parse(content);
}

export function parseCSV(file: string): Promise<Record<string, string>[]> {
  return new Promise((res, rej) => {
    if (!existsSync(file)) {
      rej(new Error(`File ${file} not found`));
      return;
    }
    const readable = createReadStream(file, "utf-8");
    papaparse(readable, {
      complete: ({ data }) => {
        if (data.length < 2) {
          rej(new Error("CSV file should have at least 1 row after header"));
          return;
        }
        const header = data[0] as string[];
        const result = (data as string[][]).slice(1).map((row) => {
          return header.reduce((acc, cur, index) => {
            const columnName = cur.trim();
            if (!columnName) throw new Error("CSV header should not be blank");
            acc[columnName] = row[index] || "";
            return acc;
          }, {} as Record<string, string>);
        });
        res(result);
      },
      error: (e) => {
        rej(e);
      },
    });
  });
}

export type KeyVal<T = string> = Record<string, T>;

export function mapRow(csvRow: KeyVal, map: KeyVal): Record<string, any> {
  return Object.keys(csvRow).reduce((acc, cur) => {
    const mappedColumn = map[cur];
    if (mappedColumn) {
      acc[mappedColumn] = csvRow[cur];
    }
    return acc;
  }, {} as Record<string, any>);
}

export async function writeToTempFile(text: string): Promise<string> {
  return new Promise((res, rej) => {
    const stream = temp.createWriteStream();
    stream.once("open", () => {
      stream.write(text);
      stream.end();
      res(stream.path.toString());
    });
    stream.once("error", (e) => {
      rej(e);
    });
  });
}
