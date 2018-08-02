import * as PIXIHook from "./lib/pixi.js";
import Visualizer from "./visualizer.js";

//constant side length. We scale grid cells to make them fit into container
export const CELL_SIDE_LENGTH = 30;

const importantCellTypes = {};

export class Tile {
  constructor(x, y) {
    this._graphic = new PIXI.Graphics();

    this._cellGrid = [];
    this._addCursor = -1;

    this._gridPosX = x;
    this._gridPosY = y;

    this.cached = false;

    let pointerMoveCallback = ()=>{}; //no-op
    this._graphic.interactive = true;
    this._graphic.on('pointermove', evt => {
      const pos = evt.data.getLocalPosition(evt.currentTarget);

      pointerMoveCallback(this, evt, Math.floor(pos.x / CELL_SIDE_LENGTH), Math.floor(pos.y / CELL_SIDE_LENGTH));
    });

    /**
     *  @param func Takes 4 arguments: (tile, evt, x, y) where "tile" is this tile instance and "evt" is the pointermove event
     */
    this.setPointerCallback = function(func) {
      pointerMoveCallback = func;
    };
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
    this._graphic.clear();

    let sideScale = scale * CELL_SIDE_LENGTH;
    if (sideScale >= 1) this._graphic.lineStyle(1, 0xe3e3e3)

    for (let y = 0; y < this._cellGrid.length; y++) {
      const row = this._cellGrid[y];
      for (let x = 0; x < row.length; x++) {
        let posX = CELL_SIDE_LENGTH * x;
        let posY = CELL_SIDE_LENGTH * y;

        let side = CELL_SIDE_LENGTH;
        //cells marked as visually important are blown up
        if (sideScale < 1 && importantCellTypes[row[x]]) {
          side = 1/scale;
          let shift = side/4;

          posX -= shift;
          posY -= shift;
        }

        this._graphic.beginFill(row[x])
          .drawRect(posX, posY, side, side)
          .endFill();
      }
    }

    return this;
  }

  getGraphic() { return this._graphic; }
}

Tile.setImportantCells = function() {
  for (let cellType of arguments) {
    importantCellTypes[cellType] = true;
  }
}