# Crowdfire assignment

## Technologies used
-  Node.js
-  Anngular.js
-  Socket.io

## Running this project

1. Extract this project on to any directories
2. Change directory to "this" project directory
3. Install dependency required with command  `npm install`
4. To start  project use `npm start`
5. Acesss the app at `http://localhost:3000`


## Project structure
It uses the Express framework and following is standard directories-
- `/app.js` and `bin/www`- server setup and start scripts
- `/routes/index.js` - has route `/t/process`
- `/app/controllers/main.js`- it is controller and has all the business logic as required from the problem
- `utils/utils.js`- small utils
- `/public` - front-end assets
- `config/default.yml` - the configuration for project 


## Change the config file  
Go to `config/default.yml` and change this property `rate_limit_sleep_time`, currently it is set it 15 mins 
and it is in milliseconds



##  Storage
In this `time` variable, we store key as actual time in 24 hours format
and value as count of hour (of a day) in which his followers are posted a tweet 

```
time {"0":10,"1":10,"2":5,"3":21,"4":16,"5":24,"6":30,"7":13,"8":14,"9":19,"10":37,"11":17,"12":17,"13":12,"14":20,"15":24,"16":26,"17":29,"18":24,"19":30,"20":9,"21":14,"22":13,"23":18}
best time 10
```

`days` variable will have the count of on this Day of week followers has posted a tweet 
```
days {"Thursday":101,"Wednesday":98,"Tuesday":56,"Monday":59,"Saturday":58,"Friday":46,"Sunday":34}
best day Thursday

```

