import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import { CreatePlayerI } from "../interfaces/player.interface";

export default class Player {
  public index: string;
  public name: string;
  public password: string;
  public error: boolean = false;
  public errorText: string = "";
  public ws: WebSocket;

  public create({ name, password }: CreatePlayerI, ws: WebSocket) {
    this.index = uuidv4();
    this.name = name;
    this.password = password;

    this.ws = ws;

    return this;
  }
}
