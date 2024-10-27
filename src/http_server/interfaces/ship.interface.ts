import { EShipType } from "../enums/shipType.enum";

interface IPosition {
  x: number;
  y: number;
}

export interface IShip {
  position: IPosition;
  direction: boolean;
  length: number;
  type: EShipType;
  woundedFields: number;
}