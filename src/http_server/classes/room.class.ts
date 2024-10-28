import { v4 as uuidv4 } from "uuid";
import { Commands } from "../constants/commands";
import { IShip } from "../interfaces/ship.interface";
import Game from "./game.class";
import GameStore from "./gameStore.class";
import Player from "./player.class";

export default class Room {
  public indexRoom: string;
  public roomUsers: {
    index: string;
    name: string;
  }[] = [];
  public players: { [key: string]: Player } = {};
  public isAvailable: boolean = true;

  public game: Game;

  public create() {
    this.indexRoom = uuidv4();

    return this;
  }

  public addPlayer(player: Player) {
    const isPlayerInRoom = this.roomUsers.find(
      (user) => user.index === player.index
    );

    if (isPlayerInRoom) {
      console.error("Player is already in this room");
      return null;
    }

    this.roomUsers.push({ index: player.index, name: player.name });
    this.players[player.index] = player;

    if (this.roomUsers.length === 2) {
      this._createGame();
      this.isAvailable = false;
    }
  }

  public addShips(
    gameId: string,
    playerId: string,
    ships: IShip[],
    gameStore: GameStore
  ) {
    const player = this.players[playerId];

    if (!player) {
      console.error("Player not found");
      return null;
    }

    player.ships = ships.map((ship) => ({
      ...ship,
      id: uuidv4(),
      isKilled: false,
      woundedFields: 0,
    }));
    player.isReady = true;

    const isGameReady = Object.values(this.players).every((p) => p.isReady);

    console.log("isGameReady", isGameReady);

    if (isGameReady) {
      this._startGame(gameId, gameStore);
    }
  }

  // TODO: move this method
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

  private _startGame(gameId: string, gameStore: GameStore) {
    console.log("Start game");

    const newGame = new Game();

    this.game = newGame.create(gameId, this.players);

    gameStore.create(gameId, this.game);

    for (const player of Object.values(this.players)) {
      console.log(`Start game for player ${player.index}`);
      player.ws.send(
        JSON.stringify({
          type: Commands.StartGame,
          id: 0,
          data: JSON.stringify({
            currentPlayerIndex: player.index,
            ships: player.ships,
          }),
        })
      );
    }

    this.game.turnPlayer();
  }
}
