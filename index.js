const fs = require('fs');
const mainEl = document.createElement('main');
document.body.appendChild(mainEl);
mainEl.innerHTML = fs.readFileSync('./pad.html');

const tempo = 120;
const signature = 8;
const beatDur = 60/tempo;
const barDur = signature * beatDur;

const WAAClock = require('waaclock');

const ctx = new AudioContext();
const clock = new WAAClock(ctx);

let beats = {
  "lead1": [],
  "lead2": [],
  "bass": [],
};

let soundbank = {};

soundbank["lead1"] = function lead1() {
  const node = ctx.createOscillator();
  node.type = 'sawtooth';
  node.frequency.value = 350;
  node.connect(ctx.destination);

  function start(time) {
    node.start(time);
    node.stop(time + beatDur);
  }

  return {start};
}

soundbank["lead2"] = function lead2() {
  const node = ctx.createOscillator();
  node.type = 'sine';
  node.frequency.value = 460;
  node.connect(ctx.destination);

  function start(time) {
    node.start(time);
    node.stop(time + beatDur);
  }

  return {start};
}

soundbank["bass"] = function bass() {
  const node = ctx.createOscillator();
  node.type = 'sine';
  node.frequency.value = 100;
  node.connect(ctx.destination);

  function start(time) {
    node.start(time);
    node.stop(time + beatDur);
  }

  return {start};
}

clock.start();

clock.callbackAtTime(uiTick, nextBeatTime(0))
  .repeat(beatDur)
  .tolerance({late: 100});

let counter = 0;

function uiTick() {
  const prev = document.querySelectorAll(`.row-${counter - 1 < 0 ? signature - 1 : counter - 1}`);
  const bars = document.querySelectorAll(`.row-${counter}`);

  Array.prototype.forEach.call(prev, function(el) {
    el.classList.remove('active');
  });
  Array.prototype.forEach.call(bars, function(el) {
    el.classList.add('active');
  });

  counter = (counter + 1) % signature;
}

function registerBeat(track, beatInd) {
  const event = clock.callbackAtTime(function(event) {
    const node = soundbank[track]();
    node.start(event.deadline);
  }, nextBeatTime(beatInd));

  event.repeat(barDur);
  event.tolerance({late: 10});
  beats[track][beatInd] = event;
}

// This function deactivates the beat `beatInd` of `track`.
function unregisterBeat(track, beatInd) {
  const event = beats[track][beatInd];
  event.clear();
}

function nextBeatTime(beatInd) {
  const currentTime = ctx.currentTime;
  const currentBar = Math.floor(currentTime / barDur);
  const currentBeat = Math.round(currentTime % barDur);

  if (currentBeat < beatInd) {
    return currentBar * barDur + beatInd * beatDur;
  } else {
    return (currentBar + 1) * barDur + beatInd * beatDur;
  }
}

document.querySelector('.pad').addEventListener('click', function(event) {
  const btn = event.target;
  const beatInd = +btn.classList[0].split('-')[1];
  const track = btn.parentElement.dataset["synth"];

  if(btn.classList.contains('registered')) {
    unregisterBeat(track, beatInd);
    btn.classList.remove('registered');
  } else {
    registerBeat(track, beatInd);
    btn.classList.add('registered');
  }

});
