#!/usr/bin/env node

import { Command } from 'commander';
import syncAction from "./commands/sync" ;
import mainAction from "./commands";
const program = new Command();
//import { version } from "../package.json";

program
  .name('assetremix-cli')
  .description('CLI to manage your AssetRemix workspace')
  .option('-V, --verbose', 'Verbose mode')
  .action(mainAction);

program.command('sync')
  .description('Sync entity with local CSV file. It also takes a .env file is as options.')
  .option('-e, --entity <entity-name>', 'Entity name (e.g. User)')
  .option('-f, --file <csv-file>', 'CSV file name')
  .option('-m, --map <map-file>', 'Mapping file(JSON file)')
  .option('-V, --verbose', 'Verbose mode')
  // .option('-s, --separator <char>', 'separator character', ',')
  .action(syncAction);

program.parse();