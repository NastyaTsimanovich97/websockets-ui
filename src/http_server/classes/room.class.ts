import { v4 as uuidv4 } from "uuid";
import { Commands } from "../constants/commands";
import Player from "./player.class";

export default class Room {
  public indexRoom: string;
  public roomUsers: {
    index: string;
    name: string;
  }[] = [];
  public players: { [key: string]: Player } = {};
  public isAvailable: boolean = true;

  public create() {
    this.indexRoom = uuidv4();

    return this;
  }

  public addPlayer(player: Player) {
    this.roomUsers.push({ index: player.index, name: player.name });
    this.players[player.index] = player;

    if (this.roomUsers.length === 2) {
      this._createGame();
      this.isAvailable = false;
    }
  }

  private _createGame() {
    const idGame = uuidv4();
    for (const player of Object.values(this.players)) {
      player.ws.send(
        JSON.stringify({
          id: 0,
          type: Commands.CreateGame,
          data: JSON.stringify({
            idGame,
            idPlayer: player.index,
          }),
        })
      );
    }
  }
}
