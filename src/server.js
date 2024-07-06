const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let players = {}; // 存储所有玩家的位置

wss.on('connection', (ws) => {
  console.log('A new player connected.');

  ws.on('message', (message) => {
    let data = JSON.parse(message);

    if (data.type === 'update') {
      // 更新玩家位置
      players[data.id] = data.position;

      // 广播给所有玩家
      let updateMessage = JSON.stringify({
        type: 'update',
        id: data.id,
        position: data.position,
        color: data.color
      });
      console.log('===> updateMessage: ', updateMessage);
      wss.clients.forEach((client) => {

        if (client.readyState === WebSocket.OPEN) {
          client.send(updateMessage);
        }
      });
    }
  });

  ws.on('close', () => {
    // 处理玩家断线
    console.log('A player disconnected.');
  });
});

console.log('Server is running on ws://localhost:8080');
