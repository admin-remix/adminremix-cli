#!/usr/bin/env node

import { Command } from 'commander';
import syncAction from "./commands/sync" ;
const program = new Command();
//import { version } from "../package.json";

program
  .name('assetremix-cli')
  .description('CLI to manage your AssetRemix workspace');

program.command('sync')
  .description('Sync entity with local CSV file')
  .argument('<entity>', 'Entity name (e.g. User)')
  .argument('<filename>', 'CSV file name')
  .option('-V, --verbose', 'Verbose mode')
  // .option('-s, --separator <char>', 'separator character', ',')
  .action(syncAction);

program.parse();