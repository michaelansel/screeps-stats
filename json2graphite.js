function flattenMetrics(object, prefix="", timestamp="", cb) {
  Object.keys(object).sort().forEach(function (k){
    let metric = k;
    if (prefix.length > 0) metric = prefix + "." + metric;
    if (typeof object[k] === 'object') {
      flattenMetrics(object[k], metric, timestamp, cb);
    } else {
      cb( [metric, object[k], timestamp].join(' ') + "\n" );
    }
  });
}

const { pipeline, Transform } = require('stream');
const util = require('util');

function ReadlineStream(options) {
  Transform.call(this, options);

  // use objectMode to stop the output from being buffered
  // which re-concatanates the lines, just without newlines.
  if (!options) options = {}; // ensure object
  options.objectMode = true; // forcing object mode

  this.lineBuffer = '';

  // take the source's encoding if we don't have one
  this.on('pipe', function(src) {
    if (!this.encoding) {
      this.encoding = src._readableState.encoding;
    }
  });
}
util.inherits(ReadlineStream, Transform);

ReadlineStream.prototype._transform = function(chunk, encoding, done) {
  // decode binary chunks as UTF-8
  if(Buffer.isBuffer(chunk))
  {
    if(!encoding || encoding == 'buffer') encoding = 'utf8';

    chunk = chunk.toString(encoding);
  }

  this.lineBuffer += chunk;
  var lines = this.lineBuffer.split(/[\r\n]+/);

  while(lines.length > 1)
    this.push(lines.shift())

  this.lineBuffer = lines[0] || '';

  done();
};

ReadlineStream.prototype._flush = function(done) {
  if(this.lineBuffer)
  {
    this.push(this.lineBuffer)
    this.lineBuffer = ''
  }

  done();
};

function FlattenMetrics(options) {
  Transform.call(this, options);
  if (!options) options = {}; // ensure object
  options.objectMode = true; // forcing object mode
}
util.inherits(FlattenMetrics, Transform);

FlattenMetrics.prototype._transform = function (line, enc, cb) {
  if (line.length > 2) {
    try {
      const stats = JSON.parse(line);
      flattenMetrics(stats, "screeps.michaelansel", Math.floor(stats.runtime.time/1000), this.push.bind(this));
    } catch (err) { console.error(err, line); }
  }
  cb();
};

pipeline(
  process.stdin,
  // Break by line
  new ReadlineStream(),
  // Translate JSON line into metric lines
  new FlattenMetrics(),
  process.stdout,
  (err) => {
    if (err) {
      console.error('Pipeline failed', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
