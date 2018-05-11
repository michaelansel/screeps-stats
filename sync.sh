#!/bin/bash

rsync -va your.host.com:'screeps/stats/stats.log*' ./

rsync -va your.host.com:'screeps/stats/compact-*' ./

nc -z -w 1 192.168.99.100 2003 || { echo "Graphite?" ; exit 1 ; }

touch processed
comm -23 <(ls stats.log-*.gz) processed | while read -r archive ; do
  echo "${archive}" >&2
  gunzip -dc "${archive}"
done | cat - stats.log | node --expose-gc json2graphite.js > lastrun

nc 192.168.99.100 2003 < lastrun

ls stats.log-*.gz > processed

wc -l lastrun

date
