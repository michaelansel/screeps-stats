# How it works

- Screeps code instrumented to populate `Game.stats` throughout every tick (or sometimes less frequently)
- Screeps code updates `Memory['stats-str']` every tick with the stats data for that tick
- Collector watching the Screeps API (via WebSocket connection) -- watching the `stats-str` memory value; updates pushed every tick
- Collector writes the exact value of `stats-str` to `stats.log`
- When API connection severed/reset, Collector restarts and rotates/compresses `stats.log`
- Human runs `./sync.sh` to rsync all `stats.log` files (including rotated/compressed data) to local machine
- `./sync.sh` uses `json2graphite.js` to convert json into graphite data lines and writes to `lastrun`
- `./sync.sh` feeds `lastrun` into Carbon (Graphite component)
- Grafana reads data from Graphite into the dashboard

# Screeps Setup

```
// Beginning of loop()
Game.stats = {
  cpu: Game.cpu,
  gcl: Game.gcl,
  tick: Game.time,
  time: Date.now(),
  memory: {
    used: RawMemory.get().length,
  },
  market: {},
  roomSummary: {},
};


// screeps logic here
// append relevant information into Game.stats throughout code
// Examples: https://github.com/michaelansel/screeps-code/search?utf8=%E2%9C%93&q=stats&type=


// End of loop()
Game.stats.cpu.used = Game.cpu.getUsed();
Memory["stats-str"] = JSON.stringify(Game.stats);
```

An example `stats.log` is included if you need ideas or want to confirm the expected format

# Collector Setup

1. `npm install express screeps-api`
2. Generate API token: https://screeps.com/a/#!/account/auth-tokens (I used Full Access, but you can experiment with tighter permissions)
3. Add token to `memory-watcher.js`
4. ./run.sh
5. crontab -e : `*/5 * * * * bash -c "cd /path/to/screeps/stats && ./run.sh"`

# Laptop Setup

1. docker-machine start
2. docker run --name graphite -it graphiteapp/graphite-statsd bash
3. Modify /opt/graphite/conf/storage-{schemas,aggregation}.conf to match files in this repo
4. `docker stop graphite ; docker start graphite` (launch graphite process instead of bash)
5. Update username in `json2graphite.js` (initial prefix for `flattenMetrics`)
6. `./sync.sh` to make sure data gets loaded
7. docker run --name grafana grafana/grafana
8. http://192.168.99.100:3000 (login admin:admin)
9. Add Graphite data source pointing at `http://192.168.99.100` (no auth, newest version, direct)
10. `sed -i 's/REPLACEWITHUSERNAME/username-matching-step-5/g' grafana-basic_stats.json`
11. Import dashboard: grafana-basic_stats.json

# Routine/Viewing the data

1. `./start.sh ; ./sync.sh` (stalls on `nc` when the data is being ingested into graphite)
2. http://192.168.99.100:3000/dashboard/db/basic-stats
3. `./stop.sh` to shut everything down

# Compactions (pack all logs into a single compressed archive)

1. on the collector, run `./compact.sh`
2. on the laptop, `mkdir -p trash ; mv stats.log* trash/`
3. on the laptop, `./sync.sh` -- this will reprocess the entire history of all metrics, creating a very large `lastrun` file and taking a long time. oops. too bad.
