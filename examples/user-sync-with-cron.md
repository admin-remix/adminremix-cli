# Example - User Sync with Cron

The following example will create/update users from `User-Update.csv` file.
The `Map.json` file will be used to map the columns from these custom columns
to AssetRemix fields. The program will use the provided cron expression to
schedule and run in a loop.

_Note: The program will not end and will wait for next interval._

**Map.json**

```
{
  "Given Name": "firstName",
  "Family Name": "lastName",
  "Email Address": "email"
}
```

**User-Update.csv**

```
Given Name,Family Name,Email Address,Nick Name
Tony,Stark,tony@mail.com,Iron Man
Steve,Rogers,steve@mail.com,Captain America
Peter,Parker,peter@mail.com,Spider-Man
```

## Using options

Keep the above files in a folder and run the following in terminal

```
adminremix-cli sync -t "your-asset-remix-api-key" -e User -m "map.json" -f "User-Update.csv" -c "5 4 * * *"
```

## Using `.env` File

**.env**

```
TOKEN=your-asset-remix-api-key
MAP=Map.json
ENTITY=User
FILE="User-Update.csv"
CRON="5 4 * * *"
```

Keep the above files in a folder and run the following in terminal

```
adminremix-cli sync
```
