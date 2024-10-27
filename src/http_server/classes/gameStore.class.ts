import Game from "./game.class";

export default class GameStore {
  private _games: { [key: string]: Game } = {};

  public create(id: string, game: Game) {
    this._games[id] = game;
  }
}
