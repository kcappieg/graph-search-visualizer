import * as PIXIHook from "./lib/pixi.js";
import {Visualizer} from "./visualizer.js";
import Thrift from "./lib/thrift/thrift.js";
import {NoDataException} from "./lib/thrift/gen-js/visualizer_types.js";
import BrokerClient from "./lib/thrift/gen-js/Broker.js";

const WINDOW_TIMEOUT = 100;
let iterations = [];
let nextIteration = 0;

const transport = new Thrift.TXHRTransport("/broker");
const protocol  = new Thrift.TJSONProtocol(transport);
const client    = new BrokerClient(protocol);

const proxyHandler = () => console.log('Visualizer not instantiated yet');
Window.visualizer = new Proxy({}, {
  get: proxyHandler,
  set: proxyHandler
});
client.getInitData((result) => {
  if (result instanceof NoDataException) {
    console.error('Data not initialized');
    Window.visualizer = null;
    return;
  }

  const visualizer = new Visualizer(result.width, result.height, document.getElementById('grid-container'));

  visualizer.setAgentLocation(result.start.x, result.start.y);

  for (const goal of result.goals) {
    visualizer.addGoal(goal.x, goal.y);
  }

  for (const cell of result.blockedCells) {
    visualizer.setCell(cell.x, cell.y, visualizer.BLOCKED);
  }

  visualizer.redraw();

  window.visualizer = visualizer;

  //set up animation
  visualizer.ticker.speed = 1.5;
  visualizer.ticker.add(getAnimationFunction(visualizer));
  visualizer.ticker.start();
});

//set up polling process
function pollForUpdates() {
  return new Promise(resolve => {
    client.getIterations(result => {
      resolve(result);
    });
  });
}

async function poll() {
  let flushed = false;

  while (!flushed) {
    const result = await pollForUpdates();

    if (result instanceof NoDataException) {
      break;
    }

    flushed = result.bufferIsFlushed;
    iterations = iterations.concat(result.iterations);
  }
  
  window.setTimeout(poll, WINDOW_TIMEOUT);
}

window.setTimeout(poll, WINDOW_TIMEOUT);

//define ticker function
let expandedCells = [];
function getAnimationFunction(visualizer) {
  return function animate() {
    const it = iterations[nextIteration];
    if (!it) return;

    if (it.clearPrevious) {
      for (let cell of expandedCells) {
        visualizer.setCell(cell.x, cell.y, visualizer.FREE);
      }
    }

    visualizer.setAgentLocation(it.agentLocation.x, it.agentLocation.y);

    for (let cell of it.newEnvelopeNodesCells) {
      visualizer.setCell(cell.x, cell.y, visualizer.EXPANDED);
      expandedCells.push(cell);
    }

    visualizer.redraw();
    nextIteration++;
  }
}