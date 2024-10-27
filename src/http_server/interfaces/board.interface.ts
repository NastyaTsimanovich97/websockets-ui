import { EFieldStatus } from "../enums/fieldStatus.enum";
import { IShip } from "./ship.interface";

export interface IField {
  isEmpty: boolean;
  status: EFieldStatus;
  // isNearShip: boolean;
  ship: IShip | null;
}

export type Board = IField[][];
