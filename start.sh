#!/bin/bash

docker-machine start
eval $(docker-machine env)
docker start grafana
docker start graphite
