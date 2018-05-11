#!/bin/bash

eval $(docker-machine env)
docker stop grafana
docker stop graphite
docker-machine stop
