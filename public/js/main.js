import * as PIXIHook from "./lib/pixi.js";
import Visualizer from "./visualizer.js";
import Thrift from "./lib/thrift/thrift.js";
import {NoDataException} from "./lib/thrift/gen-js/visualizer_types.js";
import BrokerClient from "./lib/thrift/gen-js/Broker.js";

//Constants
const TIMEOUT_MS = 2000;
const CHUNK_SIZE = 500; //consider making this configurable
const MAX_BUFFER_SIZE = 5000; //soft maximum. If pollForUpdates requests a chunk size that will exceed this limit, no errors

//State
let visualizer;
let buffer;
let bufferOverflow;
let nextIterationToRender;
let iterationDisplay;
let deltaTime;

//for tracking visualization
let expandedCells;
let backedUpCells;

//will be indexed by x,y
const cellIndexHandler = {
  get: function(backing, prop) {
    if (prop == 'backing') return backing;

    let numProp = parseInt(prop, 10);
    if (numProp !== numProp) return undefined;

    if (!backing[numProp]) backing[numProp] = {};
    return backing[numProp];
  },
  set: function(){
    throw new Error('Do not set the x value for the Cell Index. It is set for you');
  }
}
let cellIndex;

//RPC objects
const transport = new Thrift.TXHRTransport("/broker");
const protocol  = new Thrift.TJSONProtocol(transport);
const client    = new BrokerClient(protocol);

/***********************************
  Control Vars / Access Functions
***********************************/
//Offset
let offset;

//Polling
let continuePolling = true;
let timeoutId;
const stopPolling = () => {
  continuePolling = false;
  if (!!timeoutId) clearTimeout(timeoutId);
}
const startPolling = () => {
  if (!continuePolling) {
    continuePolling = true;
    poll();
  }
}

//Animation Speed
let animationSpeed = 1;
const getAnimationSpeed = () => animationSpeed;
const setAnimationSpeed = (newSpeed) => {
  animationSpeed = newSpeed;

  if (!visualizer) return;

  visualizer.ticker.speed = newSpeed;
}

//Animation Mode
const PLAY = Symbol();
const STOP = Symbol();
const STEP = Symbol();
let animationMode;
const play = () => animationMode = PLAY;
const stop = () => animationMode = STOP;
const step = () => animationMode = STEP;

/*************************
  RPC / Init procedures
*************************/
let initInProgress = false;
/**
 *  Subsequent calls after first reinitializes the visualizer
 *  @param animationHook Function that takes an object with these properties:
 *    - iterationNumber: the iteration number being displayed (1-indexed, not 0-indexed)
 *    - renderedIterations: The raw iteration data for all iterations rendered this animation frame
 */
async function init(container, animationHook) {
  if (initInProgress) return;
  initInProgress = true;

  animationMode = STOP;

  if (visualizer) {
    visualizer.ticker.stop();
    visualizer.destroy();
    visualizer = null;
  }
  if (!!timeoutId) clearTimeout(timeoutId);
  timeoutId = null;

  offset = 0;

  buffer = [];
  bufferOverflow = [];
  nextIterationToRender = 0;
  iterationDisplay = 0;
  deltaTime = 0;

  expandedCells = [];
  backedUpCells = [];

  cellIndex = new Proxy({}, cellIndexHandler);

  const pingResult = await new Promise(resolve => {
    client.ping(result => resolve(result));
  });
  console.log('Ping resolved with ' + pingResult);

  continuePolling = true;
  let initialized = false;
  while (continuePolling) {
    initialized = await new Promise(resolve => {
      client.getInitData(result => resolve(getInitDataCallback(result, container, animationHook)));
    });

    if (initialized) break;
  }

  initInProgress = false;
  if (initialized) {
    timeoutId = setTimeout(poll, 0); //non-blocking invocation
    return 'Polling';
  }
  return 'Uninitialized';
}

async function poll() {
  timeoutId = null;
  let flushed = false;

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
  
  if (continuePolling) timeoutId = setTimeout(poll, TIMEOUT_MS);
}

function getInitDataCallback(result, container, animationHook) {
  if (result instanceof NoDataException) {
    console.log('Data not initialized');
    return false;
  }

  visualizer = new Visualizer(result.width, result.height, container);

  visualizer.setAgentLocation(result.start.x, result.start.y);

  for (const goal of result.goals) {
    visualizer.addGoal(goal.x, goal.y);
  }

  for (const cell of result.blockedCells) {
    updateCellState(cell, 'BLOCKED', visualizer);
  }

  visualizer.setCellRequestFunction((x, y) => {
    const cell = cellIndex[x][y];

    return !!cell ? cell.displayInfo : {State: 'Not explored'};
  });

  visualizer.redraw();

  //set up animation
  visualizer.ticker.speed = animationSpeed;
  visualizer.ticker.add(getAnimationFunction(visualizer, animationHook));
  visualizer.ticker.start();

  //debug purposes
  window.visualizer = visualizer;

  return true;
};

/***************************
    Animation Function
***************************/
function getAnimationFunction(visualizer, hook) {
  return function animate() {
    let it = buffer[nextIterationToRender];
    let numIterationsToRender = 0;

    if (!it || animationMode === STOP) {//if no iterations to render, effectively pause
      deltaTime = 0;
    } else if (animationMode === STEP) {
      numIterationsToRender = 1;
      deltaTime = 0;
    } else {
      deltaTime += visualizer.ticker.deltaTime;
      numIterationsToRender = Math.floor(deltaTime);
      deltaTime -= numIterationsToRender;
    }

    const renderedIterations = [];
    for (let i = 0; i < numIterationsToRender; i++) {
      if (!it) break;

      //ENVELOPE
      if (it.clearPreviousEnvelope) {
        for (let cell of expandedCells) {
          cell.clearState('EXPANDED');
          visualizer.setCell(cell.x, cell.y, visualizer[cell.state]);
        }
        expandedCells = [];
      }

      for (let node of it.newEnvelopeNodes) {
        updateCellState(node.loc, 'EXPANDED', visualizer, expandedCells, node.data);
      }

      //BACKUP
      if (it.clearPreviousBackup) {
        for (let cell of backedUpCells) {
          cell.clearState('BACKED_UP');
          visualizer.setCell(cell.x, cell.y, visualizer[cell.state]);
        }
        backedUpCells = [];
      }

      if (!!it.newBackedUpNodes) {
        for (let node of it.newBackedUpNodes) {
          updateCellState(node.loc, 'BACKED_UP', visualizer, backedUpCells, node.data);
        }
      }

      //AGENT
      if (!!it.removeFromProjectedPath) {
        //clear previous path
        for (let state of it.removeFromProjectedPath) {
          const cell = cellIndex[state.x][state.y];

          cell.clearState('PATH_PROJECTION');
          visualizer.setCell(cell.x, cell.y, visualizer[cell.state]);
        }
      }
      if (!!it.addToProjectedPath) {
        //draw new path
        for (let iterationCell of it.addToProjectedPath) {
          updateCellState(iterationCell, 'PATH_PROJECTION', visualizer);
        }
      }

      visualizer.setAgentLocation(it.agentLocation.x, it.agentLocation.y);
      
      nextIterationToRender++;
      iterationDisplay++;

      //reset buffer
      if (buffer.length === nextIterationToRender) {
        buffer = bufferOverflow;
        bufferOverflow = [];
        nextIterationToRender = 0;
      }

      renderedIterations.push(it);

      it = buffer[nextIterationToRender];
    }

    hook({
      iterationNumber: iterationDisplay + 1,
      renderedIterations,
    });

    if (animationMode === STEP) animationMode = STOP;

    visualizer.redraw();
  }
}

function updateCellState(iterationCell, newState, visualizer, storageArray, displayInfo) {
  let x = iterationCell.x;
  let y = iterationCell.y;
  let cell = cellIndex[x][y];

  if (!cell) {
    cell = new Cell(x, y);

    cellIndex[x][y] = cell;
  }
  cell.state = newState;

  visualizer.setCell(cell.x, cell.y, visualizer[cell.state]);
  !!storageArray && storageArray.push(cell);

  if (displayInfo) cell.displayInfo = displayInfo;
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this._stateFlags = {
      FREE: true,
      EXPANDED: false,
      BACKED_UP: false,
      PATH_PROJECTION: false,
      BLOCKED: false
    };
  }

  get state() { //method defines precedence
    if (this._stateFlags.BLOCKED) return 'BLOCKED';
    else if (this._stateFlags.PATH_PROJECTION) return 'PATH_PROJECTION';
    else if (this._stateFlags.BACKED_UP) return 'BACKED_UP';
    else if (this._stateFlags.EXPANDED) return 'EXPANDED';
    else return 'FREE';
  }

  set state(stateName) {
    this._stateFlags[stateName] = true;
    if (stateName === 'BLOCKED') {
      for (let prop in this._stateFlags) {
        if (prop !== 'BLOCKED') this._stateFlags[prop] = false;
      }
    }
  }

  clearState(stateName) {
    this._stateFlags[stateName] = false;
  }

  get displayInfo() {
    return Object.assign({State: this.state}, this._info);
  }

  set displayInfo(newInfo) {
    this._info = newInfo;
  }
}

export {startPolling, stopPolling, getAnimationSpeed, setAnimationSpeed, play, stop, step, init};