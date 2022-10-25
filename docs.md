## Documentation

### Sync Command

```
Usage: adminremix-cli sync [options]

Sync entity with local CSV files. You can also provide a .env file for options.

Options:
  -t, --token <api-key>                        AssetRemix API key a.k.a token
  -e, --entity <entity-name>                   Entity name (e.g. User)
  -f, --file <csv-file>                        CSV file name for record create or update
  -d, --file-for-delete <csv-file-for-delete>  CSV file name for record delete
  -m, --map <map-file>                         Mapping file(JSON file)
  -c, --cron <cron-interval>                   Cron interval for running this command
  -p, --path <directory-path>                  Directory path(could be a zip file as well)
  -V, --verbose                                Verbose mode
  -h, --help                                   display help for command

```
