# Redis (Pub/Subs and Queues) : Implementing a coding platform

## Running redis on docker

Pull an image from dockerhub of redis

```bash
docker run -d -p 6379:6379 --name <container_name> redis
```


## Creating an Express server

Created a 'post' endpoint on /submit, to post the body or the problem contents to the redis queue from where a worker machine would pick it up to solve

## Creating the worker server

Initialised a infinite waiting client on the queue on which the server will push the code, in order to process, after processing published it to a channel on the redis client

## Creating a websocket connection

From the user end, a websocket connection is initialised after authentication and getting the userId, which not only allows users to connect among themselves but also the server subscribes to the channel
and gets the status of submission for the problem submitted. Only the user with the matching id gets this provided his connection is open and the message isn't broadcasted.
