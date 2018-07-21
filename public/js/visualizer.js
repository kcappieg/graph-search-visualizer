import * as PIXIHook from "./lib/pixi.js";

//constant side length. We scale grid cells to make them fit into container
const CELL_SIDE_LENGTH = 30;
const AGENT_COLOR = 0xFFA500;
const MAX_TILES = 30000

function initCircle(color) {
  return new PIXI.Graphics()
    .beginFill(AGENT_COLOR)
    .drawCircle(15, 15, 10)
    .endFill();
}

function rescaleCircle(circle, color, scale) {
  let radius;
  if (scale < 1) {
    radius = 1/scale * 10;
  } else {
    radius = 10 * scale;
  }
  circle.clear();
  circle.beginFill(color)
    .drawCircle(15, 15, radius)
    .endFill();
}

function findNearestSquare(num) {
  return Math.ceil(Math.sqrt(num));
}

export class Visualizer {
  /**
   *  @note Integer overflow not guarded against
   *  @param width In grid cells
   *  @param height In grid cells
   *  @todo Add mechanism to define blocked cells
   */
  constructor(width, height, domElement) {
    this._container = domElement;
    this._width = width;
    this._height = height;
    this._goals = [];

    this._redrawCache = [];

    this._app = new PIXI.Application({
      backgroundColor: 0xFFFFFF,
      width: domElement.clientWidth,
      height: domElement.clientHeight
    });

    const totalCells = width * height;
    const tileRatio = totalCells / MAX_TILES;

    if (tileRatio > 1) {
      this._tileSize = findNearestSquare(tileRatio);
    } else {
      this._tileSize = 1;
    }

    const tileWidth = Math.ceil(width / this._tileSize);
    const tileHeight = Math.ceil(height / this._tileSize);

    this._tileGrid = [];
    for (let y = 0; y < tileHeight; y++) {
      const row = [];
      for (let x = 0; x < tileWidth; x++) {
        const newTile = new Tile();

        // quadruple for loop...ick. But it's all bounded by width * height, so I think it's fine...
        for (let cellY = 0; cellY < this._tileSize; cellY++) {
          if (cellY + (y * this._tileSize) > height) break;

          newTile.addRow();
          for (let cellX = 0; cellX < this._tileSize; cellX++) {
            if (cellX + (x * this._tileSize) > width) break;
            newTile.addCell(this.FREE);
          }
        }

        const tileGraphic = newTile.draw().getGraphic();
        tileGraphic.position = new PIXI.Point(x * CELL_SIDE_LENGTH * this._tileSize, y * CELL_SIDE_LENGTH * this._tileSize);

        row.push(newTile);
        this._app.stage.addChild(tileGraphic);
      }
      this._tileGrid.push(row);
    }

    this._agent = initCircle(AGENT_COLOR);

    this.setAgentLocation(0, 0);

    this._app.stage.addChild(this._agent);
    domElement.appendChild(this._app.view);
    this.rescale();
  }

  addGoal(x, y) {
    const newGoal = initCircle(this.GOAL);
    newGoal.position = new PIXI.Point(x * CELL_SIDE_LENGTH, y * CELL_SIDE_LENGTH);
    this._goals.push(newGoal);

    rescaleCircle(newGoal, this.GOAL, this._scale);

    this.setCell(x, y, this.GOAL)
      ._app.stage.addChild(newGoal);

    return this;
  }

  setCell(x, y, cellType) {
    const tileX = Math.floor(x / this._tileSize);
    const cellX = x % this._tileSize;
    const tileY = Math.floor(y / this._tileSize);
    const cellY = y % this._tileSize;

    const tile = this._tileGrid[tileY][tileX]
    tile.setCell(cellX, cellY, cellType);

    if (!tile.cached) {
      this._redrawCache.push(tile);
      tile.cached = true;
    }

    return this;
  }

  setAgentLocation(x, y) {
    this._agent.position = new PIXI.Point(x * CELL_SIDE_LENGTH, y * CELL_SIDE_LENGTH);

    return this;
  }

  rescale(targetScale) {
    let scale;
    if (!targetScale) {
      const contWidth = this._container.clientWidth;
      const contHeight = this._container.clientHeight;

      const widthScale = contWidth / (this._width * CELL_SIDE_LENGTH);
      const heightScale = contHeight / (this._height * CELL_SIDE_LENGTH);

      scale = widthScale < heightScale ? widthScale : heightScale;
    } else {
      scale = targetScale;
    }
    
    this._app.stage.scale = new PIXI.Point(scale, scale);

    //ensures the agent always stays visible
    rescaleCircle(this._agent, AGENT_COLOR, scale);
    for (const goal of this._goals) {
      rescaleCircle(goal, this.GOAL, scale);
    }

    //must rescale tiles as well, which scale up blocked cells to ensure they are visible
    for (const row of this._tileGrid) {
      for (const tile of row) {
        tile.draw(scale);
      }
    }

    this._scale = scale;
    return this;
  }

  repositionStage(x, y) {
    this._app.stage.position = new PIXI.Point(x, y);
  }

  redraw() {
    for (let tile of this._redrawCache) {
      tile.draw(this._scale);
      tile.cached = false;
    }

    this._redrawCache = []; //reset cache

    return this;
  }
}

//define constants for adding or replacing cells
Object.defineProperty(Visualizer.prototype, 'FREE', {
  value: 0xFFFFFF,
  writeable: false,
  enumerable: true,
  configurable: false
});
Object.defineProperty(Visualizer.prototype, 'BLOCKED', {
  value: 0,
  writeable: false,
  enumerable: true,
  configurable: false
});
Object.defineProperty(Visualizer.prototype, 'EXPANDED', {
  value: 0xC6DEF7,
  writeable: false,
  enumerable: true,
  configurable: false
});
Object.defineProperty(Visualizer.prototype, 'GOAL', {
  value: 0x00FF00,
  writeable: false,
  enumerable: true,
  configurable: false
});
Object.defineProperty(Visualizer.prototype, 'PATH_PROJECTION', {
  value: 0x0000FF,
  writeable: false,
  enumerable: true,
  configurable: false
});

class Tile {
  constructor() {
    this._graphic = new PIXI.Graphics();
    this._cellGrid = [];
    this._addCursor = -1;

    this.cached = false;
  }

  addCell(cellType) {
    this._cellGrid[this._addCursor].push(cellType);
    return this;
  }

  addRow() {
    this._cellGrid.push([]);
    this._addCursor++;
    return this;
  }

  setCell(x, y, cellType) {
    this._cellGrid[y][x] = cellType;
    return this;
  }

  draw(scale) {
    this._graphic.clear().lineStyle(1, 0xe3e3e3);

    for (let y = 0; y < this._cellGrid.length; y++) {
      const row = this._cellGrid[y];
      for (let x = 0; x < row.length; x++) {
        const posX = CELL_SIDE_LENGTH * x;
        const posY = CELL_SIDE_LENGTH * y;

        let side = CELL_SIDE_LENGTH;
        if (scale * CELL_SIDE_LENGTH < 1) side = 1/scale

        this._graphic.beginFill(row[x])
          .drawRect(posX, posY, side, side)
          .endFill();
      }
    }
    return this;
  }

  getGraphic() { return this._graphic; }
}