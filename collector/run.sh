#!/bin/bash

if [[ -f /proc/$(cat pid)/cmdline ]] && grep -c memory-watcher /proc/$(cat pid)/cmdline >/dev/null ; then
  #already running
  exit 0
fi

if (( (`date +%s` - `stat -L --format %Y pid`) < 30 )) ; then
  #not dead long enough
  exit 0
fi

echo $$ > pid.bash

while [[ "$(cat pid.bash)" = $$ ]] ; do
  pkill -f 'node memory-watcher.js'
  node memory-watcher.js >> log
  ./rotate.sh >/dev/null </dev/null
  sleep 1
done