import {Visualizer} from "./visualizer.js";
import * as BrokerClient from "./lib/thrift/gen-js/Broker.js";

export const visualizer = new Visualizer(150, 150, document.getElementById('grid-container'));