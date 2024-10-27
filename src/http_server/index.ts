import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { WebSocketServer } from "ws";
import PlayerStore from "./classes/playerStore.class";
import RoomStore from "./classes/roomStore.class";
import Player from "./classes/player.class";
import Room from "./classes/room.class";
import GameStore from "./classes/gameStore.class";
import { Commands } from "./constants/commands";

export const httpServer = http.createServer(function (req, res) {
  const __dirname = path.resolve(path.dirname(""));
  const file_path =
    __dirname + (req.url === "/" ? "/front/index.html" : "/front" + req.url);
  fs.readFile(file_path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

const playerStore = new PlayerStore();
const roomStore = new RoomStore();
const gameStore = new GameStore();

export const wss = new WebSocketServer({ port: 3000 });

wss.on("connection", function connection(ws) {
  let player: Player;
  let room: Room | null;

  ws.on("message", function message(msg: any) {
    console.log("Received message: %s", msg);

    const message = JSON.parse(msg);

    const { id, type, data } = message;

    if (type === Commands.Registration) {
      player = playerStore.register(JSON.parse(data), ws);

      const res = {
        id,
        type,
        data: JSON.stringify(player),
      };

      ws.send(JSON.stringify(res));

      if (!player.error) {
        const availableRooms = roomStore.getRooms().map((room) => ({
          roomId: room.indexRoom,
          roomUsers: room.roomUsers,
        }));

        ws.send(
          JSON.stringify({
            id,
            type: Commands.UpdateRoom,
            data: JSON.stringify(availableRooms),
          })
        );

        // update winner should be send
      }
    }

    if (type === Commands.CreateRoom) {
      const newRoom = roomStore.create();
      room = roomStore.addPlayerToRoom(newRoom.indexRoom, player);

      const res = {
        id,
        type: Commands.UpdateRoom,
        data: JSON.stringify([
          {
            roomId: room?.indexRoom,
            roomUsers: room?.roomUsers,
          },
        ]),
      };

      ws.send(JSON.stringify(res));
    }

    if (type === Commands.AddUserToRoom) {
      const { indexRoom } = JSON.parse(data);
      room = roomStore.addPlayerToRoom(indexRoom, player);

      const res = {
        id,
        type: Commands.UpdateRoom,
        data: JSON.stringify([
          {
            roomId: room?.indexRoom,
            roomUsers: room?.roomUsers,
          },
        ]),
      };

      ws.send(JSON.stringify(res));
    }
  });

  ws.on("close", function () {
    console.log("WS server is closed");
  });

  //   ws.send(JSON.stringify(`Connected in 3000 port`));
});
