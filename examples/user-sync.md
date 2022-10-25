# Example - User Sync

The following example will create/update users from `User-Create.csv` file and
will delete users from `User-Delete.csv` file if exist. The `Map.json` file will
be used to map the columns from these custom columns to AssetRemix fields.

**Map.json**

```
{
  "Given Name": "firstName",
  "Family Name": "lastName",
  "Email Address": "email"
}
```

**User-Create.csv**

```
Given Name,Family Name,Email Address,Nick Name
Tony,Stark,tony@mail.com,Iron Man
Steve,Rogers,steve@mail.com,Captain America
Peter,Parker,peter@mail.com,Spider-Man
```

**User-Delete.csv**

```
Given Name,Family Name,Email Address,Nick Name
Scott,Lang,scott@mail.com,Ant Man
Clint,Barton,clint@mail.com,Hawkeye
```

## Using options

Keep the above files in a folder and run the following in terminal

```
adminremix-cli sync -t "your-asset-remix-api-key" -e User -m "map.json" -f "User-Create.csv" -d "User-Delete.csv"
```

## Using `.env` File

**.env**

```
TOKEN=your-asset-remix-api-key
MAP=Map.json
ENTITY=User
FILE="User-Create.csv"
FILEFORDELETE="User-Delete.csv"
```

Keep the above files in a folder and run the following in terminal

```
adminremix-cli sync
```
