import { getRandomColor } from './utils';

const ws = new WebSocket("ws://localhost:8080");
const playerId = Math.random().toString(36).substring(7); // 随机生成一个玩家ID
let playersInfo = {}; // 存储其他玩家的位置
let targetPosition = null; // 目标位置
const speed = 2; // 移动速度

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

ws.onopen = () => {
  console.log("Connected to the server");
  // 初始化随机位置
  playersInfo[playerId] = {
    position: { x: (Math.random() + 1) * 100, y: (Math.random() + 1) * 100 },
    color: getRandomColor()
  };
};

ws.onmessage = (event) => {
  const { type, id, ...rest } = JSON.parse(event.data);

  if (type === "update") {
    // 更新玩家位置
    playersInfo[id] = { ...rest };
  }
};

// 监听鼠标右键点击事件
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault(); // 阻止默认的右键菜单弹出行为
  const rect = canvas.getBoundingClientRect();
  // 记录移动的目标位置
  targetPosition = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
});

// 更新玩家位置
function updatePlayerPosition() {
  if (targetPosition && playersInfo[playerId].position) {
    let currentPosition = playersInfo[playerId].position;
    let dx = targetPosition.x - currentPosition.x;
    let dy = targetPosition.y - currentPosition.y;
    let distance = Math.sqrt(dx * dx + dy * dy); // 计算需要移动的距离

    // 需要移动的距离大于单次移动的距离，需要拆解成多次移动
    if (distance > speed) {
      let angle = Math.atan2(dy, dx);
      // 分别单次获取x，y轴上的移动目标位置
      currentPosition.x += Math.cos(angle) * speed;
      currentPosition.y += Math.sin(angle) * speed;

      // 发送更新后的位置到服务器
      ws.send(
        JSON.stringify({
          type: "update",
          id: playerId,
          position: currentPosition,
        })
      );

      // 更新自己的位置
      // playersInfo[playerId] = currentPosition;
    } else {
      // 到达目标位置
      playersInfo[playerId].position = targetPosition;
      targetPosition = null;

      // 发送最终位置到服务器
      ws.send(
        JSON.stringify({
          type: "update",
          id: playerId,
          position: playersInfo[playerId].position,
        })
      );
    }
  }
}

// 绘制所有玩家的位置
function drawPlayers() {
  context.clearRect(0, 0, canvas.width, canvas.height); // 清除画布

  for (let id in playersInfo) {
    let { position: pos, color } = playersInfo[id];
    context.beginPath();
    context.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
    context.stroke();
  }
}

// 动画循环
function animate() {
  updatePlayerPosition(); // 更新玩家位置
  drawPlayers(); // 绘制玩家位置
  requestAnimationFrame(animate);
}

// 启动动画循环
animate();