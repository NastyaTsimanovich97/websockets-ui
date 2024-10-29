import { Commands } from "../constants/commands";
import { EFieldStatus } from "../enums/fieldStatus.enum";
import { Board, IField } from "../interfaces/board.interface";
import { IShip } from "../interfaces/ship.interface";
import Player from "./player.class";

export default class Game {
  public id: string;

  public players: { [key: string]: Player } = {};
  public currentIndexPlayer: string;

  public board: { [key: string]: Board } = {};

  private readonly _size = 10;

  create(gameId: string, players: { [key: string]: Player }) {
    this.id = gameId;
    this.players = players;
    this.currentIndexPlayer = Object.values(players)[0]?.index as string;

    Object.values(players).forEach((player) => {
      const gameBoard = this._createBoard(player.ships ?? []);
      this.board[player.index] = gameBoard;
    });

    return this;
  }

  public turnPlayer(indexPlayer?: string) {
    if (indexPlayer) {
      this.currentIndexPlayer = indexPlayer;
    }

    const player = this.players[this.currentIndexPlayer];

    if (!player) return null;

    player.ws.send(
      JSON.stringify({
        id: 0,
        type: Commands.Turn,
        data: JSON.stringify({ currentPlayer: this.currentIndexPlayer }),
      })
    );
  }

  public attack(x: number, y: number, indexPlayer: string) {
    if (this.currentIndexPlayer !== indexPlayer) {
      console.error(`Player turn ${this.currentIndexPlayer}`);
      return null;
    }

    const enemyPlayer = Object.values(this.players).find(
      (player) => player.index !== indexPlayer
    );

    if (!enemyPlayer?.index) {
      console.error(`Enemy not found`);
      return null;
    }

    const enemyBoard = this.board[enemyPlayer.index] as any;

    const field = enemyBoard[x][y] as IField;

    let status;

    if (!field.isEmpty) {
      status = EFieldStatus.Shot;
      const fieldShipId = field.ship?.id;
      const shotShip = enemyPlayer.ships.find(
        (ship) => ship.id === fieldShipId
      );

      console.log("Ship is shotted", JSON.stringify(shotShip));

      if (shotShip) {
        shotShip.woundedFields += 1;

        if (shotShip.woundedFields === shotShip.length) {
          status = EFieldStatus.Killed;
          shotShip.isKilled = true;
          // mark fields around ship

          // check win and finish game
          if (this._checkWin(enemyPlayer)) {
            this.finishGame(this.currentIndexPlayer);
          }
        }

        enemyBoard[x][y] = {
          ...field,
          status,
        };
        this.board[enemyPlayer.index] = enemyBoard;
        (this.players[enemyPlayer.index] as any) = {
          ...enemyPlayer,
          ships: enemyPlayer.ships.map((ship) =>
            ship.id === fieldShipId ? shotShip : ship
          ),
        };
      }
    } else {
      enemyBoard[x][y] = {
        ...enemyBoard[x][y],
        status: EFieldStatus.Miss,
      };

      status = EFieldStatus.Miss;

      // change turn;
      this.turnPlayer(enemyPlayer.index);
    }

    for (const player of Object.values(this.players)) {
      player.ws.send(
        JSON.stringify({
          id: 0,
          type: Commands.Attack,
          data: JSON.stringify({
            position: { x, y },
            status,
            currentPlayer: indexPlayer,
          }),
        })
      );
    }
  }

  public randomAttack(indexPlayer: string) {
    if (this.currentIndexPlayer !== indexPlayer) {
      console.error(`Player turn ${this.currentIndexPlayer}`);
      return null;
    }

    const enemyPlayer = Object.values(this.players).find(
      (player) => player.index !== indexPlayer
    );

    if (!enemyPlayer?.index) {
      console.error(`Enemy not found`);
      return null;
    }

    const enemyBoard = this.board[enemyPlayer.index] as any;

    const availableFields = [];
    for (let x = 0; x < this._size; x++) {
      for (let y = 0; y < this._size; y++) {
        if (enemyBoard[x][y].status === EFieldStatus.Default) {
          availableFields.push({ x, y });
        }
      }
    }

    if (availableFields.length > 0) {
      const random = Math.floor(Math.random() * availableFields.length);
      const { x, y } = availableFields[random] || {};

      if (x && y) {
        this.attack(x, y, indexPlayer);
      }
    } else {
      console.error("There are not avalibale fields");
    }
  }

  public finishGame(playerIndexId: string) {
    console.log(`Game is finished. Winner is ${playerIndexId}`);

    const winPlayer = this.players[playerIndexId];

    if (!winPlayer) return null;

    winPlayer.wins += 1;

    Object.values(this.players).forEach((player) => {
      player.ships = [];
      player.isReady = false;
      player.ws.send(
        JSON.stringify({
          id: 0,
          type: Commands.Finish,
          data: JSON.stringify({
            winPlayer: playerIndexId,
          }),
        })
      );
    });

    this._updateWinners();
  }

  private _updateWinners() {
    const winnersData = [...Object.values(this.players)]
      .map((player) => ({
        name: player.name,
        wins: player.wins,
      }))
      .sort((a, b) => b.wins - a.wins);

    Object.values(this.players).forEach((player) => {
      player.ws.send(
        JSON.stringify({
          id: 0,
          type: Commands.UpdateWinners,
          data: JSON.stringify(winnersData),
        })
      );
    });
  }

  private _createBoard(ships: IShip[]) {
    const newBoard: Board = Array.from({ length: this._size }, () =>
      Array.from({ length: this._size }, () => ({
        status: EFieldStatus.Default,
        isEmpty: true,
        ship: null,
      }))
    );

    ships.forEach((ship) => {
      for (let i = 0; i < ship.length; i++) {
        // direction = true - vertical
        // direction = false - horizontal
        const x = ship.direction ? ship.position.x : ship.position.x + i;
        const y = ship.direction ? ship.position.y + i : ship.position.y;

        if (newBoard[x] && newBoard[x]?.[y]) {
          (newBoard[x] as any)[y] = {
            ...(newBoard[x]?.[y] as any),
            isEmpty: false,
            ship: {
              ...ship,
              woundedFields: 0,
            },
          };
        }
      }
    });

    return newBoard;
  }

  private _checkWin(player: Player): boolean {
    return player.ships.every((ship) => ship?.isKilled);
  }
}
