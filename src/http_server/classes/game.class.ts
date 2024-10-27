import { Commands } from "../constants/commands";
import { EFieldStatus } from "../enums/fieldStatus.enum";
import { Board, IField } from "../interfaces/board.interface";
import { IShip } from "../interfaces/ship.interface";
import Player from "./player.class";

export default class Game {
  public id: string;

  public players: { [key: string]: Player } = {};
  public currentIndexPlayer: string;

  public board: Map<string, Board> = new Map();

  private readonly _size = 10;

  create(gameId: string, players: { [key: string]: Player }) {
    this.id = gameId;
    this.players = players;
    this.currentIndexPlayer = Object.values(players)[0]?.index as string;

    Object.values(players).forEach((player) => {
      const gameBoard = this._createBoard(player.ships ?? []);
      this.board.set(player.index, gameBoard);
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

    const enemyBoard = this.board.get(enemyPlayer.index) as any;

    const field = enemyBoard[x][y] as IField;

    let status;

    if (!field.isEmpty) {
      status = EFieldStatus.Shot;
      const ship = field.ship;

      if (ship) {
        ship.woundedFields += 1;

        if (ship.woundedFields === ship.length) {
          status = EFieldStatus.Killed;
          // mark fields around ship
          // check win and finish game
        }
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
            ship,
          };
        }
      }
    });

    return newBoard;
  }
}
