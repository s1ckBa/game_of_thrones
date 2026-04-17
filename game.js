class Person {
    constructor(id, name, role, age, gender, fatherId = null, motherId = null, spouseId = null, spouseName = null) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.age = age;
        this.gender = gender;
        this.fatherId = fatherId;
        this.motherId = motherId;
        this.spouseId = spouseId;
        this.spouseName = spouseName;
        this.isSquire = false;
        this.isKnight = false;
        this.squireYears = 0;
        this.knightChance = 30;
        this.isMarried = false;
    }
}

class City {
    constructor(id, hexRow, hexCol, name, strength, playerId, kind = "normal", parentId = null) {
        this.id = id;
        this.hexRow = hexRow;
        this.hexCol = hexCol;
        this.name = name;
        this.strength = strength;
        this.gold = 0;
        this.army = 0;
        this.ships = 0;
        this.playerId = playerId;
        this.kind = kind;
        this.parentId = parentId;
        this.governorId = null;
        this.isStartCity = false;
        this.treasuryForId = null;
        this.hasQuarry = false;
        this.hasSawmill = false;
        this.siegeWeapons = 0;
    }
}

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.persons = [];
        this.cities = [];
        this.hasEndedTurn = false;
        this.lordCityHex = null;
        this.vassalCityHex = null;
        this.lordStrength = null;
        this.vassalHouseName = null;
        this.vassalFamily = [];
        this.vassalHouses = [];
    }
}

class Game {
    constructor() {
        this.hexes = [];
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentTurn = 0;
        this.totalYears = 0;
        this.chronicle = [];
        this.gameStarted = false;
        this.creationPhase = true;
        this.currentCreatingPlayer = null;
        this.creationStep = 0;
        this.selectedLordHex = null;
        this.selectedVassalHex = null;
        this.pendingCityStrength = null;
        this.selectedCityForAction = null;
        this.pendingBuildData = null;
        this.selectLocationMode = false;
        this.pendingMarriageProposals = [];
        this.pendingSquireProposals = [];

        this.HEX_W = 20;
        this.HEX_R = 12;
        this.COLS = 36;
        this.ROWS = 46;
        this.PAD_X = 20;
        this.PAD_Y = -5;

        this.ROLES = ["Король", "Лорд", "Супруга", "Наследник", "Дочь", "Брат", "Сестра", "Рыцарь", "Мейстер", "Оруженосец"];

        this.init();
    }

    // Добавьте в начало класса Game, после конструктора:
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // И в методе init() после loadFromStorage() добавьте:
    if(this.isMobile()) {
    // Уменьшаем количество гексов для мобильных устройств
    this.COLS = 18;
    this.ROWS = 24;
    this.initHexes();
    this.drawMap();
}

    init() {
        this.initHexes();
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupPlayerNamesPanel();
        this.drawMap();
    }

    initHexes() {
        this.hexes = [];
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                let offX = (row % 2 === 0) ? 0 : this.HEX_W / 2;
                let x = col * this.HEX_W + offX + this.HEX_W / 2 + this.PAD_X;
                let y = row * this.HEX_W * 0.85 + this.HEX_W / 2 + this.PAD_Y;

                let terrain = "plain";
                let rand = Math.random();
                if (rand < 0.15) terrain = "mountain";
                else if (rand < 0.3) terrain = "forest";
                else if (rand < 0.4) terrain = "water";

                this.hexes.push({ row, col, x, y, cityId: null, terrain: terrain });
            }
        }
    }

    setupPlayerNamesPanel() {
        const select = document.getElementById("playerCountSelect");
        const panel = document.getElementById("playerNamesPanel");

        const updatePanel = () => {
            const count = parseInt(select.value);
            panel.innerHTML = "";
            for (let i = 0; i < count; i++) {
                const div = document.createElement("div");
                div.className = "player-name-input";
                div.innerHTML = `
                    <span>Дом ${i + 1}:</span>
                    <input type="text" id="playerName_${i}" placeholder="Название дома" value="Дом ${String.fromCharCode(65 + i)}">
                `;
                panel.appendChild(div);
            }
        };

        select.addEventListener("change", updatePanel);
        updatePanel();
    }

    getHexAtPixel(mx, my) {
        for (let h of this.hexes) {
            let dx = mx - h.x, dy = my - h.y;
            if (Math.hypot(dx, dy) < this.HEX_R) return h;
        }
        return null;
    }

    getCityAtHex(hex) {
        for (let p of this.players) {
            let city = p.cities.find(c => c.hexRow === hex.row && c.hexCol === hex.col);
            if (city) return city;
        }
        return null;
    }

    getPlayerCities(playerId) {
        let player = this.players.find(p => p.id === playerId);
        return player ? player.cities : [];
    }

    addChronicle(text) {
        this.chronicle.unshift({ year: this.totalYears, text: text });
        this.updateChronicleDisplay();
        this.saveToStorage();
    }

    updateChronicleDisplay() {
        let chronicleDiv = document.getElementById("chronicleList");
        if (!chronicleDiv) return;
        chronicleDiv.innerHTML = this.chronicle.slice(0, 20).map(c =>
            `<div class="chronicle-entry">Год ${c.year}: ${c.text}</div>`
        ).join("");
    }

    saveToStorage() {
        const saveData = {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                persons: p.persons,
                cities: p.cities,
                lordCityHex: p.lordCityHex,
                vassalCityHex: p.vassalCityHex,
                lordStrength: p.lordStrength,
                vassalHouseName: p.vassalHouseName,
                vassalFamily: p.vassalFamily,
                vassalHouses: p.vassalHouses || []
            })),
            currentPlayerIndex: this.currentPlayerIndex,
            currentTurn: this.currentTurn,
            totalYears: this.totalYears,
            chronicle: this.chronicle,
            gameStarted: this.gameStarted
        };
        localStorage.setItem('gameSave', JSON.stringify(saveData));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('gameSave');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.players = data.players.map(p => {
                    let player = new Player(p.id, p.name);
                    player.persons = p.persons;
                    player.cities = p.cities;
                    player.lordCityHex = p.lordCityHex;
                    player.vassalCityHex = p.vassalCityHex;
                    player.lordStrength = p.lordStrength;
                    player.vassalHouseName = p.vassalHouseName;
                    player.vassalFamily = p.vassalFamily || [];
                    player.vassalHouses = p.vassalHouses || [];
                    return player;
                });
                this.currentPlayerIndex = data.currentPlayerIndex;
                this.currentTurn = data.currentTurn;
                this.totalYears = data.totalYears;
                this.chronicle = data.chronicle;
                this.gameStarted = data.gameStarted;

                if (this.gameStarted) {
                    document.getElementById("mainMenu").style.display = "none";
                    document.getElementById("gameContainer").style.display = "block";
                    this.updateUI();
                    this.drawMap();
                }
            } catch (e) { console.log("No save found"); }
        }
    }

    resetGame() {
        localStorage.removeItem('gameSave');
        location.reload();
    }

    drawMap() {
        let canvas = document.getElementById("mapCanvas");
        let ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = this.COLS * this.HEX_W + this.PAD_X * 2;
        canvas.height = this.ROWS * this.HEX_W * 0.85 + this.HEX_W + this.PAD_Y * 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let backgroundImage = new Image();
        backgroundImage.src = "map3.jpg";
        backgroundImage.onload = () => {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            this.drawHexes(ctx);
        };
        backgroundImage.onerror = () => {
            ctx.fillStyle = "#4f6a3e";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            this.drawHexes(ctx);
        };
        if (backgroundImage.complete) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            this.drawHexes(ctx);
        } else {
            ctx.fillStyle = "#4f6a3e";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            this.drawHexes(ctx);
        }
    }

    drawHexes(ctx) {
        for (let h of this.hexes) {
            let city = this.getCityAtHex(h);

            if (city) {
                let player = this.players.find(p => p.id === city.playerId);
                let isCurrentPlayer = player && this.players[this.currentPlayerIndex] && player.id === this.players[this.currentPlayerIndex].id;
                if (!isCurrentPlayer && this.gameStarted && !this.creationPhase) ctx.fillStyle = "rgba(180, 70, 70, 0.7)";
                else if (city.kind === "treasury") ctx.fillStyle = "rgba(220, 190, 80, 0.7)";
                else ctx.fillStyle = "rgba(80, 130, 70, 0.7)";
            } else {
                if (h.terrain === "mountain") ctx.fillStyle = "rgba(120, 100, 80, 0.7)";
                else if (h.terrain === "forest") ctx.fillStyle = "rgba(60, 100, 50, 0.6)";
                else if (h.terrain === "water") ctx.fillStyle = "rgba(50, 100, 150, 0.6)";
                else ctx.fillStyle = "rgba(80, 130, 70, 0.4)";
            }

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                let ang = i * Math.PI * 2 / 6 - Math.PI / 6;
                let x = h.x + Math.cos(ang) * this.HEX_R;
                let y = h.y + Math.sin(ang) * this.HEX_R;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.fill();
            ctx.strokeStyle = "#b89a6a";
            ctx.lineWidth = 1;
            ctx.stroke();

            if (!city && h.terrain !== "water") {
                ctx.font = "10px Georgia";
                if (h.terrain === "mountain") {
                    ctx.fillStyle = "#d4c4a8";
                    ctx.fillText("⛰️", h.x - 6, h.y + 5);
                } else if (h.terrain === "forest") {
                    ctx.fillStyle = "#8bc34a";
                    ctx.fillText("🌲", h.x - 6, h.y + 5);
                } else {
                    ctx.fillStyle = "#a8d5a2";
                    ctx.fillText("🌾", h.x - 6, h.y + 5);
                }
            }

            if (h.terrain === "water" && !city) {
                ctx.fillStyle = "#88bbdd";
                ctx.font = "10px Georgia";
                ctx.fillText("🌊", h.x - 6, h.y + 5);
            }

            if (this.creationPhase && this.selectedLordHex === h) {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    let ang = i * Math.PI * 2 / 6 - Math.PI / 6;
                    let x = h.x + Math.cos(ang) * this.HEX_R;
                    let y = h.y + Math.sin(ang) * this.HEX_R;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = "gold";
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.lineWidth = 1;
            }

            if (this.creationPhase && this.selectedVassalHex === h) {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    let ang = i * Math.PI * 2 / 6 - Math.PI / 6;
                    let x = h.x + Math.cos(ang) * this.HEX_R;
                    let y = h.y + Math.sin(ang) * this.HEX_R;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = "#ff8844";
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.lineWidth = 1;
            }

            if (this.selectLocationMode && this.pendingBuildData && !city) {
                let isValid = this.pendingBuildData.availableHexes.some(ah => ah.row === h.row && ah.col === h.col);
                if (isValid) {
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        let ang = i * Math.PI * 2 / 6 - Math.PI / 6;
                        let x = h.x + Math.cos(ang) * this.HEX_R;
                        let y = h.y + Math.sin(ang) * this.HEX_R;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.strokeStyle = "#88ff88";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.lineWidth = 1;
                }
            }

            if (city) {
                // Определяем размер шрифта в зависимости от устройства
                let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                let fontSize = isMobile ? 14 : 11;

                ctx.font = `bold ${fontSize}px consolas`;
                ctx.fillStyle = "#ffefcf";
                let shortName = city.name.length > 6 ? city.name.substring(0, 6) : city.name;
                ctx.fillText(shortName + "(" + city.strength + ")", h.x - 18, h.y - 10);
                ctx.font = `${fontSize}px consolas`;
                ctx.fillStyle = "#ffd966";
                ctx.fillText(city.gold, h.x - 14, h.y + 6);
                ctx.fillStyle = "#ffaa66";
                ctx.fillText(city.army, h.x - 14, h.y + 18);

                if (city.hasQuarry) {
                    ctx.fillStyle = "#b0a070";
                    ctx.font = `${fontSize}px Georgia`;
                    ctx.fillText("⛏️", h.x + 12, h.y - 6);
                }
                if (city.hasSawmill) {
                    ctx.fillStyle = "#90c070";
                    ctx.font = `${fontSize}px Georgia`;
                    ctx.fillText("🪵", h.x + 12, h.y + 4);
                }
                if (city.siegeWeapons > 0) {
                    ctx.fillStyle = "#d09050";
                    ctx.font = `${fontSize}px Georgia`;
                    ctx.fillText("🏹" + city.siegeWeapons, h.x + 12, h.y + 14);
                }
            }
        }
    }

    updateUI() {
        if (!this.gameStarted) return;
        let currentPlayer = this.players[this.currentPlayerIndex];

        let html = `<h3>🏰 Дом ${currentPlayer.name}</h3>`;
        html += `<div style="font-size:12px; margin-bottom:10px;">💰 Золото: ${currentPlayer.cities.reduce((s, c) => s + c.gold, 0)} | ⚔️ Армия: ${currentPlayer.cities.reduce((s, c) => s + c.army, 0)}</div>`;

        for (let city of currentPlayer.cities) {
            let cityClass = "";
            let icon = "";
            if (city.kind === "treasury") { cityClass = "treasury"; icon = "🏦 "; }
            else if (city.kind === "heir") { cityClass = "heir"; icon = "👑 "; }
            else if (city.isStartCity) { cityClass = "lord"; icon = "🏰 "; }
            else { cityClass = "vassal"; icon = "⚔️ "; }

            let governorText = "";
            if (city.governorId) {
                let governor = currentPlayer.persons.find(p => p.id === city.governorId);
                if (governor) governorText = `<br><span style="font-size:10px;">👤 Управляющий: ${governor.name}</span>`;
            }

            html += `<div class="city-card ${cityClass}" data-id="${city.id}">
                <b>${icon}${city.name}</b><br>
                💰 ${city.gold}/${city.strength} ⚔️ ${city.army}/${city.strength}
                ${governorText}
            </div>`;
        }

        let lordFamily = currentPlayer.persons.filter(p => {
            if (!currentPlayer.vassalHouses) return true;
            for (let vh of currentPlayer.vassalHouses) {
                if (vh.family.some(v => v.id === p.id)) return false;
            }
            return true;
        });

        html += `<hr><h4>👑 Семья Дома ${currentPlayer.name}</h4>`;
        for (let person of lordFamily) {
            let status = "";
            if (person.isMarried) status += ` 💍 Супруг(а): ${person.spouseName || "неизвестен"}`;
            if (person.isSquire) status += " ⚔️ Оруженосец";
            if (person.isKnight) status += " 🛡️ Рыцарь";
            html += `<div class="family-member" data-person="${person.id}">${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "М" : "Ж"})${status}</div>`;
        }

        if (currentPlayer.vassalHouses && currentPlayer.vassalHouses.length > 0) {
            for (let vh of currentPlayer.vassalHouses) {
                html += `<hr><h4>⚔️ Вассальный дом ${vh.houseName}</h4>`;
                for (let person of vh.family) {
                    let status = "";
                    if (person.isMarried) status += ` 💍 Супруг(а): ${person.spouseName || "неизвестен"}`;
                    if (person.isSquire) status += " ⚔️ Оруженосец";
                    if (person.isKnight) status += " 🛡️ Рыцарь";
                    html += `<div class="family-member" data-person="${person.id}">${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "М" : "Ж"})${status}</div>`;
                }
            }
        }

        document.getElementById("dynamicContent").innerHTML = html;
        document.getElementById("currentPlayerName").innerText = currentPlayer.name;
        document.getElementById("turnCount").innerText = this.currentTurn;
        document.getElementById("currentYear").innerText = this.totalYears;
        document.getElementById("globalMsg").innerHTML = this.creationPhase ? `${currentPlayer.name}: выберите гекс для столицы` : `Ход игрока ${currentPlayer.name}`;

        this.attachListeners();
    }

    attachListeners() {
        document.querySelectorAll(".city-card").forEach(card => {
            card.addEventListener("click", (e) => {
                e.stopPropagation();
                let id = parseFloat(card.dataset.id);
                let city = this.players[this.currentPlayerIndex].cities.find(c => c.id === id);
                if (city && this.gameStarted && !this.creationPhase) {
                    this.selectedCityForAction = city;
                    this.showCityMenu(city);
                }
            });
        });

        document.querySelectorAll(".family-member[data-person]").forEach(el => {
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                let personId = parseFloat(el.dataset.person);
                let person = this.players[this.currentPlayerIndex].persons.find(p => p.id === personId);
                if (person) this.showPersonInfo(person);
            });
        });
    }

    showPersonInfo(person) {
        let html = `<div class="build-dialog">
            <h3>${person.name}</h3>
            <p>Роль: ${person.role}</p>
            <p>Возраст: ${person.age} лет</p>
            <p>Пол: ${person.gender === "male" ? "Мужской" : "Женский"}</p>
            <p>Супруг(а): ${person.spouseName || "нет"}</p>
            <p>Статус: ${person.isKnight ? "Рыцарь" : (person.isSquire ? "Оруженосец" : "Обычный")}</p>
            <button id="closePersonInfo">Закрыть</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;
        document.getElementById("closePersonInfo").onclick = () => this.updateUI();
    }

    showCityMenu(city) {
        let html = `<div class="build-dialog">
            <h3>${city.name}</h3>
            <p>Сила: ${city.strength} | Золото: ${city.gold} | Армия: ${city.army}</p>
            <button id="buildTreasuryBtn">🏦 Построить казначейство (сила до 2)</button>
            <button id="buildHeirBtn">👑 Построить город наследника</button>
            <button id="buildVassalBtn">⚔️ Построить новый вассальный город</button>
            <button id="upgradeCityBtn">⬆️ Улучшить город</button>
            <button id="assignGovernorBtn">👤 Назначить управляющего</button>
            <button id="actionBtn">⚔️ Совершить действие</button>
            <button id="closeCityMenu">❌ Закрыть</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("buildTreasuryBtn").onclick = () => this.showBuildOptions(city, "treasury");
        document.getElementById("buildHeirBtn").onclick = () => this.showBuildOptions(city, "heir");
        document.getElementById("buildVassalBtn").onclick = () => this.showBuildOptions(city, "vassal");
        document.getElementById("upgradeCityBtn").onclick = () => this.upgradeCity(city);
        document.getElementById("assignGovernorBtn").onclick = () => this.showAssignGovernor(city);
        document.getElementById("actionBtn").onclick = () => this.showActionMenu(city);
        document.getElementById("closeCityMenu").onclick = () => this.updateUI();
    }

    showActionMenu(city) {
        let currentPlayer = this.players[this.currentPlayerIndex];
        let cityHex = this.hexes.find(h => h.row === city.hexRow && h.col === city.hexCol);

        let hasMountainNearby = false;
        let hasForestNearby = false;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                let neighbor = this.hexes.find(h => h.row === city.hexRow + dr && h.col === city.hexCol + dc);
                if (neighbor) {
                    if (neighbor.terrain === "mountain") hasMountainNearby = true;
                    if (neighbor.terrain === "forest") hasForestNearby = true;
                }
            }
        }

        let html = `<div class="build-dialog">
            <h3>⚔️ Действия для города ${city.name}</h3>`;

        if (hasMountainNearby && !city.hasQuarry && city.gold >= 1) {
            html += `<button id="buildQuarryBtn">⛏️ Построить каменоломню (1 золото) → +1 к силе при строительстве</button><br>`;
        }
        if (hasForestNearby && !city.hasSawmill && city.gold >= 1) {
            html += `<button id="buildSawmillBtn">🪵 Построить лесопилку (1 золото) → осадные орудия +1</button><br>`;
        }
        if (!hasMountainNearby && !city.hasQuarry) {
            html += `<p>❌ Рядом нет гор для каменоломни</p>`;
        }
        if (!hasForestNearby && !city.hasSawmill) {
            html += `<p>❌ Рядом нет леса для лесопилки</p>`;
        }
        if (city.hasQuarry) html += `<p>✅ Каменоломня уже построена</p>`;
        if (city.hasSawmill) html += `<p>✅ Лесопилка уже построена</p>`;

        html += `<button id="closeActionMenu">Закрыть</button></div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        if (hasMountainNearby && !city.hasQuarry && city.gold >= 1) {
            document.getElementById("buildQuarryBtn").onclick = () => {
                if (city.gold >= 1) {
                    city.gold -= 1;
                    city.hasQuarry = true;
                    this.addChronicle(`${currentPlayer.name} построил каменоломню рядом с городом ${city.name}`);
                    this.updateUI();
                    this.drawMap();
                }
            };
        }
        if (hasForestNearby && !city.hasSawmill && city.gold >= 1) {
            document.getElementById("buildSawmillBtn").onclick = () => {
                if (city.gold >= 1) {
                    city.gold -= 1;
                    city.hasSawmill = true;
                    city.siegeWeapons += 1;
                    this.addChronicle(`${currentPlayer.name} построил лесопилку рядом с городом ${city.name}. Осадные орудия +1`);
                    this.updateUI();
                    this.drawMap();
                }
            };
        }
        document.getElementById("closeActionMenu").onclick = () => this.updateUI();
    }

    showAssignGovernor(city) {
        let currentPlayer = this.players[this.currentPlayerIndex];
        let availablePersons = currentPlayer.persons.filter(p => p.age >= 16 && p.id !== city.governorId);

        if (availablePersons.length === 0) {
            alert("Нет доступных управляющих");
            return;
        }

        let html = `<div class="build-dialog">
            <h3>Назначить управляющего для ${city.name}</h3>
            <p>Город-казначейство без управляющего не может быть улучшен выше силы 2</p>`;
        for (let person of availablePersons) {
            html += `<div class="family-member" data-person="${person.id}">${person.name} (${person.role}, ${person.age} лет)</div>`;
        }
        html += `<button id="cancelAssign">Отмена</button></div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.querySelectorAll("[data-person]").forEach(el => {
            el.onclick = () => {
                let personId = parseFloat(el.dataset.person);
                city.governorId = personId;
                let person = currentPlayer.persons.find(p => p.id === personId);
                this.addChronicle(`${person.name} назначен управляющим города ${city.name}`);
                this.updateUI();
            };
        });
        document.getElementById("cancelAssign").onclick = () => this.updateUI();
    }

    findNearbyEmptyHexes(city) {
        let cityHex = this.hexes.find(h => h.row === city.hexRow && h.col === city.hexCol);
        if (!cityHex) return [];
        let available = [];
        for (let h of this.hexes) {
            let existingCity = this.getCityAtHex(h);
            // Проверяем, что гекс пустой, не вода, и не соседствует с другими городами
            if (!existingCity && h.terrain !== "water") {
                let distFromSource = Math.abs(h.row - cityHex.row) + Math.abs(h.col - cityHex.col);
                // Расстояние от города-источника должно быть от 2 до 3 (не соседний)
                if (distFromSource >= 2 && distFromSource <= 3) {
                    // Дополнительно проверяем, что рядом нет других городов
                    let hasNeighborCity = false;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            let neighborHex = this.hexes.find(nh => nh.row === h.row + dr && nh.col === h.col + dc);
                            if (neighborHex && this.getCityAtHex(neighborHex)) {
                                hasNeighborCity = true;
                                break;
                            }
                        }
                    }
                    if (!hasNeighborCity) {
                        available.push(h);
                    }
                }
            }
        }
        return available;
    }

    showBuildOptions(sourceCity, buildType = "treasury") {
        let allPlayerCities = this.players[this.currentPlayerIndex].cities;
        let availableHexes = [];

        for (let city of allPlayerCities) {
            let cityHex = this.hexes.find(h => h.row === city.hexRow && h.col === city.hexCol);
            if (cityHex) {
                for (let h of this.hexes) {
                    let existingCity = this.getCityAtHex(h);
                    if (!existingCity && h.terrain !== "water") {
                        let dist = Math.abs(h.row - cityHex.row) + Math.abs(h.col - cityHex.col);
                        // Расстояние от 2 до 3
                        if (dist >= 2 && dist <= 3) {
                            // Проверяем, что рядом нет других городов
                            let hasNeighborCity = false;
                            for (let dr = -1; dr <= 1; dr++) {
                                for (let dc = -1; dc <= 1; dc++) {
                                    if (dr === 0 && dc === 0) continue;
                                    let neighborHex = this.hexes.find(nh => nh.row === h.row + dr && nh.col === h.col + dc);
                                    if (neighborHex && this.getCityAtHex(neighborHex)) {
                                        hasNeighborCity = true;
                                        break;
                                    }
                                }
                            }
                            if (!hasNeighborCity && !availableHexes.some(ah => ah.row === h.row && ah.col === h.col)) {
                                availableHexes.push(h);
                            }
                        }
                    }
                }
            }
        }

        if (availableHexes.length === 0) {
            alert("Нет свободных гексов на расстоянии 2-3 от ваших городов для строительства");
            return;
        }

        let typeNames = {
            "treasury": "казначейства (сила до 2, золото уходит в главный город)",
            "heir": "наследника",
            "vassal": "вассала (новая семья)"
        };

        let maxInv = Math.min(6, sourceCity.gold);
        if (buildType === "treasury") maxInv = Math.min(2, sourceCity.gold);

        let html = `<div class="build-dialog">
            <h3>Строительство города ${typeNames[buildType]} из ${sourceCity.name}</h3>
            <p>Доступно золота: ${sourceCity.gold}</p>
            <input type="text" id="newCityName" placeholder="Название города" value="${sourceCity.name} ${typeNames[buildType].split(' ')[0]}" style="width:90%; margin:10px 0;">
            <div id="investOpts"></div>
            <button id="cancelBuild">Отмена</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let div = document.getElementById("investOpts");
        for (let i = 1; i <= maxInv; i++) {
            let chance = Math.round((1 / i) * 100);
            let btn = document.createElement("button");
            btn.innerText = i + " золота (" + chance + "% шанс получить силу " + i + ")";
            btn.onclick = () => this.startLocationSelection(sourceCity, i, buildType, availableHexes);
            div.appendChild(btn);
        }
        document.getElementById("cancelBuild").onclick = () => this.updateUI();
    }

    startLocationSelection(sourceCity, investment, buildType, availableHexes) {
        this.pendingBuildData = { sourceCity, investment, buildType, availableHexes };
        this.selectLocationMode = true;
        document.getElementById("globalMsg").innerHTML = "Выберите гекс для строительства (зелёный контур)";
        this.drawMap();

        let html = `<div class="build-dialog">
            <p>Нажмите на зелёный гекс на карте для строительства</p>
            <button id="cancelLocation">Отмена</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;
        document.getElementById("cancelLocation").onclick = () => {
            this.selectLocationMode = false;
            this.pendingBuildData = null;
            this.updateUI();
        };
    }

    buildCityAtLocation(hex) {
        if (!this.pendingBuildData) return;
        let { sourceCity, investment, buildType } = this.pendingBuildData;

        if (sourceCity.gold < investment) {
            alert("Не хватает золота");
            this.selectLocationMode = false;
            this.pendingBuildData = null;
            this.updateUI();
            return;
        }

        let cityNameInput = document.getElementById("newCityName");
        let customName = cityNameInput ? cityNameInput.value.trim() : "";

        let dice = Math.floor(Math.random() * 6) + 1;
        let finalStrength = (dice >= investment) ? investment : dice;

        if (sourceCity.hasQuarry && finalStrength < investment) {
            finalStrength = Math.min(finalStrength + 1, investment);
        }

        if (buildType === "treasury" && finalStrength > 2) finalStrength = 2;
        sourceCity.gold -= investment;

        let typeNames = {
            "treasury": "казначейство",
            "heir": "наследник",
            "vassal": "вассал"
        };

        let newName = customName || `${sourceCity.name} ${typeNames[buildType]}`;
        let newCity = new City(Date.now() + Math.random(), hex.row, hex.col, newName, finalStrength, sourceCity.playerId, buildType, sourceCity.id);

        if (buildType === "treasury") {
            newCity.treasuryForId = sourceCity.id;
        }

        let player = this.players.find(p => p.id === sourceCity.playerId);
        player.cities.push(newCity);

        this.addChronicle(`${player.name} построил город ${newName} силой ${finalStrength} за ${investment} золота`);

        if (buildType === "vassal") {
            setTimeout(() => {
                this.createNewVassalFamily(newCity, player);
            }, 100);
        }

        this.selectLocationMode = false;
        this.pendingBuildData = null;
        this.drawMap();
        this.updateUI();
    }

    upgradeCity(city) {
        if (city.strength >= 6) {
            alert("Город уже максимальной силы");
            return;
        }

        let cost = city.strength + 1;
        let totalGold = city.gold;

        let player = this.players.find(p => p.id === city.playerId);
        let treasuries = player.cities.filter(c => c.kind === "treasury" && c.treasuryForId === city.id);
        for (let treasury of treasuries) {
            totalGold += treasury.gold;
        }

        if (totalGold < cost) {
            alert(`Не хватает золота для улучшения. Нужно ${cost}, доступно ${totalGold} (включая казначейства)`);
            return;
        }

        let remainingCost = cost;
        for (let treasury of treasuries) {
            if (remainingCost <= 0) break;
            let take = Math.min(treasury.gold, remainingCost);
            treasury.gold -= take;
            remainingCost -= take;
        }
        if (remainingCost > 0) {
            city.gold -= remainingCost;
        }

        city.strength++;
        city.gold = Math.min(city.gold, city.strength);
        city.army = Math.min(city.army, city.strength);

        this.addChronicle(`${player.name} улучшил ${city.name} до силы ${city.strength}, потрачено ${cost} золота (включая средства из казначейств)`);
        this.drawMap();
        this.updateUI();
    }

    createNewVassalFamily(vassalCity, lordPlayer) {
        let html = `<div class="build-dialog">
            <h3>🏰 Создание нового вассального дома</h3>
            <p>Город: <strong>${vassalCity.name}</strong></p>
            <p>Название нового дома:</p>
            <input type="text" id="newVassalHouseName" placeholder="Название дома" value="${lordPlayer.name} Вассал" style="width:90%; margin-bottom:15px;">
            <button id="rollNewVassalFamilyBtn" class="game-btn" style="font-size: 18px;">🎲 Бросить кубик (1-6 членов семьи)</button>
            <div id="newVassalFamilySizeResult" style="margin-top:15px;"></div>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("rollNewVassalFamilyBtn").onclick = () => {
            let dice = Math.floor(Math.random() * 6) + 1;
            document.getElementById("newVassalFamilySizeResult").innerHTML = `<span class="dice-big">Выпало ${dice} членов семьи</span>`;
            setTimeout(() => this.inputNewVassalFamily(dice, vassalCity, lordPlayer), 800);
        };
    }

    inputNewVassalFamily(count, vassalCity, lordPlayer) {
        let houseName = document.getElementById("newVassalHouseName").value.trim() || `${lordPlayer.name} Вассал`;
        vassalCity.name = houseName;

        let vassalRoles = ["Лорд", "Супруга", "Наследник", "Дочь", "Брат", "Сестра", "Рыцарь", "Мейстер", "Оруженосец"];

        let html = `<h3>👨‍👩‍👧‍👦 Создание семьи вассального дома ${houseName}</h3>
                <p>Всего членов семьи: ${count}</p>`;
        for (let i = 0; i < count; i++) {
            let defaultRole = i === 0 ? "Лорд" : vassalRoles[Math.floor(Math.random() * vassalRoles.length)];
            let defaultAge = i === 0 ? 35 : 20 + i * 5;
            html += `<div class="member-input">
                <strong>Член ${i + 1}</strong>
                <input type="text" id="new_vassal_name_${i}" placeholder="Имя" value="${this.getDefaultName(i)}" style="width:120px;">
                <select id="new_vassal_role_${i}" style="width:120px;">
                    ${vassalRoles.map(r => `<option value="${r}" ${r === defaultRole ? "selected" : ""}>${r}</option>`).join("")}
                </select>
                <input type="number" id="new_vassal_age_${i}" value="${defaultAge}" style="width:70px;" placeholder="Возраст">
                <select id="new_vassal_gender_${i}" style="width:100px;">
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                </select>
            </div>`;
        }
        html += `<button id="saveNewVassalFamilyBtn" class="game-btn">✅ Сохранить семью вассала</button>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("saveNewVassalFamilyBtn").onclick = () => {
            let vassalPersons = [];
            for (let i = 0; i < count; i++) {
                let name = document.getElementById(`new_vassal_name_${i}`).value.trim() || `Член ${i + 1}`;
                let role = document.getElementById(`new_vassal_role_${i}`).value;
                let age = parseInt(document.getElementById(`new_vassal_age_${i}`).value) || (i === 0 ? 35 : 20 + i * 5);
                let gender = document.getElementById(`new_vassal_gender_${i}`).value;
                vassalPersons.push(new Person(Date.now() + Math.random() + i + 200, name, role, age, gender));
            }

            let lord = vassalPersons.find(p => p.role === "Лорд" && p.gender === "male");
            let spouse = vassalPersons.find(p => p.role === "Супруга" && p.gender === "female");
            if (lord && spouse) {
                lord.spouseId = spouse.id;
                lord.spouseName = spouse.name;
                lord.isMarried = true;
                spouse.spouseId = lord.id;
                spouse.spouseName = lord.name;
                spouse.isMarried = true;
            }

            let newVassalHouse = {
                id: Date.now() + Math.random(),
                houseName: houseName,
                cityId: vassalCity.id,
                family: vassalPersons
            };

            if (!lordPlayer.vassalHouses) lordPlayer.vassalHouses = [];
            lordPlayer.vassalHouses.push(newVassalHouse);
            lordPlayer.persons.push(...vassalPersons);

            this.addChronicle(`🏰 Создан новый вассальный дом ${houseName} с семьёй из ${count} человек`);
            this.updateUI();
            this.drawMap();
        };
    }

    processBirths(player) {
        let couples = [];
        for (let person of player.persons) {
            if (person.spouseId && person.gender === "female" && person.age >= 16 && person.age <= 45) {
                let spouse = player.persons.find(p => p.id === person.spouseId);
                if (spouse && spouse.age >= 16 && spouse.age <= 45) {
                    couples.push({ mother: person, father: spouse });
                }
            }
        }

        for (let couple of couples) {
            let chance = Math.floor(Math.random() * 100) + 1;
            if (chance <= 50) {
                let gender = Math.random() < 0.5 ? "male" : "female";
                let role = gender === "male" ? "Сын" : "Дочь";
                let defaultName = gender === "male" ? "Новорождённый" : "Новорождённая";
                let name = prompt(`🎉 В семье Дома ${player.name} родился ${gender === "male" ? "сын" : "дочь"}!\nДайте имя ребёнку:`, defaultName);
                if (!name) name = defaultName;
                let child = new Person(Date.now() + Math.random(), name, role, 0, gender, couple.father.id, couple.mother.id);
                player.persons.push(child);
                this.addChronicle(`В семье Дома ${player.name} родился ${gender === "male" ? "сын" : "дочь"} ${name}`);
            }
        }
    }

    checkPendingProposals() {
        let currentPlayer = this.players[this.currentPlayerIndex];

        let allCurrentPersons = [...currentPlayer.persons];
        if (currentPlayer.vassalHouses) {
            for (let vh of currentPlayer.vassalHouses) {
                allCurrentPersons.push(...vh.family);
            }
        }

        let marriageProposals = this.pendingMarriageProposals.filter(p => p.toPlayerId === currentPlayer.id);
        for (let proposal of marriageProposals) {
            let fromPlayer = this.players.find(p => p.id === proposal.fromPlayerId);
            let targetPerson = allCurrentPersons.find(p => p.id === proposal.targetPersonId);

            if (!targetPerson) {
                this.addChronicle(`❌ Персона для брака из дома ${proposal.toHouseName} больше не доступна`);
                continue;
            }

            let accept = confirm(`💍 Дом ${fromPlayer.name} предлагает брак между ${proposal.sourcePersonName} и ${targetPerson.name} (Дом ${proposal.toHouseName}). Принять?`);
            if (accept) {
                let sourcePerson = fromPlayer.persons.find(p => p.id === proposal.sourcePersonId);
                if (sourcePerson && targetPerson) {
                    sourcePerson.spouseId = targetPerson.id;
                    sourcePerson.spouseName = targetPerson.name;
                    sourcePerson.isMarried = true;
                    targetPerson.spouseId = sourcePerson.id;
                    targetPerson.spouseName = sourcePerson.name;
                    targetPerson.isMarried = true;
                    this.addChronicle(`💍 Заключён брак между ${sourcePerson.name} (Дом ${fromPlayer.name}) и ${targetPerson.name} (Дом ${proposal.toHouseName})`);
                }
            } else {
                this.addChronicle(`❌ Дом ${proposal.toHouseName} отклонил предложение о браке`);
            }
        }
        this.pendingMarriageProposals = this.pendingMarriageProposals.filter(p => p.toPlayerId !== currentPlayer.id);

        let squireProposals = this.pendingSquireProposals.filter(p => p.toPlayerId === currentPlayer.id);
        for (let proposal of squireProposals) {
            let fromPlayer = this.players.find(p => p.id === proposal.fromPlayerId);
            let boy = fromPlayer.persons.find(p => p.id === proposal.boyId);
            if (boy) {
                let accept = confirm(`🛡️ Дом ${fromPlayer.name} предлагает отдать ${boy.name} в оруженосцы вам. Принять?`);
                if (accept) {
                    boy.isSquire = true;
                    boy.squireYears = 0;
                    boy.knightChance = 30;
                    this.addChronicle(`${boy.name} из Дома ${fromPlayer.name} отправлен в оруженосцы к Дому ${currentPlayer.name}`);
                } else {
                    this.addChronicle(`❌ Дом ${currentPlayer.name} отклонил предложение об оруженосце`);
                }
            }
        }
        this.pendingSquireProposals = this.pendingSquireProposals.filter(p => p.toPlayerId !== currentPlayer.id);
    }

    endTurn() {
        let currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.hasEndedTurn = true;

        let allEnded = this.players.every(p => p.hasEndedTurn);

        if (allEnded) {
            let years = Math.floor(Math.random() * 6) + 1;
            this.totalYears += years;
            this.currentTurn++;

            for (let player of this.players) {
                for (let city of player.cities) {
                    city.gold = Math.min(city.gold + 1, city.strength);
                    city.army = Math.min(city.army + 1, city.strength);
                }

                for (let person of player.persons) {
                    person.age += years;

                    if (person.isSquire && !person.isKnight) {
                        person.squireYears += years;
                        if (person.age >= 16) {
                            let chance = person.knightChance;
                            let roll = Math.floor(Math.random() * 100) + 1;
                            if (roll <= chance) {
                                person.isKnight = true;
                                person.isSquire = false;
                                this.addChronicle(`${person.name} из Дома ${player.name} стал рыцарем`);
                            } else {
                                person.knightChance += 10;
                            }
                        }
                    }
                }

                this.processBirths(player);
            }

            for (let player of this.players) {
                player.hasEndedTurn = false;
            }

            this.currentPlayerIndex = 0;
            this.checkPendingProposals();

            this.addChronicle(`Наступил ход ${this.currentTurn}. Прошло ${years} лет`);
            this.drawMap();
            this.updateUI();
            this.saveToStorage();
        } else {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            this.checkPendingProposals();
            this.drawMap();
            this.updateUI();
        }

        document.getElementById("globalMsg").innerHTML = allEnded ? `Ход ${this.currentTurn} начался. Ход игрока ${this.players[this.currentPlayerIndex].name}` : `Ход игрока ${this.players[this.currentPlayerIndex].name}`;
    }

    showDiplomacy() {
        let currentPlayer = this.players[this.currentPlayerIndex];

        let allHouses = [];

        for (let player of this.players) {
            if (player.id !== currentPlayer.id) {
                allHouses.push({
                    id: player.id,
                    name: player.name,
                    type: "main",
                    player: player,
                    persons: player.persons.filter(p => {
                        if (!player.vassalHouses) return true;
                        for (let vh of player.vassalHouses) {
                            if (vh.family.some(v => v.id === p.id)) return false;
                        }
                        return true;
                    })
                });
            }
        }

        for (let player of this.players) {
            if (player.id !== currentPlayer.id && player.vassalHouses) {
                for (let vh of player.vassalHouses) {
                    allHouses.push({
                        id: vh.id || `vassal_${player.id}_${vh.houseName}`,
                        name: vh.houseName,
                        type: "vassal",
                        player: player,
                        persons: vh.family,
                        parentId: player.id
                    });
                }
            }
        }

        let html = `<div class="build-dialog">
            <h3>🤝 Дипломатия - Дом ${currentPlayer.name}</h3>
            <p>Выберите дом для взаимодействия:</p>
            <div id="diploHouses"></div>
            <button id="closeDiplo">Закрыть</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let housesDiv = document.getElementById("diploHouses");
        for (let house of allHouses) {
            housesDiv.innerHTML += `<div class="enemy-card" data-house-id="${house.id}" data-house-type="${house.type}" data-player-id="${house.player.id}">
                <b>🏰 Дом ${house.name}</b> (${house.type === "main" ? "Основной дом" : "Вассальный дом"})
                <br><button class="propose-marriage" data-house-id="${house.id}" data-house-type="${house.type}" data-player-id="${house.player.id}">💍 Предложить брак</button>
            </div>`;
        }

        document.querySelectorAll(".propose-marriage").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                let houseId = btn.dataset.houseId;
                let houseType = btn.dataset.houseType;
                let targetPlayerId = parseInt(btn.dataset.playerId);
                let targetPlayer = this.players.find(p => p.id === targetPlayerId);
                let targetHouse = null;

                if (houseType === "main") {
                    targetHouse = {
                        name: targetPlayer.name,
                        persons: targetPlayer.persons.filter(p => {
                            if (!targetPlayer.vassalHouses) return true;
                            for (let vh of targetPlayer.vassalHouses) {
                                if (vh.family.some(v => v.id === p.id)) return false;
                            }
                            return true;
                        }),
                        type: "main",
                        player: targetPlayer
                    };
                } else {
                    let vh = targetPlayer.vassalHouses?.find(v => v.id === houseId || v.houseName === houseId);
                    if (vh) {
                        targetHouse = {
                            name: vh.houseName,
                            persons: vh.family,
                            type: "vassal",
                            player: targetPlayer
                        };
                    }
                }

                if (targetHouse) {
                    this.proposeMarriageToHouse(currentPlayer, targetHouse);
                }
            };
        });

        document.getElementById("closeDiplo").onclick = () => this.updateUI();
    }

    proposeMarriageToHouse(sourcePlayer, targetHouse) {
        let sourceUnmarried = sourcePlayer.persons.filter(p => !p.spouseId && p.age >= 16);
        let targetUnmarried = targetHouse.persons.filter(p => !p.spouseId && p.age >= 16);

        if (sourceUnmarried.length === 0) {
            alert("В вашем доме нет доступных для брака кандидатов");
            return;
        }

        if (targetUnmarried.length === 0) {
            alert(`В доме ${targetHouse.name} нет доступных для брака кандидатов`);
            return;
        }

        let html = `<div class="build-dialog">
            <h3>💍 Предложение брака дому ${targetHouse.name}</h3>
            <p>Выберите жениха/невесту из вашего дома:</p>`;
        for (let person of sourceUnmarried) {
            html += `<div class="family-member" data-source="${person.id}">${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "Мужчина" : "Женщина"})</div>`;
        }
        html += `<button id="cancelProposal">Отмена</button></div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.querySelectorAll("[data-source]").forEach(el => {
            el.onclick = () => {
                let sourcePersonId = parseFloat(el.dataset.source);
                let sourcePerson = sourcePlayer.persons.find(p => p.id === sourcePersonId);
                this.selectTargetPersonForMarriage(sourcePlayer, targetHouse, sourcePerson, targetUnmarried);
            };
        });
        document.getElementById("cancelProposal").onclick = () => this.updateUI();
    }

    selectTargetPersonForMarriage(sourcePlayer, targetHouse, sourcePerson, targetUnmarried) {
        let html = `<div class="build-dialog">
            <h3>💍 Выберите супруга из дома ${targetHouse.name}</h3>`;
        for (let person of targetUnmarried) {
            html += `<div class="family-member" data-target="${person.id}">${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "Мужчина" : "Женщина"})</div>`;
        }
        html += `<button id="cancelSelect">Отмена</button></div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.querySelectorAll("[data-target]").forEach(el => {
            el.onclick = () => {
                let targetPersonId = parseFloat(el.dataset.target);
                let targetPerson = targetUnmarried.find(p => p.id === targetPersonId);

                if (sourcePerson.gender === targetPerson.gender) {
                    alert("❌ Брак между однополыми персонами невозможен!");
                    this.updateUI();
                    return;
                }

                this.pendingMarriageProposals.push({
                    fromPlayerId: sourcePlayer.id,
                    toPlayerId: targetHouse.player.id,
                    toHouseType: targetHouse.type,
                    toHouseName: targetHouse.name,
                    sourcePersonId: sourcePerson.id,
                    sourcePersonName: sourcePerson.name,
                    targetPersonId: targetPerson.id,
                    targetPersonName: targetPerson.name
                });
                this.addChronicle(`💌 Дом ${sourcePlayer.name} предложил брак между ${sourcePerson.name} и ${targetPerson.name} дому ${targetHouse.name}. Ожидайте ответа.`);
                this.updateUI();
            };
        });
        document.getElementById("cancelSelect").onclick = () => this.updateUI();
    }

    showSquireMenu() {
        let currentPlayer = this.players[this.currentPlayerIndex];
        let eligibleBoys = currentPlayer.persons.filter(p => p.gender === "male" && !p.isSquire && !p.isKnight && p.age >= 12 && p.age < 16);

        if (eligibleBoys.length === 0) {
            alert("Нет мальчиков от 12 до 16 лет, которых можно отдать в оруженосцы");
            return;
        }

        let otherPlayers = this.players.filter(p => p.id !== currentPlayer.id);
        let html = `<div class="build-dialog">
            <h3>Отдать в оруженосцы</h3>
            <p>Выберите мальчика:</p>`;
        for (let boy of eligibleBoys) {
            html += `<div class="family-member" data-boy="${boy.id}">${boy.name} (${boy.age} лет)</div>`;
        }
        html += `<button id="cancelSquire">Отмена</button></div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.querySelectorAll("[data-boy]").forEach(el => {
            el.onclick = () => {
                let boyId = parseFloat(el.dataset.boy);
                let boy = currentPlayer.persons.find(p => p.id === boyId);
                this.selectLordForSquire(currentPlayer, boy, otherPlayers);
            };
        });
        document.getElementById("cancelSquire").onclick = () => this.updateUI();
    }

    selectLordForSquire(currentPlayer, boy, otherPlayers) {
        let html = `<div class="build-dialog">
            <h3>Выберите лорда для службы ${boy.name}</h3>`;
        for (let lord of otherPlayers) {
            html += `<div class="enemy-card" data-lord="${lord.id}">Дом ${lord.name}</div>`;
        }
        html += `<button id="cancelLord">Отмена</button></div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.querySelectorAll("[data-lord]").forEach(el => {
            el.onclick = () => {
                let lordId = parseInt(el.dataset.lord);
                let lord = otherPlayers.find(p => p.id === lordId);

                this.pendingSquireProposals.push({
                    fromPlayerId: currentPlayer.id,
                    toPlayerId: lord.id,
                    boyId: boy.id,
                    boyName: boy.name
                });
                this.addChronicle(`📨 Дом ${currentPlayer.name} предложил отдать ${boy.name} в оруженосцы дому ${lord.name}. Ожидайте ответа.`);
                this.updateUI();
            };
        });
        document.getElementById("cancelLord").onclick = () => this.updateUI();
    }

    setupEventListeners() {
        document.getElementById("startGameBtn").onclick = () => this.startGame();
        document.getElementById("loadGameBtn").onclick = () => this.loadFromStorage();
        document.getElementById("resetGameBtn").onclick = () => this.resetGame();
        document.getElementById("saveGameBtn").onclick = () => this.saveToStorage();
        document.getElementById("endTurnBtn").onclick = () => this.endTurn();
        document.getElementById("diplomacyBtn").onclick = () => this.showDiplomacy();
        document.getElementById("squireBtn").onclick = () => this.showSquireMenu();

        let canvas = document.getElementById("mapCanvas");
        canvas.addEventListener("click", (e) => this.handleCanvasClick(e));

        // Добавьте touch-события для телефона
        canvas.addEventListener("touchstart", (e) => {
            e.preventDefault();
            let touch = e.touches[0];
            let rect = canvas.getBoundingClientRect();
            let mx = (touch.clientX - rect.left) * (canvas.width / rect.width);
            let my = (touch.clientY - rect.top) * (canvas.height / rect.height);

            // Создаём искусственное событие клика
            let fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
            this.handleCanvasClick(fakeEvent);
        });
    }

    handleCanvasClick(e) {
        let canvas = document.getElementById("mapCanvas");
        let rect = canvas.getBoundingClientRect();
        let mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        let my = (e.clientY - rect.top) * (canvas.height / rect.height);
        let hex = this.getHexAtPixel(mx, my);
        if (!hex) return;

        if (hex.terrain === "water") {
            alert("Нельзя строить на воде!");
            return;
        }
        if (hex.terrain === "mountain" || hex.terrain === "forest") {
            alert("Нельзя строить город на горах или в лесу! Выберите равнину.");
            return;
        }

        // Проверка, что рядом нет других городов (для строительства новых городов)
        let hasNearbyCity = false;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                let neighborHex = this.hexes.find(nh => nh.row === hex.row + dr && nh.col === hex.col + dc);
                if (neighborHex && this.getCityAtHex(neighborHex)) {
                    hasNearbyCity = true;
                    break;
                }
            }
        }

        if (hasNearbyCity && (this.selectLocationMode || this.creationPhase)) {
            alert("Нельзя строить город рядом с другим городом! Нужно расстояние минимум 2 гекса.");
            return;
        }

        if (this.selectLocationMode && this.pendingBuildData) {
            let isValid = this.pendingBuildData.availableHexes.some(h => h.row === hex.row && h.col === hex.col);
            if (isValid) {
                this.buildCityAtLocation(hex);
            } else {
                alert("Выберите гекс из подсвеченных зелёным");
            }
            return;
        }

        if (this.creationPhase && this.currentCreatingPlayer) {
            let existingCity = this.getCityAtHex(hex);
            if (existingCity) {
                alert("Этот гекс уже занят");
                return;
            }

            if (this.creationStep === 0) {
                this.selectedLordHex = hex;
                this.creationStep = 1;
                document.getElementById("globalMsg").innerHTML = `${this.currentCreatingPlayer.name}: выберите гекс для вассала (в радиусе 3 гексов)`;
                this.drawMap();
            } else if (this.creationStep === 1) {
                let dist = Math.abs(hex.row - this.selectedLordHex.row) + Math.abs(hex.col - this.selectedLordHex.col);
                if (dist <= 3 && dist >= 2) {
                    this.selectedVassalHex = hex;
                    this.rollCityStrength();
                } else {
                    alert("Вассал должен быть в радиусе от 2 до 3 гексов от столицы");
                }
            }
        }
    }

    rollCityStrength() {
        let html = `<div class="build-dialog">
            <h3>Бросок кубика для силы столицы</h3>
            <p>Сила будет от 4 до 6</p>
            <button id="rollStrengthBtn">Бросить кубик</button>
            <div id="strengthResult"></div>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("rollStrengthBtn").onclick = () => {
            let dice = Math.floor(Math.random() * 6) + 1;
            let strength;
            if (dice === 1 || dice === 4) strength = 4;
            else if (dice === 2 || dice === 5) strength = 5;
            else strength = 6;

            this.pendingCityStrength = strength;
            document.getElementById("strengthResult").innerHTML = `<span class="dice-big">Выпало ${dice} → Сила ${strength}</span>`;
            setTimeout(() => this.createFamily(), 1000);
        };
    }

    createFamily() {
        let html = `<div class="build-dialog">
            <h3>Создание семьи Дома ${this.currentCreatingPlayer.name}</h3>
            <button id="rollFamilyBtn">Бросить кубик (1-6 членов семьи)</button>
            <div id="familySizeResult"></div>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("rollFamilyBtn").onclick = () => {
            let dice = Math.floor(Math.random() * 6) + 1;
            document.getElementById("familySizeResult").innerHTML = `<span class="dice-big">Выпало ${dice} членов семьи</span>`;
            setTimeout(() => this.inputFamilyMembers(dice), 500);
        };
    }

    inputFamilyMembers(count) {
        let html = `<h3>Семья Дома ${this.currentCreatingPlayer.name}</h3>`;
        for (let i = 0; i < count; i++) {
            let defaultRole = i === 0 ? "Лорд" : this.ROLES[Math.floor(Math.random() * this.ROLES.length)];
            let defaultAge = i === 0 ? 35 : 20 + i * 5;
            html += `<div class="member-input">
                <strong>Член ${i + 1}</strong>
                <input type="text" id="name_${i}" placeholder="Имя" value="${this.getDefaultName(i)}">
                <select id="role_${i}">
                    ${this.ROLES.map(r => `<option value="${r}" ${r === defaultRole ? "selected" : ""}>${r}</option>`).join("")}
                </select>
                <input type="number" id="age_${i}" value="${defaultAge}" style="width:60px">
                <select id="gender_${i}">
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                </select>
            </div>`;
        }
        html += `<button id="saveFamilyBtn">Сохранить семью</button>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("saveFamilyBtn").onclick = () => {
            let persons = [];
            for (let i = 0; i < count; i++) {
                let name = document.getElementById(`name_${i}`).value.trim() || `Член ${i + 1}`;
                let role = document.getElementById(`role_${i}`).value;
                let age = parseInt(document.getElementById(`age_${i}`).value) || (i === 0 ? 35 : 20 + i * 5);
                let gender = document.getElementById(`gender_${i}`).value;
                persons.push(new Person(Date.now() + Math.random() + i, name, role, age, gender));
            }

            let lord = persons.find(p => p.role === "Лорд" && p.gender === "male");
            let spouse = persons.find(p => p.role === "Супруга" && p.gender === "female");
            if (lord && spouse) {
                lord.spouseId = spouse.id;
                lord.spouseName = spouse.name;
                lord.isMarried = true;
                spouse.spouseId = lord.id;
                spouse.spouseName = lord.name;
                spouse.isMarried = true;
            }

            let king = persons.find(p => p.role === "Король" && p.gender === "male");
            let queen = persons.find(p => p.role === "Супруга" && p.gender === "female");
            if (king && queen && king !== lord) {
                king.spouseId = queen.id;
                king.spouseName = queen.name;
                king.isMarried = true;
                queen.spouseId = king.id;
                queen.spouseName = king.name;
                queen.isMarried = true;
            }

            this.currentCreatingPlayer.persons = persons;
            this.createVassalFamily();
        };
    }

    getDefaultName(index) {
        const names = ["Эддард", "Серсея", "Тирион", "Дейнерис", "Джон", "Санса", "Ария", "Джейме", "Теон", "Бриенна"];
        return names[index % names.length];
    }

    createVassalFamily() {
        let html = `<div class="build-dialog">
            <h3>Создание семьи вассала Дома ${this.currentCreatingPlayer.name}</h3>
            <p>Название дома вассала:</p>
            <input type="text" id="vassalHouseName" placeholder="Название дома вассала" value="${this.currentCreatingPlayer.name} Вассалы" style="width:90%; margin-bottom:15px;">
            <button id="rollVassalFamilyBtn">Бросить кубик (1-6 членов семьи)</button>
            <div id="vassalFamilySizeResult"></div>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("rollVassalFamilyBtn").onclick = () => {
            let dice = Math.floor(Math.random() * 6) + 1;
            document.getElementById("vassalFamilySizeResult").innerHTML = `<span class="dice-big">Выпало ${dice} членов семьи</span>`;
            setTimeout(() => this.inputVassalFamilyMembers(dice), 500);
        };
    }

    inputVassalFamilyMembers(count) {
        let vassalHouseName = document.getElementById("vassalHouseName").value.trim() || `${this.currentCreatingPlayer.name} Вассалы`;

        let vassalRoles = ["Лорд", "Супруга", "Наследник", "Дочь", "Брат", "Сестра", "Рыцарь", "Мейстер", "Оруженосец"];

        let html = `<h3>Семья вассала ${vassalHouseName}</h3>`;
        for (let i = 0; i < count; i++) {
            let defaultRole = i === 0 ? "Лорд" : vassalRoles[Math.floor(Math.random() * vassalRoles.length)];
            let defaultAge = i === 0 ? 35 : 20 + i * 5;
            html += `<div class="member-input">
                <strong>Член ${i + 1}</strong>
                <input type="text" id="vassal_name_${i}" placeholder="Имя" value="${this.getDefaultName(i)}">
                <select id="vassal_role_${i}">
                    ${vassalRoles.map(r => `<option value="${r}" ${r === defaultRole ? "selected" : ""}>${r}</option>`).join("")}
                </select>
                <input type="number" id="vassal_age_${i}" value="${defaultAge}" style="width:60px">
                <select id="vassal_gender_${i}">
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                </select>
            </div>`;
        }
        html += `<button id="saveVassalFamilyBtn">Сохранить семью вассала</button>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("saveVassalFamilyBtn").onclick = () => {
            let vassalPersons = [];
            for (let i = 0; i < count; i++) {
                let name = document.getElementById(`vassal_name_${i}`).value.trim() || `Член ${i + 1}`;
                let role = document.getElementById(`vassal_role_${i}`).value;
                let age = parseInt(document.getElementById(`vassal_age_${i}`).value) || (i === 0 ? 35 : 20 + i * 5);
                let gender = document.getElementById(`vassal_gender_${i}`).value;
                vassalPersons.push(new Person(Date.now() + Math.random() + i + 100, name, role, age, gender));
            }

            let lord = vassalPersons.find(p => p.role === "Лорд" && p.gender === "male");
            let spouse = vassalPersons.find(p => p.role === "Супруга" && p.gender === "female");
            if (lord && spouse) {
                lord.spouseId = spouse.id;
                lord.spouseName = spouse.name;
                lord.isMarried = true;
                spouse.spouseId = lord.id;
                spouse.spouseName = lord.name;
                spouse.isMarried = true;
            }

            let lordHexObj = this.hexes.find(h => h.row === this.selectedLordHex.row && h.col === this.selectedLordHex.col);
            let vassalHexObj = this.hexes.find(h => h.row === this.selectedVassalHex.row && h.col === this.selectedVassalHex.col);

            let lordCity = new City(Date.now(), lordHexObj.row, lordHexObj.col, this.currentCreatingPlayer.name, this.pendingCityStrength, this.currentCreatingPlayer.id, "normal", null);
            lordCity.gold = this.pendingCityStrength;
            lordCity.army = this.pendingCityStrength;
            lordCity.isStartCity = true;

            let vassalStrength = Math.max(1, this.pendingCityStrength - 1);
            let vassalCity = new City(Date.now() + 1, vassalHexObj.row, vassalHexObj.col, vassalHouseName, vassalStrength, this.currentCreatingPlayer.id, "normal", null);
            vassalCity.gold = vassalStrength;
            vassalCity.army = vassalStrength;
            vassalCity.isStartCity = true;

            this.currentCreatingPlayer.cities = [lordCity, vassalCity];
            this.currentCreatingPlayer.lordStrength = this.pendingCityStrength;
            this.currentCreatingPlayer.vassalHouseName = vassalHouseName;
            this.currentCreatingPlayer.vassalFamily = vassalPersons;

            let allPersons = [...this.currentCreatingPlayer.persons, ...vassalPersons];
            this.currentCreatingPlayer.persons = allPersons;

            this.addChronicle(`Дом ${this.currentCreatingPlayer.name} создан. Столица: ${lordCity.name} (сила ${this.pendingCityStrength}), Вассал: ${vassalHouseName} (сила ${vassalStrength})`);

            this.nextPlayerCreation();
        };
    }

    nextPlayerCreation() {
        let nextIndex = this.players.findIndex(p => p.cities.length === 0);
        if (nextIndex !== -1) {
            this.currentCreatingPlayer = this.players[nextIndex];
            this.creationStep = 0;
            this.selectedLordHex = null;
            this.selectedVassalHex = null;
            document.getElementById("globalMsg").innerHTML = `${this.currentCreatingPlayer.name}: выберите гекс для столицы`;
            this.drawMap();
        } else {
            this.creationPhase = false;
            this.gameStarted = true;
            this.currentTurn = 1;
            this.totalYears = 0;
            this.currentPlayerIndex = 0;
            for (let player of this.players) {
                player.hasEndedTurn = false;
            }
            this.addChronicle("Игра началась");
            this.drawMap();
            this.updateUI();
            this.saveToStorage();
        }
    }

    startGame() {
        const count = parseInt(document.getElementById("playerCountSelect").value);
        const playerNames = [];
        for (let i = 0; i < count; i++) {
            const input = document.getElementById(`playerName_${i}`);
            playerNames.push(input ? input.value.trim() : `Дом ${String.fromCharCode(65 + i)}`);
        }

        this.players = [];
        for (let i = 0; i < count; i++) {
            this.players.push(new Player(i, playerNames[i]));
        }

        document.getElementById("mainMenu").style.display = "none";
        document.getElementById("gameContainer").style.display = "block";

        this.creationPhase = true;
        this.creationStep = 0;
        this.currentCreatingPlayer = this.players[0];
        this.selectedLordHex = null;
        this.selectedVassalHex = null;
        document.getElementById("globalMsg").innerHTML = `${this.currentCreatingPlayer.name}: выберите гекс для столицы`;
        this.drawMap();
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.game = new Game();
});