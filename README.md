# AdminRemix CLI Tool


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
