#!/bin/bash

find . -maxdepth 1 -name 'stats.log-*.gz' | while read -r archive ; do
  echo "${archive}" >&2
  gunzip -dc "${archive}"
done | cat - stats.log | node --expose-gc json2graphite.js > lastrun

wc -l lastrun

date
