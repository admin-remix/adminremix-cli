#!/usr/bin/env node

import { Command } from "commander";
import syncAction from "./commands/sync";
import { textSync } from "figlet";
const program = new Command();

program
  .name("assetremix-cli")
  .description("CLI to manage your AssetRemix workspace")
  .addHelpText("before", textSync("ADMINREMIX", "Big"));

program
  .command("sync")
  .description(
    "Sync entity with local CSV files. You can also provide a .env file for options."
  )
  .option("-t, --token <api-key>", "AssetRemix API key a.k.a token")
  .option("-e, --entity <entity-name>", "Entity name (e.g. User)")
  .option("-f, --file <csv-file>", "CSV file name for record create or update")
  .option(
    "-d, --file-for-delete <csv-file-for-delete>",
    "CSV file name for record delete"
  )
  .option("-m, --map <map-file>", "Mapping file(JSON file)")
  .option(
    "-c, --cron <cron-interval>",
    "Cron interval for running this command"
  )
  .option(
    "-p, --path <directory-path>",
    "Directory path(could be a zip file as well)"
  )
  .option("-V, --verbose", "Verbose mode")
  .action(syncAction);

program.parse();
