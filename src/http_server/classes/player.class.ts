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

  public create(
    { name, password }: ICreatePlayer,
    ws: WebSocket,
    store: { [key: string]: Player }
  ) {
    this.index = uuidv4();
    this.name = name;
    this.password = password;

    this.ws = ws;

    const isNameExist = Object.values(store).find(
      (player) => player.name === name
    );

    if (isNameExist) {
      console.error(`User with name: ${name} is already exist`);
      this.error = true;
      this.errorText = "User with name is already exist";
    }

    return this;
  }
}
