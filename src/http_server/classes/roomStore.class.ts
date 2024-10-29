import Player from "./player.class";
import Room from "./room.class";

export default class RoomStore {
  private _roomStore: { [key: string]: Room } = {};

  public create() {
    const room = new Room();
    const newRoom = room.create();

    this._save(newRoom);

    return newRoom;
  }

  public addPlayerToRoom(indexRoom: string, player: Player) {
    const room = this._roomStore[indexRoom];

    if (!room) return null;

    room.addPlayer(player);

    return room;
  }

  public getRooms(): Room[] {
    return Object.values(this._roomStore).filter((room) => room.isAvailable);
  }

  private _save(room: Room) {
    this._roomStore[room.indexRoom] = room;
  }
}
