import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import { ICreatePlayer } from "../interfaces/player.interface";
import { IShip } from "../interfaces/ship.interface";

export default class Player {
  public index: string;
  public name: string;
  public password: string;
  public error: boolean = false;
  public errorText: string = "";

  public ships: IShip[] = [];
  public isReady = false;
  public wins = 0;

  public ws: WebSocket;

  public create({ name, password }: ICreatePlayer, ws: WebSocket) {
    this.index = uuidv4();
    this.name = name;
    this.password = password;

    this.ws = ws;

    return this;
  }
}
