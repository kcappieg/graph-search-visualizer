import * as PIXIHook from "./lib/pixi.js";
import {Visualizer, CellInfo} from "./visualizer.js";
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
let nextIterationToRender = 0;
let initialized = false;
let deltaTime = 0;

//for tracking visualization
let expandedCells = [];
let backedUpCells = [];
let projection = [];

//will be indexed by x,y
const cellIndexBacking = {};
const cellIndex = new Proxy(cellIndexBacking, {
  get: function(backing, prop) {
    if (prop == 'backing') return backing;

    let numProp = parseInt(prop, 10);
    if (numProp !== numProp) return undefined;

    if (!backing[numProp]) backing[numProp] = {};
    return backing[numProp];
  },
  set: function(){/*noop*/}
})

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

/* Below is PoC for adding text box to the canvas*/
// export const doTestText = () => {
//   testText.textBox.position = new PIXI.Point(20, 20);
//   visualizer._app.stage.addChild(testText.textBox);
// }

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

      //ENVELOPE
      if (it.clearPreviousEnvelope) {
        for (let cell of expandedCells) {
          cell.clearState('EXPANDED');
          visualizer.setCell(cell.x, cell.y, visualizer[cell.state]);
        }
        expandedCells = [];
      }

      for (let iterationCell of it.newEnvelopeNodesCells) {
        updateCellState(iterationCell, 'EXPANDED', expandedCells, visualizer);
      }

      //BACKUP
      if (it.clearPreviousBackup) {
        for (let cell of backedUpCells) {
          cell.clearState('BACKED_UP');
          visualizer.setCell(cell.x, cell.y, visualizer[cell.state]);
        }
        backedUpCells = [];
      }

      if (!!it.newBackedUpCells) {
        for (let iterationCell of it.newBackedUpCells) {
          updateCellState(iterationCell, 'BACKED_UP', backedUpCells, visualizer);
        }
      }

      //AGENT
      if (!!it.projectedPath) {
        //clear previous path
        for (let cell of projection) {
          cell.clearState('PATH_PROJECTION');
          visualizer.setCell(cell.x, cell.y, visualizer[cell.state]);
        }
        projection = [];

        //draw new path
        for (let iterationCell of it.projectedPath) {
          updateCellState(iterationCell, 'PATH_PROJECTION', projection, visualizer);
        }
      }

      visualizer.setAgentLocation(it.agentLocation.x, it.agentLocation.y);
      
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

function updateCellState(iterationCell, newState, storageArray, visualizer) {
  let x = iterationCell.x;
  let y = iterationCell.y;
  let cell = cellIndex[x][y];

  if (!cell) {
    cell = new Cell(x, y);

    cellIndex[x][y] = cell;
  }
  cell.state = newState;

  visualizer.setCell(cell.x, cell.y, visualizer[cell.state]);
  storageArray.push(cell);
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this._stateFlags = {
      FREE: true,
      EXPANDED: false,
      BACKED_UP: false,
      PATH_PROJECTION: false
    };
  }

  get state() { //method defines precedence
    if (this._stateFlags.PATH_PROJECTION) return 'PATH_PROJECTION';
    else if (this._stateFlags.BACKED_UP) return 'BACKED_UP';
    else if (this._stateFlags.EXPANDED) return 'EXPANDED';
    else return 'FREE';
  }

  set state(stateName) {
    this._stateFlags[stateName] = true;
  }

  clearState(stateName) {
    this._stateFlags[stateName] = false;
  }
}