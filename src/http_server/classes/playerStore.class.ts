import { WebSocket } from "ws";
import { ICreatePlayer } from "../interfaces/player.interface";
import Player from "./player.class";

export default class PlayerStore {
  private _playerStore: { [key: string]: Player } = {};

  public register(data: ICreatePlayer, ws: WebSocket) {
    const player = new Player();
    const newPlayer = player.create(data, ws, this._playerStore);

    this._save(newPlayer);

    return newPlayer;
  }

  private _save(data: Player) {
    this._playerStore[data.index] = data;
  }
}
