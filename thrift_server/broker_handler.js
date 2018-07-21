const thrift = require('thrift');
const types = require('./gen-nodejs/visualizer_types.js');

const ITERATION_CHUNK_SIZE = 10; //10 iterations at a time
const MAX_BUFFER_SIZE = 1000;

let privateInitData = getDemoInit();
const buffers = [];
buffers.push(getDemoIterations()); //initial buffer
let producerBufferIndex = 0; //current buffer for producers
let consumerBufferIndex = 0; //current buffer for consumers
let consumerNext = 0; //current index in the consumer's current buffer

/**
 *  This class is designed for a single producer / consumer.
 *  Once the messages from the buffer are consumed they are deleted, meaning if
 *  multiple consumers are attempting to get messages they will steal from each other
 */
class BrokerHandler {
  initialize(initData, result) {
    console.log('initialize');

    privateInitData = initData

    result(null);
  }
  publishIteration(itData, result) {
    console.log('publish iteration');

    const currentBuffer = buffers[producerBufferIndex]
    currentBuffer.push(itData);

    if (currentBuffer.length >= MAX_BUFFER_SIZE) {
      buffers.push([]);
      producerBufferIndex++;
    }

    result(null);
  }

  getInitData(result) {
    console.log('get init data');

    if (!privateInitData) {
      result(new types.NoDataException());
      return;
    }
    
    result(null, privateInitData);
  }

  getIterations(result) {
    console.log('get iterations');

    const iterationList = [];
    let buffer = buffers[consumerBufferIndex] || [];

    if (!buffer[consumerNext]) {
      result(new types.NoDataException());
      return;
    }

    for (let i = 0; i < ITERATION_CHUNK_SIZE; i++) {
      if (!buffer[consumerNext]) break;

      iterationList.push(buffer[consumerNext++]);

      if (consumerNext >= MAX_BUFFER_SIZE) {
        //default to empty array in case the producer has not created the next buffer yet
        buffer = buffers[++consumerBufferIndex] || [];
        consumerNext = 0;
      }
    }

    const bufferIsFlushed = !buffer[consumerNext];

    result(null, new types.IterationBundle({
      iterations: iterationList,
      bufferIsFlushed
    }));
  }
};

module.exports = new BrokerHandler();

function getDemoInit() {
  const blockedCells = [];

  for (let i = 5; i < 20; i++){
    blockedCells.push(new types.Location({x: 10, y: i}));
  }

  return new types.Init({
    width: 100,
    height: 100,
    start: new types.Location({x: 0, y: 0}),
    goals: [new types.Location({x: 99, y: 99})],
    blockedCells
  });
}

function getDemoIterations() {
  let loc = {x: 0, y: 0};
  let nextExploredNode = {x: 0, y: 0};

  const iterations = [];

  for (let i = 0; i < 25; i++) {
    const expl = [];

    for (let j = 0; j < 5; j++) {
      expl.push(new types.Location({x:nextExploredNode.x, y:nextExploredNode.y}));

      nextExploredNode.x++;

      if (nextExploredNode.x == 100) {
        nextExploredNode.x = 0;
        nextExploredNode.y++;
      }
    }

    if (i < 20) loc.y++;
    else loc.x++;

    iterations.push(new types.Iteration({
      clearPrevious: false,
      agentLocation: new types.Location({x:loc.x, y:loc.y}),
      newEnvelopeNodesCells: expl
    }));
  }

  return iterations;
}