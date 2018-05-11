const express = require('express');
const fs = require('fs');
const { ScreepsAPI } = require('screeps-api');

setInterval(function(){ fs.writeFile('pid', process.pid, function(){}); }, 1000);

// Setup
const api = new ScreepsAPI({
  token: "your-token-here",
});

let CommittedStats = {};
let PendingStats = {system:{}, runtime:{}};

let commitTimer, watchdogTimer = Date.now();

setInterval(function() {
  if (watchdogTimer + 30000 > Date.now()) {
    console.log(Date.now(), 'watchdog ok');
  } else {
    console.log(Date.now(), 'watchdog expired');
    process.exit(1);
  }
}, 30000);

function commit(type) {
  console.log(Date.now(), 'commit', type);
  watchdogTimer = Date.now();

  if (commitTimer) return;
  commitTimer = setTimeout(function() {
    CommittedStats = PendingStats;
    PendingStats = {system:{}, runtime:{}};
    commitTimer = null;
    persist();
  }, 1500);
}

let logfile = 'stats.log';
let lastOutput = 0;
function persist() {
    console.log(Date.now(), 'persist');
    //console.log();
    if (CommittedStats.runtime && CommittedStats.runtime.tick > lastOutput) {
      let data = JSON.stringify(CommittedStats);
      //console.log(CommittedStats.runtime.tick, data);
      fs.appendFile(logfile, data+"\n", function(){});
      lastOutput = CommittedStats.runtime.tick;
    }
}

api.socket.on('connected', function() {
  api.socket.subscribe('cpu', event => {
    PendingStats.system.cpu = event.data.cpu;
    PendingStats.system.memory = event.data.memory;
    commit('cpu');
  });

  api.socket.subscribe('money', event => {
    PendingStats.system.credits = event.data;
    commit('money');
  });

  api.socket.subscribe('memory/shard1/stats-str', event => {
    PendingStats.runtime = JSON.parse(event.data);
    commit('stats');
  })
})

api.socket.on('disconnected', function() {
  console.log('connection lost');
  process.exit(1);
})

Promise.resolve()
.then(()=>api.socket.connect())


function flattenMetrics(object, prefix="", timestamp="") {
  console.log(timestamp);
  return Object.keys(object).sort().map(function (k){
    let metric = k;
    if (prefix.length > 0) metric = prefix + "." + metric;
    if (typeof object[k] === 'object') {
      return flattenMetrics(object[k], metric, timestamp);
    } else {
      return [metric, object[k], timestamp].join(' ');
    }
  }).join('\n');
}

const app = express()

app.get('/metrics', function(req, res) {
  res.set('Content-Type', 'text/plain');
  res.send(flattenMetrics(CommittedStats, "", Math.floor(CommittedStats.runtime.time/1000)))
})

app.listen(3000);
