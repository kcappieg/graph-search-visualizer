import * as PIXIHook from "./lib/pixi.js";
import {Visualizer} from "./visualizer.js";
import Thrift from "./lib/thrift/thrift.js";
import {NoDataException} from "./lib/thrift/gen-js/visualizer_types.js";
import BrokerClient from "./lib/thrift/gen-js/Broker.js";

//Constants
const WINDOW_TIMEOUT = 2000;
const CHUNK_SIZE = 10; //consider making this configurable
const MAX_BUFFER_SIZE = 5000; //soft maximum. If pollForUpdates requests a chunk size that will exceed this limit, no errors

//State
let visualizer;
let buffer = [];
let bufferOverflow = [];
let expandedCells = [];
let nextIterationToRender = 0;
let initialized = false;
let deltaTime = 0;

//RPC objects
const transport = new Thrift.TXHRTransport("/broker");
const protocol  = new Thrift.TJSONProtocol(transport);
const client    = new BrokerClient(protocol);

/***********************************
  Control Vars / Access Functions
***********************************/
//Offset
let offset = 0; //not providing access function yet. Messing with offset must be handled gracefully

//Polling
let continuePolling = true;
let timeoutId;
export const stopPolling = () => {
  continuePolling = false;
  if (!!timeoutId) clearTimeout(timeoutId);
}
export const startPolling = () => {
  if (!continuePolling) {
    continuePolling = true;
    poll();
  }
}

//Animation Speed
let animationSpeed = 1;
export const getAnimationSpeed = () => animationSpeed;
export const setAnimationSpeed = (newSpeed) => {
  animationSpeed = newSpeed;

  if (!initialized) return;

  visualizer.ticker.speed = newSpeed;
}

/*************************
  RPC / Animate Procedures
*************************/
/**
 *  Do not call this function twice!!! (Race condition with your own request. Stupid...)
 */
export async function init() {
  if (initialized) return;
  const pingResult = await new Promise(resolve => {
    client.ping(result => resolve(result));
  });
  console.log('Ping resolved with ' + pingResult);

  continuePolling = true;
  poll();
}

async function poll() {
  timeoutId = null;
  let flushed = false;

  if (!initialized) {
    initialized = await new Promise(resolve => {
      client.getInitData(result => resolve(getInitDataCallback(result)))
    });

    flushed = true; //to prevent polling for iterations
  }

  while (!flushed && continuePolling && bufferOverflow.length <= MAX_BUFFER_SIZE) {
    const result = await new Promise((resolve) => {
      client.getIterations(offset, CHUNK_SIZE, (result) => {
        resolve(result);
      });
    });

    if (result instanceof NoDataException) {
      break;
    }

    flushed = result.bufferIsFlushed;

    let currentBuffer = buffer.length >= MAX_BUFFER_SIZE ? bufferOverflow : buffer;
    currentBuffer.push(...result.iterations);

    offset += result.iterations.length;
  }
  
  if (continuePolling) timeoutId = window.setTimeout(poll, WINDOW_TIMEOUT);
}

function getInitDataCallback(result) {
  if (result instanceof NoDataException) {
    console.log('Data not initialized');
    return false;
  }

  visualizer = new Visualizer(result.width, result.height, document.getElementById('grid-container'));

  visualizer.setAgentLocation(result.start.x, result.start.y);

  for (const goal of result.goals) {
    visualizer.addGoal(goal.x, goal.y);
  }

  for (const cell of result.blockedCells) {
    visualizer.setCell(cell.x, cell.y, visualizer.BLOCKED);
  }

  visualizer.redraw();

  //set up animation
  visualizer.ticker.speed = animationSpeed;
  visualizer.ticker.add(getAnimationFunction(visualizer));
  visualizer.ticker.start();

  //debug purposes
  window.visualizer = visualizer;

  return true;
};

//ticker function
function getAnimationFunction(visualizer) {
  return function animate() {
    let it = buffer[nextIterationToRender];
    if (!it) return;

    deltaTime += visualizer.ticker.deltaTime;
    const numIterationsToRender = Math.floor(deltaTime);
    deltaTime -= numIterationsToRender;

    for (let i = 0; i < numIterationsToRender; i++) {
      if (!it) break;

      if (it.clearPrevious) {
        for (let cell of expandedCells) {
          visualizer.setCell(cell.x, cell.y, visualizer.FREE);
          expandedCells = [];
        }
      }

      visualizer.setAgentLocation(it.agentLocation.x, it.agentLocation.y);

      for (let cell of it.newEnvelopeNodesCells) {
        visualizer.setCell(cell.x, cell.y, visualizer.EXPANDED);
        expandedCells.push(cell);
      }
      
      nextIterationToRender++;

      //reset buffer
      if (buffer.length === nextIterationToRender) {
        buffer = bufferOverflow;
        bufferOverflow = [];
        nextIterationToRender = 0;
      }

      it = buffer[nextIterationToRender];
    }

    visualizer.redraw();
  }
}