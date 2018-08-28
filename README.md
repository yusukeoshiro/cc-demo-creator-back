# CC Demo Creator Back End Application
last updated: 2018-08-24  
Heroku App: https://cc-demo-creator-front.herokuapp.com/


**Site Initialize Demo Video**  
[![Catalog Load Demo](https://img.youtube.com/vi/bY9eACbcOM0/0.jpg)](https://www.youtube.com/watch?v=bY9eACbcOM0)



**Catalog Load Demo Video**  
[![Catalog Load Demo](https://img.youtube.com/vi/T7UKGEJl8-8/0.jpg)](https://www.youtube.com/watch?v=T7UKGEJl8-8)








## Versions

```
$ ruby -v
ruby 2.4.1p111 (2017-03-22 revision 58053) [x86_64-darwin17]

$ rails -v
Rails 5.2.0

$ redis-server -v
Redis server v=4.0.9 sha=00000000:0 malloc=libc bits=64 build=e0c8d37381c486c6
```


---

## Environment Variables
When running the server on localhost, set the environment variable with `.env` located directly on the project root.

```
$ cat .env
BUILD_SUITE_URL=SOME_VALUE
CLOUDINARY_URL=SOME_VALUE
CLOUDINARY_UPLOAD_PRESET=SOME_VALUE
DATABASE_URL=SOME_VALUE
GITHUB_PRIVATE_KEY=SOME_VALUE
REDIS_URL=SOME_VALUE
GOOGLE_IMAGE_API_KEY=SOME_VALUE
SENDGRID_API_KEY=SOME_VALUE
SENDGRID_PASSWORD=SOME_VALUE
SENDGRID_USERNAME=SOME_VALUE
```

note: BUILD_SUITE_URL should be something like git@github.com:xxxx/build-suite.git

If you are running this app on Heroku, just run  
`$ heroku config:set ENV_VAR_NAME="value"`

---

## Runnning the Servers


### Web Server
```
$ bundle install # install dependencies
$ rails db:create # install PG Database
$ rails server # run the server
```

### Batch Server
```
$ # do all of the above
$ bundle exec sidekiq -C config/sidekiq.yml

or

$ bundle exec sidekiq # this is also fine
```
---

## Front End
Front end server should be spun up separately. Refer to this separate repository  
https://github.com/yusukeoshiro/cc-demo-creator-front
