import { Command } from "commander";
import { hasENV } from "../helper/utils";
import { textSync } from "figlet";
import syncAction from "./sync";

// Unused
export default async function (option: Record<string, string>, cmd: Command): Promise<void> {
  if (!hasENV()) {
    console.log(textSync('ADMINREMIX', 'Big'));
    cmd.outputHelp();
    return;
  }
  await syncAction(option);
}