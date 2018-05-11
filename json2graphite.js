const readline = require('readline');

function flattenMetrics(object, prefix="", timestamp="") {
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function (line) {
 if (line.length > 2) {
   try {
     const stats = JSON.parse(line);
     console.log(flattenMetrics(stats, "screeps.USERNAME", Math.floor(stats.runtime.time/1000)));
   } catch (err) { console.error(err, line); }
 }
});
