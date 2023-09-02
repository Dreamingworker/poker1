document.addEventListener("DOMContentLoaded", () => {
            const contentDiv = document.getElementById("content");
            const players = [];
            let currentPlayerIndex = 0; // 当前决策玩家的索引
            let pot = 0; //池底金额
            let currentHighestBet = 0; //当前最高下注
            let playersOnTable = 0; //未弃牌玩家数

            function decisionable() { //如果还能做决策，返回T
                return (players.filter(player => (player.folded == false && (player.chips > 0))).length > 0 && playersOnTable > 1) //未弃牌玩家大于1且未弃牌又有钱的玩家数大于0
            }

            function showAddPlayersPage() { //首页-添加玩家页面
                contentDiv.innerHTML = `
            <h1>德州扑克筹码结算工具</h1>
            <div id="player-form">
                <h2>添加玩家</h2>
                <div>
                    <label for="uniform-chips">统一起始筹码</label>
                    <input type="number" id="uniform-chips-input" min="0" placeholder="选填">
                    <button id="set-uniform-chips">更新</button>
                </div>
                <div>
                    <label for="player-name">玩家姓名：</label>
                    <input type="text" id="player-name">
                </div>
                <div>
                    <label for="initial-chips">初始筹码：</label>
                    <input type="number" id="initial-chips" min="0">
                </div>
                <button id="add-player">添加玩家</button>
                <button id="start-game" disabled>开始游戏</button>
            </div>
            <div id="player-list"></div>
        `;

                const addPlayerButton = document.getElementById("add-player");
                const startGameButton = document.getElementById("start-game");
                const playerNameInput = document.getElementById("player-name");
                let initialChipsInput = document.getElementById("initial-chips");
                const playerList = document.getElementById("player-list");
                const uniformChipsInput = document.getElementById("uniform-chips-input");
                const setUniformChipsButton = document.getElementById("set-uniform-chips");

                uniformChipsInput.addEventListener("input", () => {
                    // 设置筹码输入框的默认值为统一筹码输入框的值
                    initialChipsInput.value = parseInt(uniformChipsInput.value);
                });

                setUniformChipsButton.addEventListener("click", () => { //更改已添加玩家的筹码
                    const uniformChips = parseInt(uniformChipsInput.value);
                    if (!isNaN(uniformChips) && uniformChips >= 0) {
                        for (const player of players) {
                            player.chips = uniformChips;
                        }
                        updatePlayerList();
                    }
                });
                let seatNumber = 1; // 初始座位号

                addPlayerButton.addEventListener("click", addPlayer);

                startGameButton.addEventListener("click", () => {
                    if (playerNameInput.value && initialChipsInput.value) {
                        addPlayer()
                    }
                    currentPlayerIndex = 0; // 从第一个玩家开始决策
                    playersOnTable = players.length;
                    showDecisionPage();
                });

                function addPlayer() {
                    const playerName = playerNameInput.value;
                    let initialChips = parseInt(initialChipsInput.value) //? parseInt(initialChipsInput.value) : parseInt(uniformChipsInput.value); //逻辑很差，需要优化

                    if (playerName && initialChips >= 0) {
                        players.push({
                            name: playerName,
                            chips: initialChips, //手中筹码量
                            inPot: 0, //已下注金额
                            seat: seatNumber, //座位号
                            folded: false //是否弃牌
                        });
                        playerNameInput.value = "";

                        initialChipsInput.value = parseInt(uniformChipsInput.value)

                        seatNumber++; // 增加座位号
                        updatePlayerList();
                        updateStartGameButton();

                    }
                }

                function updatePlayerList() {
                    const playerList = document.getElementById("player-list");
                    playerList.innerHTML = "";

                    for (const player of players) {
                        const playerDiv = document.createElement("div");
                        playerDiv.textContent = `座位号 ${player.seat} - ${player.name} - 初始筹码：${player.chips}`;
                        playerList.appendChild(playerDiv);
                    }
                }

                function updateStartGameButton() {
                    const startGameButton = document.getElementById("start-game");

                    if (players.length >= 2) {
                        startGameButton.removeAttribute("disabled");
                    } else {
                        startGameButton.setAttribute("disabled", "true");
                    }
                }
            }

            function showDecisionPage() { //玩家轮流决策页面
                const currentPlayer = players[currentPlayerIndex];
                if (currentPlayer.folded == false && currentPlayer.chips > 0) {

                    contentDiv.innerHTML = `
            <h1 id="decisionTitle">玩家决策界面</h1>
            <div id="game-info">
                <p>池底: ${pot}</p>
                <p>当前最高下注:${currentHighestBet}</p>
            </div>
            <div id="player-info">
            <p>剩余玩家：${playersOnTable}</p>
        ${players.map(player => `
            <p>${player.name} - 已下注:${player.inPot} - 剩余筹码:${player.chips}${player.inPot>0&&player.chips==0 ? " - All in" : ""}${player.folded ? " - 已弃牌" : ""}</p>
        `).join("")}
        <p>剩余玩家：${playersOnTable}</p>
    </div>
            <div id="player-actions">
                <h2>玩家 ${currentPlayer.seat}:${currentPlayer.name} 决策</h2>
                <p>本局已下注:${currentPlayer.inPot}剩余筹码:${currentPlayer .chips}</p>
                <div id="buttonContainer">
                    <div id="buttonsLine">
                <button id="call" ${currentHighestBet - currentPlayer.inPot > currentPlayer.chips ? "disabled":""}>跟注</button>
                <button id="all-in">All-in</button>
                <button id="fold">弃牌</button>
                <button id="skip" ${currentPlayer.inPot<currentHighestBet ? "disabled":""}>跳过</button>
                    </div>
                    <div id="inputLine>
                <label for="raise-amount">下注:</label>
                <input type="number" id="raise-amount" min="0" placeholder="下注金额">
                <button id="raise">加注</button>
                    </div>
                </div>
            </div>
            <button id="end-round">结束局面</button>
        `;

            const gameInfo = document.getElementById("game-info");
            const callButton = document.getElementById("call");
            const foldButton = document.getElementById("fold");
            const skipButton = document.getElementById("skip");
            const raiseAmountInput = document.getElementById("raise-amount");
            const raiseButton = document.getElementById("raise");
            const endRoundButton = document.getElementById("end-round");
            const allInbotton = document.getElementById("all-in")

            function bet(n) { //底层下注逻辑
                if (currentPlayer.chips >= n) {
                    currentPlayer.chips -= n;
                    currentPlayer.inPot += n;
                    pot += n;
                    if (currentPlayer.inPot > currentHighestBet) {
                        currentHighestBet = currentPlayer.inPot
                    }
                }
            }

            callButton.addEventListener("click", () => { // 处理跟注逻辑       
                if (currentHighestBet - currentPlayer.inPot <= currentPlayer.chips) {
                    bet(currentHighestBet - currentPlayer.inPot);
                    nextPlayer();
                } else {
                    alert("筹码不足")
                }
            });

            foldButton.addEventListener("click", () => { // 处理弃牌逻辑
                currentPlayer.folded = true;
                playersOnTable -= 1;
                nextPlayer();
            });

            skipButton.addEventListener("click", () => {
                nextPlayer();
            });

            raiseButton.addEventListener("click", () => { // 处理加注逻辑
                const raiseAmount = parseInt(raiseAmountInput.value);
                if (currentPlayer.inPot + raiseAmount < currentHighestBet) {
                    alert("至少追平当前最高下注")
                } else if (currentPlayer.chips >= raiseAmount) {
                    bet(raiseAmount)
                    nextPlayer();
                } else {
                    alert("筹码不足")
                }


            });
            allInbotton.addEventListener("click", () => { //All-in逻辑
                if (currentPlayer.chips > 0) {
                    bet(currentPlayer.chips)
                    nextPlayer()
                } else {
                    alert("筹码已空")
                }
            });

            function nextPlayer() { // 显示下一个玩家的决策界面
                if (!decisionable()) {
                    updateRemainingPlayersList();
                } else {
                    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                    showDecisionPage();
                }
            };


            endRoundButton.addEventListener("click", () => {// 处理结束局面，分配池底中的筹码给获胜的玩家
                
                updateRemainingPlayersList();

            });
        } else { //转由下一个没有弃牌的玩家决策
            if(!decisionable()){
                updateRemainingPlayersList()
            }
            else{
            currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            showDecisionPage();
            }
        }
    }

    function showEndRoundPage() { //结算页面
        const remainingPlayers = players.filter(player => !player.folded);
        const otherPlayers = players.filter(player => player.folded);

        contentDiv.innerHTML = `
                    <h1>局面结束</h1>
                    <div id="pot-info">
                        <p>池底金额：${pot}</p>
                    </div>
                    <div id="remaining-players">
                        <h2>剩余玩家信息</h2>
                        <ul>
                            ${remainingPlayers.map(player => `
                                <li>
                                    座位号 ${player.seat} - ${player.name} - 本局下注：${player.inPot} 手中筹码：${player.chips}
                                    <button class="retrieve-chips" data-seat="${player.seat}">取回筹码</button>
                                    <button class="all-retrieve" data-seat="${player.seat}">全部取回</button>
                                </li>
                            `).join("")}
                        </ul>
                        <h3>已弃牌玩家信息</h3>
                        <ul>
                            ${otherPlayers.map(player => `
                                <li>
                                    座位号 ${player.seat} - ${player.name} - 本局下注：${player.inPot} 手中筹码：${player.chips}
                                    <button class="retrieve-chips" data-seat="${player.seat}">取回筹码</button>
                                </li>
                            `).join("")}
                        </ul>
                        <button id="next-round">下一手牌</button>
                    </div>
                `;

        const potInfo = document.getElementById("pot-info");
        const remainingPlayersList = document.getElementById("remaining-players");
        const retrieveButtons = document.querySelectorAll(".retrieve-chips");
        const allRetrieveButtons = document.querySelectorAll(".all-retrieve");
        const nextRoundButton = document.getElementById("next-round");

        retrieveButtons.forEach(button => {
            button.addEventListener("click", () => {
                const seat = parseInt(button.dataset.seat);
                const retrieveAmount = parseInt(prompt(`玩家 ${players[seat - 1].name}，请输入取回的金额：`));

                if (!isNaN(retrieveAmount) && retrieveAmount <= pot) {
                    players[seat - 1].chips += retrieveAmount;
                    pot -= retrieveAmount;
                    updateRemainingPlayersList();
                } else {
                    alert("输入无效或金额超过池底金额。");
                }
            });
        });

        allRetrieveButtons.forEach(button => {
            button.addEventListener("click", () => {
                const seat = parseInt(button.dataset.seat);
                const player = players[seat - 1];
                player.chips += pot;
                pot = 0;
                updateRemainingPlayersList();
            });
        });

        nextRoundButton.addEventListener("click", () => {
            if (pot == 0) {

                for (const player of players) {
                    player.folded = false;
                    player.inPot = 0;
                }
                currentHighestBet = 0;
                currentPlayerIndex = 0;
                playersOnTable = players.length;
                showDecisionPage();
            } else {
                alert("请将筹码完全分配");
            }
        })

        // ...其他代码...
    }

    function updateRemainingPlayersList() {
        showEndRoundPage(); // 更新剩余玩家列表
    }
    // 初始显示添加玩家页面
    showAddPlayersPage();
});