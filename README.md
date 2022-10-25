# AdminRemix CLI Tool

```
           _____  __  __ _____ _   _ _____  ______ __  __ _______   __
     /\   |  __ \|  \/  |_   _| \ | |  __ \|  ____|  \/  |_   _\ \ / /
    /  \  | |  | | \  / | | | |  \| | |__) | |__  | \  / | | |  \ V /
   / /\ \ | |  | | |\/| | | | | . ` |  _  /|  __| | |\/| | | |   > <
  / ____ \| |__| | |  | |_| |_| |\  | | \ \| |____| |  | |_| |_ / . \
 /_/    \_\_____/|_|  |_|_____|_| \_|_|  \_\______|_|  |_|_____/_/ \_\


Usage: adminremix-cli [options] [command]

CLI to manage your AssetRemix workspace

Options:
  -h, --help      display help for command

Commands:
  sync [options]  Sync entity with local CSV files. You can also provide a .env file for options.
  help [command]  display help for command

```

## Installation

```
npm install
```

## Build

```
npm run build
```

## Test

1. Create a .env file with token from AssetRemix workspace. Example:

```
TOKEN=assetremix-token-here
```

2. Create a map.json file with csv file columns to AssetRemix field. Example:

```
{
  "Column A": "firstName",
  "Column B": "lastName",
  "Column C": "email"
}
```

Then run

```
npm start -- sync User demo.csv
```

## Make Executatable

```
pkg .
```

## ENV vs Options

Following CLI options are also available through ENV file

|         CLI Option          |    ENV Key    |
| :-------------------------: | :-----------: |
|      `-t` or `--token`      |     TOKEN     |
|       `-m` or `--map`       |      MAP      |
|     `-e` or `--entity`      |    ENTITY     |
|      `-p` or `--path`       |     PATH      |
|      `-f` or `--file`       |     FILE      |
| `-d` or `--file-for-delete` | FILEFORDELETE |
|      `-c` or `--cron`       |     CRON      |
