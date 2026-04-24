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
        this.isAlive = true;
        this.isLord = false;
        this.isHeir = false;
        this.isRuler = false;
        this.rulingCityId = null;
        this.servingTo = null;      // кому служит (название дома)
        this.servingToId = null;    // ID дома/игрока, которому служит
        this.previousServingTo = null;  // Добавлено: где служил ранее
        this.wasSquire = false;          // Добавлено: был ли оруженосцем
        this.wasKnight = false;          // Добавлено: был ли рыцарем
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
        this.isCapital = false;
        this.rulerId = null;
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
        this.pendingCityName = null;
        this.pendingInheritance = null;

        this.HEX_W = 20;
        this.HEX_R = 12;
        this.COLS = 36;
        this.ROWS = 46;
        this.PAD_X = 20;
        this.PAD_Y = -5;

        this.ROLES = ["Король", "Лорд", "Супруга", "Сын", "Дочь", "Брат", "Сестра"];

        this.init();
    }

    // ========== МОДАЛЬНЫЕ ОКНА ==========

    showConfirmModal(title, message, onConfirm, onCancel) {
        return new Promise((resolve) => {
            let modal = document.getElementById("eventModal");
            let modalTitle = document.getElementById("modalTitle");
            let modalMessage = document.getElementById("modalMessage");
            let modalButtons = document.getElementById("modalButtons");

            modalTitle.innerText = title;
            modalMessage.innerText = message;
            modalButtons.innerHTML = `
                <button id="modalConfirmBtn" style="background:#5a8a4a; padding:8px 25px; margin:10px; border-radius:30px; cursor:pointer; border:none; color:white;">✅ Принять</button>
                <button id="modalCancelBtn" style="background:#8a4a3a; padding:8px 25px; margin:10px; border-radius:30px; cursor:pointer; border:none; color:white;">❌ Отклонить</button>
            `;
            modal.style.display = "flex";

            let confirmBtn = document.getElementById("modalConfirmBtn");
            let cancelBtn = document.getElementById("modalCancelBtn");

            let newConfirmBtn = confirmBtn.cloneNode(true);
            let newCancelBtn = cancelBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            newConfirmBtn.onclick = () => {
                modal.style.display = "none";
                if (onConfirm) onConfirm();
                resolve(true);
            };
            newCancelBtn.onclick = () => {
                modal.style.display = "none";
                if (onCancel) onCancel();
                resolve(false);
            };
        });
    }

    showPromptModal(title, message, defaultValue, callback) {
        let modal = document.getElementById("eventModal");
        let modalTitle = document.getElementById("modalTitle");
        let modalMessage = document.getElementById("modalMessage");
        let modalButtons = document.getElementById("modalButtons");

        modalTitle.innerText = title;
        modalMessage.innerText = message;
        modalButtons.innerHTML = `
            <input type="text" id="modalInput" value="${defaultValue}" style="width:90%; padding:8px; margin:10px 0; border-radius:20px; background:#f7efcf; border:none;">
            <br>
            <button id="modalConfirmBtn" style="background:#5a8a4a; padding:8px 25px; margin:10px; border-radius:30px; cursor:pointer; border:none; color:white;">✅ Подтвердить</button>
            <button id="modalCancelBtn" style="background:#8a4a3a; padding:8px 25px; margin:10px; border-radius:30px; cursor:pointer; border:none; color:white;">❌ Отмена</button>
        `;
        modal.style.display = "flex";

        let confirmBtn = document.getElementById("modalConfirmBtn");
        let cancelBtn = document.getElementById("modalCancelBtn");

        let newConfirmBtn = confirmBtn.cloneNode(true);
        let newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newConfirmBtn.onclick = () => {
            let input = document.getElementById("modalInput");
            let value = input ? input.value : defaultValue;
            modal.style.display = "none";
            if (callback) callback(value);
        };
        newCancelBtn.onclick = () => {
            modal.style.display = "none";
            if (callback) callback(defaultValue);
        };

        setTimeout(() => {
            let input = document.getElementById("modalInput");
            if (input) input.focus();
        }, 100);
    }

    closeModal() {
        let modal = document.getElementById("eventModal");
        if (modal) {
            modal.style.display = "none";
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        this.initHexes();
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupPlayerNamesPanel();
        this.drawMap();

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.closeModal();
            }
        });
    }

    initHexes() {
        // ... ваш существующий код initHexes ...
        this.hexes = [];
        const terrainMap = [
            "wwwwwmmmmmmmmmmmmmmmmmmwwwwwwwwwwwww",
            "wwwwwppppppppmmmmpppppppwwpwwwwwwwww",
            "wwwwwpppppppppmmmmmmppfpfpfpwwwpwwwww",
            "wwwwwppppfppppwwpmmmpffpppwwwwmwwwww",
            "wwwwwwwwwppppwwpmmmmppppfwwwmpwwww",
            "wwwwwwwwwwwwwwwwpmmmmppppppwwwpwwwww",
            "wwwwwwwwwwwppwwwmmmmmppffppwwwwwwwww",
            "wwwwwwwwwwwwwwwmmmmmmpffppfffpppwwww",
            "wwwwwwwpppwwwwwmmmmmfwppppppffpppwww",
            "wwwwwwwwpppffffpppffpppppppfffwwwww",
            "wwwwwwwwppfffpfffpppppppppppffwwwwww",
            "wwwwwwwppffffpfffppppppppppwwwwwwwww",
            "wwwwwpppppwppppffppppppppffpwwwwwwww",
            "wwwwpppppppppwppppmmppppppppwwwwwwww",
            "wwwwpppppppppppppmpppmpppppppwwwwwww",
            "wwwwpwpppppppppppppppppppppwppwwwwww",
            "wwwwwwpppppppppppppppppppppwwwwwwwww",
            "wwwwwwwppwpppppppppppwppppwwwwwwwwww",
            "wwwwwwwwppppfffffppppwwwwwwwwwwwwwww",
            "wwwwwpppppppffffpppwwwwwwwwwwwwwwwww",
            "wwwwwpppppppfffffppwwwppppppppwwwwww",
            "wwwwwwwwwwwwwfffppppppmmmmppppwwwwww",
            "wwwwwwwwwwwwwwffpppmmmmmmfffppmpwwww",
            "wwwwwpwppwwwppwppppmmpffmpmmmmmpwww",
            "wwwwwwppwppwwwwwppppmmmmmppppppppwww",
            "wwwwwwwwwpppppppppppmmmmmmmmmpppwwww",
            "wwwwwwwwwmmmmmmfpppppppffmmmmpwwwwww",
            "wwwwwwwwpppmmfppppppppppmmppwwpwwwww",
            "wwwwwwwwppppppppppppwwpppppppppwwwww",
            "wwwwwpmpmmmmpmmmmppppppppppwwwwwwwww",
            "wwwwwwwpppmpmpmmmmpppppppppwwwwwwwww",
            "wwwwwwmmmpppppmmppppppppwwwwwpwwwwww",
            "wwwwwwpfppfpppppppppppffpffpfpwwwwww",
            "wwwwwffpfpppppppppppfffpfppwwwwww",
            "wwwwwwpffppppppppppppppppffppppwwwww",
            "wwwwwwppppppppppppppmfpmpmpppwwpwwww",
            "wwwwwwwwwpppppppppmmmmmmmpmwwwwwwwww",
            "wwwwwwwpppppppppppmmmmmmpmmfpffpwwww",
            "wwwwwwwppmmpmppppppmmpppmmfpwwwwww",
            "wwwwppppppmmmmmpppppwwwwwwwfpwwwwww",
            "wwwwwppppppmmmmmmpmmmwwwwwwwwwwwwpww",
            "wwwwwwwpppppmmpppmmmppppwwwwwpwwwww",
            "wwwwwwppppmmpmpppppppppppppppmmmpwww",
            "wwwwwwwpppwmmmpppppppppppppppppwwwww",
            "wwwwppwwwwwwmppppppppppppppppwwwwwww",
            "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww"
        ];

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                let offX = (row % 2 === 0) ? 0 : this.HEX_W / 2;
                let x = col * this.HEX_W + offX + this.HEX_W / 2 + this.PAD_X;
                let y = row * this.HEX_W * 0.85 + this.HEX_W / 2 + this.PAD_Y;

                let terrain = "plain";
                if (row < terrainMap.length && col < terrainMap[row].length) {
                    let t = terrainMap[row][col];
                    if (t === 'm') terrain = "mountain";
                    else if (t === 'f') terrain = "forest";
                    else if (t === 'w') terrain = "water";
                    else terrain = "plain";
                }

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
                let fontSize = 11;
                ctx.font = `bold ${fontSize}px consolas`;
                ctx.fillStyle = "#ffefcf";
                let shortName = city.name.length > 6 ? city.name.substring(0, 6) : city.name;
                ctx.fillText(shortName + "(" + city.strength + ")", h.x - 16, h.y - 8);
                ctx.font = `${fontSize}px consolas`;
                ctx.fillStyle = "#ffd966";
                ctx.fillText(city.gold, h.x - 12, h.y + 4);
                ctx.fillStyle = "#ffaa66";
                ctx.fillText(city.army, h.x - 12, h.y + 12);

                if (city.hasQuarry) {
                    ctx.fillStyle = "#b0a070";
                    ctx.font = `${fontSize - 1}px Georgia`;
                    ctx.fillText("⛏️", h.x + 12, h.y - 6);
                }
                if (city.hasSawmill) {
                    ctx.fillStyle = "#90c070";
                    ctx.font = `${fontSize - 1}px Georgia`;
                    ctx.fillText("🪵", h.x + 12, h.y + 4);
                }
                if (city.siegeWeapons > 0) {
                    ctx.fillStyle = "#d09050";
                    ctx.font = `${fontSize - 1}px Georgia`;
                    ctx.fillText("🏹" + city.siegeWeapons, h.x + 12, h.y + 14);
                }
            }
        }
    }

    updateUI() {
    if (!this.gameStarted) return;
    let currentPlayer = this.players[this.currentPlayerIndex];

    let ruler = currentPlayer.persons.find(p => p.isRuler === true);
    let heir = currentPlayer.persons.find(p => p.isHeir === true);

    let html = `<h3>🏰 Дом ${currentPlayer.name}</h3>`;

    if (ruler) {
        html += `<div style="background:#00000044; border-radius:12px; padding:5px; margin-bottom:10px;">
            👑 Правитель: ${ruler.name} (${ruler.role}, ${ruler.age} лет)
            ${heir ? ` | 👨‍👦 Наследник: ${heir.name}` : ''}
        </div>`;
    }

    html += `<div style="font-size:12px; margin-bottom:10px;">💰 Золото: ${currentPlayer.cities.reduce((s, c) => s + c.gold, 0)} | ⚔️ Армия: ${currentPlayer.cities.reduce((s, c) => s + c.army, 0)}</div>`;

    for (let city of currentPlayer.cities) {
        let cityClass = "";
        let icon = "";
        if (city.kind === "treasury") { cityClass = "treasury"; icon = "🏦 "; }
        else if (city.kind === "heir") { cityClass = "heir"; icon = "👑 "; }
        else if (city.isStartCity && city.name === currentPlayer.name) { cityClass = "lord"; icon = "🏰 "; }
        else if (city.isStartCity) { cityClass = "vassal"; icon = "⚔️ "; }
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

    // === СЕМЬЯ ЛОРДА/КОРОЛЯ (основной дом) ===
    let lordFamily = currentPlayer.persons.filter(p => {
        if (!currentPlayer.vassalHouses) return true;
        for (let vh of currentPlayer.vassalHouses) {
            if (vh.family && vh.family.some(v => v.id === p.id)) return false;
        }
        if (currentPlayer.vassalFamily && currentPlayer.vassalFamily.some(v => v.id === p.id)) return false;
        return true;
    });

    html += `<hr><h4>👑 Семья Дома ${currentPlayer.name}</h4>`;
        // В блоке отображения членов семьи, замените блок статуса на:
        for (let person of lordFamily) {
            let status = "";
            if (person.isMarried) status += ` 💍 Супруг(а): ${person.spouseName || "неизвестен"}`;
            if (person.isSquire && !person.isKnight) {
                status += " ⚔️ Оруженосец";
            }
            if (person.isKnight) {
                status += " 🛡️ Рыцарь";
            }
            if (!person.isAlive) status += " 💀 Умер";
            html += `<div class="family-member" data-person="${person.id}">${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "М" : "Ж"})${status}</div>`;
        }

    // === СЕМЬЯ НАЧАЛЬНОГО ВАССАЛА ===
    if (currentPlayer.vassalFamily && currentPlayer.vassalFamily.length > 0) {
        html += `<hr><h4>⚔️ Семья вассала ${currentPlayer.vassalHouseName || "Вассалы"}</h4>`;
        // В блоке отображения членов семьи, замените блок статуса на:
        for (let person of lordFamily) {
            let status = "";
            if (person.isMarried) status += ` 💍 Супруг(а): ${person.spouseName || "неизвестен"}`;
            if (person.isSquire && !person.isKnight) {
                status += " ⚔️ Оруженосец";
            }
            if (person.isKnight) {
                status += " 🛡️ Рыцарь";
            }
            if (!person.isAlive) status += " 💀 Умер";
            html += `<div class="family-member" data-person="${person.id}">${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "М" : "Ж"})${status}</div>`;
        }
    }

    // === ОСТАЛЬНЫЕ ВАССАЛЬНЫЕ ДОМА ===
    if (currentPlayer.vassalHouses && currentPlayer.vassalHouses.length > 0) {
        for (let vh of currentPlayer.vassalHouses) {
            // Пропускаем начального вассала, чтобы не дублировать
            if (vh.houseName === currentPlayer.vassalHouseName) continue;
            html += `<hr><h4>⚔️ Вассальный дом ${vh.houseName}</h4>`;
            // В блоке отображения членов семьи, замените блок статуса на:
            for (let person of lordFamily) {
                let status = "";
                if (person.isMarried) status += ` 💍 Супруг(а): ${person.spouseName || "неизвестен"}`;
                if (person.isSquire && !person.isKnight) {
                    status += " ⚔️ Оруженосец";
                }
                if (person.isKnight) {
                    status += " 🛡️ Рыцарь";
                }
                if (!person.isAlive) status += " 💀 Умер";
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
        let currentPlayer = this.players[this.currentPlayerIndex];
        let isOwnPerson = currentPlayer.persons.some(p => p.id === person.id);

        let html = `<div class="build-dialog">
        <h3>${person.name}</h3>
        <p>Роль: ${person.role}</p>
        <p>Возраст: ${person.age} лет</p>
        <p>Пол: ${person.gender === "male" ? "Мужской" : "Женский"}</p>
        <p>Супруг(а): ${person.spouseName || "нет"}</p>`;

        // Простой статус
        if (person.isSquire && !person.isKnight) {
            html += `<p>Статус: ⚔️ Оруженосец</p>`;
        } else if (person.isKnight) {
            html += `<p>Статус: 🛡️ Рыцарь</p>`;
        } else {
            html += `<p>Статус: Обычный</p>`;
        }

        html += `<p>Жив: ${person.isAlive ? "Да" : "Нет"}</p>`;

        // Кнопки для управления службой (только для своих персонажей)
        if (isOwnPerson && person.isSquire && !person.isKnight) {
            html += `<button id="dismissSquireBtn" style="background:#8a4a3a;">❌ Снять с должности оруженосца</button>`;
        }
        if (isOwnPerson && person.isKnight) {
            html += `<button id="dismissKnightBtn" style="background:#8a4a3a;">❌ Лишить рыцарства</button>`;
        }

        html += `<button id="closePersonInfo">Закрыть</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        if (isOwnPerson && person.isSquire && !person.isKnight) {
            document.getElementById("dismissSquireBtn").onclick = () => {
                person.isSquire = false;
                person.squireYears = 0;
                this.addChronicle(`${person.name} больше не является оруженосцем`);
                this.updateUI();
            };
        }
        if (isOwnPerson && person.isKnight) {
            document.getElementById("dismissKnightBtn").onclick = () => {
                person.isKnight = false;
                this.addChronicle(`${person.name} лишён рыцарства`);
                this.updateUI();
            };
        }
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

        // Проверяем, есть ли уже управляющий
        if (city.governorId) {
            alert(`В городе ${city.name} уже есть управляющий. Сначала освободите должность.`);
            return;
        }

        // Собираем кандидатов (члены семьи без земель, не мейстеры и не септоны)
        let candidates = [];

        // Основная семья
        for (let person of currentPlayer.persons) {
            if (person.age >= 16 && person.isAlive && !person.isLord && !person.isRuler && person.role !== "Мейстер" && person.role !== "Септон") {
                candidates.push({
                    id: person.id,
                    name: person.name,
                    role: person.role,
                    type: "family",
                    houseName: currentPlayer.name
                });
            }
        }

        // Можно также создать нового вассала
        candidates.push({
            id: "new_vassal",
            name: "Создать нового вассала",
            role: "Новый дом",
            type: "new",
            houseName: null
        });

        let html = `<div class="build-dialog">
        <h3>👤 Назначить управляющего для ${city.name}</h3>
        <p>Город-казначейство без управляющего не может быть улучшен выше силы 2</p>
        <div id="candidatesList"></div>
        <button id="cancelAssign">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let candidatesDiv = document.getElementById("candidatesList");
        for (let candidate of candidates) {
            if (candidate.type === "new") {
                candidatesDiv.innerHTML += `<div class="family-member" data-candidate-id="${candidate.id}" data-candidate-type="${candidate.type}">
                🏰 ${candidate.name}
            </div>`;
            } else {
                candidatesDiv.innerHTML += `<div class="family-member" data-candidate-id="${candidate.id}" data-candidate-type="${candidate.type}" data-candidate-name="${candidate.name}" data-candidate-house="${candidate.houseName}">
                ${candidate.name} (${candidate.role}, ${candidate.age} лет) - Дом ${candidate.houseName}
            </div>`;
            }
        }

        document.querySelectorAll("[data-candidate-id]").forEach(el => {
            el.onclick = () => {
                let candidateId = el.dataset.candidateId;
                let candidateType = el.dataset.candidateType;

                if (candidateType === "new") {
                    this.createNewLordForCity(city);
                } else {
                    let candidateName = el.dataset.candidateName;
                    let candidateHouse = el.dataset.candidateHouse;
                    let person = currentPlayer.persons.find(p => p.id == candidateId);
                    if (person) {
                        person.isLord = true;
                        city.governorId = person.id;
                        city.rulerId = person.id;
                        this.addChronicle(`${person.name} назначен управляющим города ${city.name} и основал младшую ветвь Дома ${candidateHouse}`);
                        this.updateUI();
                    }
                }
            };
        });

        document.getElementById("cancelAssign").onclick = () => this.updateUI();
    }

    createNewLordForCity(city) {
        let currentPlayer = this.players[this.currentPlayerIndex];

        let html = `<div class="build-dialog">
        <h3>🏰 Создание нового вассала для города ${city.name}</h3>
        <p>Название нового дома:</p>
        <input type="text" id="newLordHouseName" placeholder="Название дома" value="${currentPlayer.name} Вассал" style="width:90%; margin-bottom:15px; padding:8px; border-radius:20px;">
        <p>Имя лорда:</p>
        <input type="text" id="newLordName" placeholder="Имя" value="Лорд" style="width:90%; margin-bottom:15px; padding:8px; border-radius:20px;">
        <p>Возраст лорда:</p>
        <input type="number" id="newLordAge" value="30" style="width:90%; margin-bottom:15px; padding:8px; border-radius:20px;">
        <button id="createNewLordBtn">✅ Создать</button>
        <button id="cancelCreateBtn">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("createNewLordBtn").onclick = () => {
            let houseName = document.getElementById("newLordHouseName").value.trim() || `${currentPlayer.name} Вассал`;
            let lordName = document.getElementById("newLordName").value.trim() || "Лорд";
            let lordAge = parseInt(document.getElementById("newLordAge").value) || 30;

            let newLord = new Person(Date.now() + Math.random(), lordName, "Лорд", lordAge, "male");
            newLord.isLord = true;

            let newVassalHouse = {
                id: Date.now() + Math.random(),
                houseName: houseName,
                cityId: city.id,
                cityName: city.name,
                family: [newLord]
            };

            if (!currentPlayer.vassalHouses) currentPlayer.vassalHouses = [];
            currentPlayer.vassalHouses.push(newVassalHouse);
            currentPlayer.persons.push(newLord);

            city.governorId = newLord.id;
            city.rulerId = newLord.id;

            this.addChronicle(`🏰 Создан новый вассальный дом ${houseName} с лордом ${lordName} для города ${city.name}`);
            this.updateUI();
        };

        document.getElementById("cancelCreateBtn").onclick = () => this.updateUI();
    }

    findNearbyEmptyHexes(city) {
        let cityHex = this.hexes.find(h => h.row === city.hexRow && h.col === city.hexCol);
        if (!cityHex) return [];
        let available = [];
        for (let h of this.hexes) {
            let existingCity = this.getCityAtHex(h);
            if (!existingCity && h.terrain !== "water") {
                let distFromSource = Math.abs(h.row - cityHex.row) + Math.abs(h.col - cityHex.col);
                if (distFromSource >= 2 && distFromSource <= 3) {
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
                        if (dist >= 2 && dist <= 3) {
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

        let defaultName = "";
        if (buildType === "treasury") defaultName = `${sourceCity.name} казна`;
        else if (buildType === "heir") defaultName = `${sourceCity.name} наследник`;
        else if (buildType === "vassal") defaultName = `${sourceCity.name} вассал`;

        let html = `<div class="build-dialog">
            <h3>Строительство города ${typeNames[buildType]} из ${sourceCity.name}</h3>
            <p>Доступно золота: ${sourceCity.gold}</p>
            <p><strong>🏷️ Название города:</strong></p>
            <input type="text" id="newCityName" placeholder="Название города" value="${defaultName}" style="width:90%; padding:8px; margin:10px 0; border-radius:20px;">
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
        let cityNameInput = document.getElementById("newCityName");
        let savedCityName = cityNameInput ? cityNameInput.value.trim() : "";

        if (!savedCityName) {
            let typeNames = {
                "treasury": "казначейство",
                "heir": "наследник",
                "vassal": "вассал"
            };
            savedCityName = `${sourceCity.name} ${typeNames[buildType]}`;
        }

        this.pendingBuildData = {
            sourceCity,
            investment,
            buildType,
            availableHexes,
            savedCityName
        };
        this.selectLocationMode = true;
        document.getElementById("globalMsg").innerHTML = "Выберите гекс для строительства (зелёный контур)";
        this.drawMap();

        let html = `<div class="build-dialog">
            <p>Нажмите на зелёный гекс на карте для строительства</p>
            <p><strong>🏷️ Город будет называться: ${savedCityName}</strong></p>
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
        let { sourceCity, investment, buildType, savedCityName } = this.pendingBuildData;

        if (sourceCity.gold < investment) {
            alert("Не хватает золота");
            this.selectLocationMode = false;
            this.pendingBuildData = null;
            this.updateUI();
            return;
        }

        let dice = Math.floor(Math.random() * 6) + 1;
        let finalStrength = (dice >= investment) ? investment : dice;

        if (sourceCity.hasQuarry && finalStrength < investment) {
            finalStrength = Math.min(finalStrength + 1, investment);
        }

        if (buildType === "treasury" && finalStrength > 2) finalStrength = 2;
        sourceCity.gold -= investment;

        let newCity = new City(Date.now() + Math.random(), hex.row, hex.col, savedCityName, finalStrength, sourceCity.playerId, buildType, sourceCity.id);

        if (buildType === "treasury") {
            newCity.treasuryForId = sourceCity.id;
        }

        let player = this.players.find(p => p.id === sourceCity.playerId);
        player.cities.push(newCity);

        this.addChronicle(`${player.name} построил город "${savedCityName}" силой ${finalStrength} за ${investment} золота`);

        if (buildType === "vassal") {
            this.createNewVassalFamilyWithCityName(newCity, player, savedCityName);
        } else {
            this.selectLocationMode = false;
            this.pendingBuildData = null;
            this.drawMap();
            this.updateUI();
        }
    }

    createNewVassalFamilyWithCityName(vassalCity, lordPlayer, cityName) {
        let defaultHouseName = `${lordPlayer.name} Вассал`;
        let vassalRoles = ["Лорд", "Супруга", "Сын", "Дочь", "Брат", "Сестра"];

        let html = `<div class="build-dialog">
        <h3>🏰 Создание нового вассального дома</h3>
        <p>Город: <strong>${vassalCity.name}</strong></p>
        <p>Название дома вассала (семьи):</p>
        <input type="text" id="newVassalHouseName" placeholder="Название дома" value="${defaultHouseName}" style="width:90%; margin-bottom:15px; padding:8px; border-radius:20px;">
        <button id="rollNewVassalFamilyBtn" class="game-btn" style="font-size: 18px;">🎲 Бросить кубик (1-6 членов семьи)</button>
        <div id="newVassalFamilySizeResult" style="margin-top:15px;"></div>
        <button id="cancelVassalCreation" style="margin-top:10px;">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("rollNewVassalFamilyBtn").onclick = () => {
            let dice = Math.floor(Math.random() * 6) + 1;
            document.getElementById("newVassalFamilySizeResult").innerHTML = `<span class="dice-big">Выпало ${dice} членов семьи</span>`;
            setTimeout(() => this.inputNewVassalFamilyFull(dice, vassalCity, lordPlayer, vassalRoles), 800);
        };

        if (document.getElementById("cancelVassalCreation")) {
            document.getElementById("cancelVassalCreation").onclick = () => {
                this.selectLocationMode = false;
                this.pendingBuildData = null;
                this.updateUI();
            };
        }
    }

    inputNewVassalFamilyFull(count, vassalCity, lordPlayer, vassalRoles) {
        let houseName = document.getElementById("newVassalHouseName").value.trim() || `${lordPlayer.name} Вассал`;
        vassalCity.name = houseName;

        let html = `<h3>👨‍👩‍👧‍👦 Создание семьи вассального дома ${houseName}</h3>
                <p><small>Пол назначается автоматически в зависимости от роли</small></p>
                <p>Всего членов семьи: ${count}</p>`;
        for (let i = 0; i < count; i++) {
            let defaultRole = i === 0 ? "Лорд" : vassalRoles[Math.floor(Math.random() * vassalRoles.length)];
            let defaultAge = i === 0 ? 35 : 20 + i * 5;
            html += `<div class="member-input">
            <strong>Член ${i + 1}</strong>
            <input type="text" id="new_vassal_name_${i}" placeholder="Имя" value="${this.getDefaultName(i)}" style="width:120px;">
            <select id="new_vassal_role_${i}" class="role-select" style="width:120px;">
                ${vassalRoles.map(r => `<option value="${r}" ${r === defaultRole ? "selected" : ""}>${r}</option>`).join("")}
            </select>
            <input type="number" id="new_vassal_age_${i}" value="${defaultAge}" style="width:70px;" placeholder="Возраст">
            <span id="new_vassal_gender_display_${i}" style="width:80px; display:inline-block;">👤</span>
        </div>`;
        }
        html += `<button id="saveNewVassalFamilyBtn" class="game-btn">✅ Сохранить семью вассала</button>`;
        document.getElementById("dynamicContent").innerHTML = html;

        const updateGender = (idx) => {
            let roleSelect = document.getElementById(`new_vassal_role_${idx}`);
            if (!roleSelect) return;
            let role = roleSelect.value;
            let genderDisplay = document.getElementById(`new_vassal_gender_display_${idx}`);
            if (role === "Лорд" || role === "Сын" || role === "Брат") {
                genderDisplay.innerHTML = "♂ Мужской";
            } else {
                genderDisplay.innerHTML = "♀ Женский";
            }
        };

        for (let i = 0; i < count; i++) {
            let roleSelect = document.getElementById(`new_vassal_role_${i}`);
            if (roleSelect) {
                roleSelect.onchange = () => updateGender(i);
                updateGender(i);
            }
        }

        document.getElementById("saveNewVassalFamilyBtn").onclick = () => {
            let vassalPersons = [];
            for (let i = 0; i < count; i++) {
                let name = document.getElementById(`new_vassal_name_${i}`).value.trim() || `Член ${i + 1}`;
                let role = document.getElementById(`new_vassal_role_${i}`).value;
                let age = parseInt(document.getElementById(`new_vassal_age_${i}`).value) || (i === 0 ? 35 : 20 + i * 5);
                let gender = (role === "Лорд" || role === "Сын" || role === "Брат") ? "male" : "female";
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
                cityName: vassalCity.name,
                family: vassalPersons
            };

            if (!lordPlayer.vassalHouses) lordPlayer.vassalHouses = [];
            lordPlayer.vassalHouses.push(newVassalHouse);
            lordPlayer.persons.push(...vassalPersons);

            this.addChronicle(`🏰 Создан новый вассальный дом ${houseName} с городом "${vassalCity.name}" и семьёй из ${count} человек`);

            this.selectLocationMode = false;
            this.pendingBuildData = null;
            this.drawMap();
            this.updateUI();
        };
    }

    inputNewVassalFamilyWithCityName(count, vassalCity, lordPlayer) {
        let houseName = document.getElementById("newVassalHouseName").value.trim() || `${lordPlayer.name} Вассал`;

        let vassalRoles = ["Лорд", "Супруга", "Наследник", "Дочь", "Брат", "Сестра", "Рыцарь", "Мейстер", "Оруженосец"];

        let html = `<h3>👨‍👩‍👧‍👦 Создание семьи вассального дома ${houseName}</h3>
                <p>Город: <strong>${vassalCity.name}</strong> (название города остаётся)</p>
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
                cityName: vassalCity.name,
                family: vassalPersons
            };

            if (!lordPlayer.vassalHouses) lordPlayer.vassalHouses = [];
            lordPlayer.vassalHouses.push(newVassalHouse);
            lordPlayer.persons.push(...vassalPersons);

            this.addChronicle(`🏰 Создан новый вассальный дом ${houseName} с городом "${vassalCity.name}" и семьёй из ${count} человек`);

            this.selectLocationMode = false;
            this.pendingBuildData = null;
            this.drawMap();
            this.updateUI();
        };
    }

    upgradeCity(city) {
        if (city.strength >= 6) {
            alert("Город уже максимальной силы");
            return;
        }

        if (city.kind === "treasury" && !city.governorId && city.strength >= 2) {
            alert("🏦 Город-казначейство не может быть улучшен выше силы 2 без назначенного управляющего!\nСначала назначьте управляющего через кнопку '👤 Назначить управляющего'.");
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

    processBirths(player) {
        console.log("=== processBirths для игрока:", player.name);

        let allFamilies = [];
        let totalBirths = 0;

        // Основная семья
        allFamilies.push({
            name: player.name,
            type: "main",
            persons: player.persons.filter(p => {
                if (!player.vassalHouses) return true;
                for (let vh of player.vassalHouses) {
                    if (vh.family && vh.family.some(v => v.id === p.id)) return false;
                }
                if (player.vassalFamily && player.vassalFamily.some(v => v.id === p.id)) return false;
                return true;
            }),
            addPerson: (person) => player.persons.push(person),
            getChildrenCount: () => {
                let familyPersons = player.persons.filter(p => {
                    if (!player.vassalHouses) return true;
                    for (let vh of player.vassalHouses) {
                        if (vh.family && vh.family.some(v => v.id === p.id)) return false;
                    }
                    if (player.vassalFamily && player.vassalFamily.some(v => v.id === p.id)) return false;
                    return true;
                });
                return familyPersons.filter(p => p.role === "Сын" || p.role === "Дочь").length;
            }
        });

        // Начальный вассал
        if (player.vassalFamily && player.vassalFamily.length > 0) {
            allFamilies.push({
                name: player.vassalHouseName || "Вассалы",
                type: "vassal",
                persons: player.vassalFamily,
                addPerson: (person) => {
                    player.vassalFamily.push(person);
                    player.persons.push(person);
                },
                getChildrenCount: () => player.vassalFamily.filter(p => p.role === "Сын" || p.role === "Дочь").length
            });
        }

        // Другие вассальные дома
        if (player.vassalHouses) {
            for (let vh of player.vassalHouses) {
                if (vh.houseName !== player.vassalHouseName) {
                    allFamilies.push({
                        name: vh.houseName,
                        type: "vassal",
                        persons: vh.family,
                        addPerson: (person) => {
                            vh.family.push(person);
                            player.persons.push(person);
                        },
                        getChildrenCount: () => vh.family.filter(p => p.role === "Сын" || p.role === "Дочь").length
                    });
                }
            }
        }

        for (let family of allFamilies) {
            let childrenCount = family.getChildrenCount();

            // Находим все супружеские пары
            let couples = [];
            let coupleKeys = new Set();

            for (let person of family.persons) {
                if (person.spouseId && person.gender === "female" && person.age >= 16 && person.age <= 45 && person.isAlive) {
                    let spouse = family.persons.find(p => p.id === person.spouseId);
                    if (spouse && spouse.age >= 16 && spouse.age <= 45 && spouse.isAlive) {
                        let key = `${Math.min(person.id, spouse.id)}_${Math.max(person.id, spouse.id)}`;
                        if (!coupleKeys.has(key)) {
                            coupleKeys.add(key);
                            couples.push({ mother: person, father: spouse });
                        }
                    }
                }
            }

            console.log(`Семья ${family.name}: найдено ${couples.length} пар, детей ${childrenCount}`);

            for (let couple of couples) {
                // Увеличиваем базовую вероятность до 50% и снижаем медленнее
                let chance = 80 - (childrenCount * 15);
                chance = Math.max(chance, 15);
                let roll = Math.floor(Math.random() * 100) + 1;
                console.log(`Пара ${couple.mother.name} и ${couple.father.name}: детей ${childrenCount}, шанс ${chance}%, выпало ${roll}%`);

                if (roll <= chance) {
                    totalBirths++;
                    let gender = Math.random() < 0.5 ? "male" : "female";
                    let role = gender === "male" ? "Сын" : "Дочь";
                    let defaultName = gender === "male" ? "Новорождённый" : "Новорождённая";
                    let fatherName = couple.father.name;
                    let motherName = couple.mother.name;

                    let message = `👶 В семье Дома ${family.name} родился ${gender === "male" ? "сын" : "дочь"}!\nОтец: ${fatherName}\nМать: ${motherName}\n\nДайте имя ребёнку:`;
                    this.showPromptModal("🎉 Рождение ребёнка", message, defaultName, (name) => {
                        if (!name) name = defaultName;
                        let child = new Person(Date.now() + Math.random(), name, role, 0, gender, couple.father.id, couple.mother.id);
                        family.addPerson(child);
                        this.addChronicle(`👶 В семье Дома ${family.name} у ${fatherName} и ${motherName} родился ${gender === "male" ? "сын" : "дочь"} ${name}`);
                        this.updateUI();
                    });
                    childrenCount++;
                }
            }
        }

        console.log(`Всего рождений в этом ходу: ${totalBirths}`);

        // Смерть от старости
        let deathModifier = Math.floor(this.currentTurn);
        deathModifier = Math.min(deathModifier, 30);

        for (let person of player.persons) {
            if (person.age >= 60 && !person.isRuler && person.isAlive) {
                let deathChance = 30 + deathModifier;
                deathChance = Math.min(deathChance, 80);
                let roll = Math.floor(Math.random() * 100) + 1;
                if (roll <= deathChance) {
                    person.isAlive = false;
                    this.addChronicle(`💀 ${person.name} из Дома ${player.name} умер в возрасте ${person.age} лет`);
                    this.checkSuccession(player);
                }
            }
            if (person.age >= 65 && person.isRuler && person.isAlive) {
                let deathChance = 35 + (person.age - 65) * 10;
                deathChance = Math.min(deathChance, 95);
                let roll = Math.floor(Math.random() * 100) + 1;
                if (roll <= deathChance) {
                    person.isAlive = false;
                    this.addChronicle(`💀 ${person.name}, правитель Дома ${player.name}, умер в возрасте ${person.age} лет`);
                    this.checkSuccession(player);
                }
            }
        }
    }

    // Добавьте этот метод в класс Game
    processKnighthood(player) {
        for (let person of player.persons) {
            if (person.isSquire && !person.isKnight && person.isAlive && person.age >= 16) {
                let chance = 35 + (person.squireYears * 10);
                chance = Math.min(chance, 95);
                let roll = Math.floor(Math.random() * 100) + 1;
                if (roll <= chance) {
                    person.isKnight = true;
                    person.isSquire = false;
                    if (person.servingTo) {
                        this.addChronicle(`⚔️ ${person.name} из Дома ${player.name} посвящён в рыцари! Служил дому ${person.servingTo}`);
                    } else {
                        this.addChronicle(`⚔️ ${person.name} из Дома ${player.name} посвящён в рыцари!`);
                    }
                    this.updateUI();
                }
            }
        }
    }

    checkSuccession(player) {
        let currentRuler = player.persons.find(p => p.isRuler === true && p.isAlive === true);
        if (!currentRuler) {
            currentRuler = player.persons.find(p => (p.role === "Лорд" || p.role === "Король") && p.isAlive === true);
            if (currentRuler) {
                currentRuler.isRuler = true;
                this.addChronicle(`👑 ${currentRuler.name} стал новым правителем Дома ${player.name}`);
            }
        }

        let deadRuler = player.persons.find(p => p.isRuler === true && p.isAlive === false);
        if (deadRuler) {
            this.handleRulerDeath(player, deadRuler);
        }

        let ruler = player.persons.find(p => p.isRuler === true && p.isAlive === true);
        if (ruler) {
            for (let p of player.persons) {
                p.isHeir = false;
            }
            let heir = this.findHeir(player, ruler);
            if (heir) {
                heir.isHeir = true;
            }
        }
    }

    handleRulerDeath(player, deadRuler) {
        this.addChronicle(`⚰️ Правитель Дома ${player.name} ${deadRuler.name} умер в возрасте ${deadRuler.age} лет`);

        let heir = this.findHeir(player, deadRuler);

        if (!heir) {
            this.addChronicle(`⚠️ Дом ${player.name} остался без наследника! Игра окончена для этого дома.`);
            this.eliminatePlayer(player);
            return;
        }

        // Находим города, которыми владел умерший правитель
        let rulerCities = player.cities.filter(c => c.rulerId === deadRuler.id || (c.rulerId === null && c.isStartCity));

        if (rulerCities.length === 0) {
            heir.isRuler = true;
            heir.isLord = true;
            heir.role = deadRuler.role === "Король" ? "Король" : "Лорд";
            this.addChronicle(`👑 ${heir.name} стал новым правителем Дома ${player.name}, но не имеет земель`);
            return;
        }

        // Сохраняем данные для выбора наследства
        this.pendingInheritance = {
            player: player,
            heir: heir,
            deadRuler: deadRuler,
            rulerCities: rulerCities,
            citiesToKeep: [],
            citiesToDistribute: [...rulerCities]
        };

        this.showInheritanceDialog();
    }

    eliminatePlayer(player) {
        // Удаляем все города игрока с карты
        for (let city of player.cities) {
            let hex = this.hexes.find(h => h.row === city.hexRow && h.col === city.hexCol);
            if (hex) {
                hex.cityId = null;
                hex.hasCity = false;
                hex.owner = null;
            }
        }

        // Удаляем игрока из игры
        let playerIndex = this.players.findIndex(p => p.id === player.id);
        if (playerIndex !== -1) {
            this.players.splice(playerIndex, 1);
            this.addChronicle(`🏰 Дом ${player.name} прекратил своё существование!`);

            // Корректируем текущего игрока
            if (this.currentPlayerIndex >= this.players.length) {
                this.currentPlayerIndex = 0;
            }
        }

        this.drawMap();
        this.updateUI();
    }

    showInheritanceDialog() {
        let { player, heir, deadRuler, rulerCities } = this.pendingInheritance;

        // Находим доступных родственников для получения земель
        let availableRelatives = [];

        // Другие сыновья (не наследник)
        let otherSons = player.persons.filter(p =>
            p.fatherId === deadRuler.id &&
            p.gender === "male" &&
            p.isAlive === true &&
            p.id !== heir.id
        );
        for (let son of otherSons) {
            availableRelatives.push({
                id: son.id,
                name: son.name,
                role: "Сын",
                type: "son"
            });
        }

        // Братья правителя
        let brothers = player.persons.filter(p =>
            p.fatherId === deadRuler.fatherId &&
            p.gender === "male" &&
            p.isAlive === true &&
            p.id !== deadRuler.id
        );
        for (let brother of brothers) {
            availableRelatives.push({
                id: brother.id,
                name: brother.name,
                role: "Брат",
                type: "brother"
            });
        }

        // Супруга
        let spouse = player.persons.find(p => p.spouseId === deadRuler.id && p.isAlive === true);
        if (spouse) {
            availableRelatives.push({
                id: spouse.id,
                name: spouse.name,
                role: "Супруга",
                type: "spouse"
            });
        }

        // Дочери
        let daughters = player.persons.filter(p =>
            p.fatherId === deadRuler.id &&
            p.gender === "female" &&
            p.isAlive === true
        );
        for (let daughter of daughters) {
            availableRelatives.push({
                id: daughter.id,
                name: daughter.name,
                role: "Дочь",
                type: "daughter"
            });
        }

        // Первый вассал (если есть)
        let firstVassal = null;
        if (player.vassalHouses && player.vassalHouses.length > 0) {
            firstVassal = {
                id: player.vassalHouses[0].id,
                name: player.vassalHouses[0].houseName,
                role: "Вассал",
                type: "vassal",
                isVassal: true
            };
        } else if (player.vassalFamily && player.vassalFamily.length > 0) {
            firstVassal = {
                id: "initial_vassal",
                name: player.vassalHouseName || "Вассалы",
                role: "Вассал",
                type: "vassal",
                isVassal: true
            };
        }

        let html = `<div class="build-dialog">
        <h3>👑 Наследование престола</h3>
        <p><strong>${heir.name}</strong> становится новым правителем Дома ${player.name}</p>
        <p>Умерший правитель владел городами:</p>
        <div id="citiesList" style="margin:10px 0; max-height:200px; overflow-y:auto;"></div>
        <p>Выберите, какой город оставить себе как столицу:</p>
        <select id="capitalSelect" style="margin:10px 0; padding:5px;"></select>
        <button id="confirmCapitalBtn" class="game-btn">✅ Подтвердить выбор столицы</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let citiesDiv = document.getElementById("citiesList");
        for (let i = 0; i < rulerCities.length; i++) {
            let city = rulerCities[i];
            citiesDiv.innerHTML += `<div class="city-card" data-city-index="${i}" style="margin:5px 0; padding:8px;">
            <b>🏰 ${city.name}</b> | Сила: ${city.strength} | Золото: ${city.gold} | Армия: ${city.army}
        </div>`;
        }

        let capitalSelect = document.getElementById("capitalSelect");
        for (let i = 0; i < rulerCities.length; i++) {
            capitalSelect.innerHTML += `<option value="${i}">${rulerCities[i].name}</option>`;
        }

        document.getElementById("confirmCapitalBtn").onclick = () => {
            let capitalIndex = parseInt(capitalSelect.value);
            let capitalCity = rulerCities[capitalIndex];
            let otherCities = rulerCities.filter((_, i) => i !== capitalIndex);

            // Наследник становится правителем
            heir.isRuler = true;
            heir.isLord = true;
            heir.role = deadRuler.role === "Король" ? "Король" : "Лорд";
            capitalCity.isCapital = true;
            capitalCity.rulerId = heir.id;
            heir.rulingCityId = capitalCity.id;
            this.addChronicle(`👑 ${heir.name} стал новым правителем Дома ${player.name}. Столица: ${capitalCity.name}`);

            // Если есть другие города - распределяем их
            if (otherCities.length > 0) {
                this.pendingInheritance = {
                    ...this.pendingInheritance,
                    citiesToDistribute: otherCities,
                    availableRelatives: availableRelatives,
                    firstVassal: firstVassal
                };
                this.distributeNextCity();
            } else {
                this.finishInheritance();
            }
        };
    }

    showInheritanceMenu(player, heir, deadRuler, rulerCities) {
        let html = `<div class="build-dialog">
        <h3>👑 Наследование престола</h3>
        <p><strong>${heir.name}</strong> становится новым правителем Дома ${player.name}</p>
        <p>Умерший правитель владел следующими городами:</p>
        <div id="citiesList" style="margin:10px 0; max-height:200px; overflow-y:auto;"></div>
        <p>Выберите, сколько городов оставить под прямым управлением (максимум 2):</p>
        <select id="keepCountSelect" style="margin:10px 0; padding:5px;">
            ${Array.from({ length: Math.min(3, rulerCities.length + 1) }, (_, i) => `<option value="${i}">${i}</option>`).join("")}
        </select>
        <button id="confirmInheritanceBtn" class="game-btn">✅ Подтвердить выбор</button>
        <button id="cancelInheritanceBtn" class="game-btn">❌ Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let citiesDiv = document.getElementById("citiesList");
        for (let i = 0; i < rulerCities.length; i++) {
            let city = rulerCities[i];
            citiesDiv.innerHTML += `<div class="city-card" data-city-index="${i}" style="margin:5px 0; padding:8px;">
            <b>🏰 ${city.name}</b> | Сила: ${city.strength} | Золото: ${city.gold} | Армия: ${city.army}
        </div>`;
        }

        document.getElementById("confirmInheritanceBtn").onclick = () => {
            let keepCount = parseInt(document.getElementById("keepCountSelect").value);
            let citiesToKeep = rulerCities.slice(0, keepCount);
            let citiesToDistribute = rulerCities.slice(keepCount);

            // Наследник становится правителем
            heir.isRuler = true;
            heir.isLord = true;
            heir.role = deadRuler.role === "Король" ? "Король" : "Лорд";
            this.addChronicle(`👑 ${heir.name} стал новым правителем Дома ${player.name}`);

            // Оставляем выбранные города под управлением наследника
            for (let i = 0; i < citiesToKeep.length; i++) {
                let city = citiesToKeep[i];
                city.rulerId = heir.id;
                if (i === 0) {
                    city.isCapital = true;
                    heir.rulingCityId = city.id;
                    this.addChronicle(`🏰 ${heir.name} оставил себе город ${city.name} как столицу`);
                } else {
                    this.addChronicle(`🏰 ${heir.name} оставил себе город ${city.name}`);
                }
            }

            // Распределяем остальные города
            if (citiesToDistribute.length > 0) {
                this.distributeInheritanceCities(player, heir, citiesToDistribute);
            } else {
                this.updateUI();
            }
        };

        document.getElementById("cancelInheritanceBtn").onclick = () => {
            // Отмена - все города остаются под управлением наследника
            for (let city of rulerCities) {
                city.rulerId = heir.id;
            }
            if (rulerCities.length > 0) {
                rulerCities[0].isCapital = true;
                heir.rulingCityId = rulerCities[0].id;
            }
            heir.isRuler = true;
            heir.isLord = true;
            heir.role = deadRuler.role === "Король" ? "Король" : "Лорд";
            this.addChronicle(`👑 ${heir.name} стал новым правителем Дома ${player.name} и сохранил все земли`);
            this.updateUI();
        };
    }

    distributeNextCity() {
        let { player, heir, citiesToDistribute, availableRelatives, firstVassal } = this.pendingInheritance;

        if (citiesToDistribute.length === 0) {
            this.finishInheritance();
            return;
        }

        let city = citiesToDistribute[0];
        let remainingCities = citiesToDistribute.slice(1);

        let relativesHtml = "";
        for (let relative of availableRelatives) {
            relativesHtml += `<div class="family-member" data-recipient-id="${relative.id}" data-recipient-type="${relative.type}" data-recipient-name="${relative.name}">
            ${relative.name} (${relative.role})
        </div>`;
        }

        let vassalHtml = "";
        if (firstVassal) {
            vassalHtml = `<div class="enemy-card" data-recipient-type="vassal" data-recipient-name="${firstVassal.name}">
            🏰 Передать первому вассалу (Дом ${firstVassal.name})
        </div>`;
        }

        let html = `<div class="build-dialog">
        <h3>🏰 Распределение земель</h3>
        <p>Город <strong>${city.name}</strong> (сила ${city.strength})</p>
        <p>Выберите, кому передать этот город:</p>
        <div id="recipientsList" style="max-height:250px; overflow-y:auto;">
            <div class="family-member" data-recipient-type="heir" data-recipient-name="${heir.name}">
                👑 Оставить под управлением ${heir.name}
            </div>
            ${relativesHtml}
            ${vassalHtml}
        </div>
        <button id="skipCityBtn">Пропустить (оставить под управлением)</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.querySelectorAll("[data-recipient-id]").forEach(el => {
            el.onclick = () => {
                let recipientId = parseFloat(el.dataset.recipientId);
                let recipientType = el.dataset.recipientType;
                let recipientName = el.dataset.recipientName;
                let recipient = player.persons.find(p => p.id === recipientId);

                if (recipient) {
                    recipient.isLord = true;
                    city.rulerId = recipient.id;
                    this.addChronicle(`🏰 Город ${city.name} передан ${recipient.name} (${recipient.role})`);
                }

                this.pendingInheritance.citiesToDistribute = remainingCities;
                this.distributeNextCity();
            };
        });

        document.querySelectorAll("[data-recipient-type='vassal']").forEach(el => {
            el.onclick = () => {
                city.rulerId = null;
                city.playerId = player.id;
                this.addChronicle(`🏰 Город ${city.name} передан под управление вассала ${firstVassal.name}`);

                this.pendingInheritance.citiesToDistribute = remainingCities;
                this.distributeNextCity();
            };
        });

        document.querySelectorAll("[data-recipient-type='heir']").forEach(el => {
            el.onclick = () => {
                city.rulerId = heir.id;
                this.addChronicle(`🏰 Город ${city.name} остаётся под прямым управлением ${heir.name}`);

                this.pendingInheritance.citiesToDistribute = remainingCities;
                this.distributeNextCity();
            };
        });

        document.getElementById("skipCityBtn").onclick = () => {
            city.rulerId = heir.id;
            this.addChronicle(`🏰 Город ${city.name} остаётся под управлением ${heir.name}`);
            this.pendingInheritance.citiesToDistribute = remainingCities;
            this.distributeNextCity();
        };
    }

    finishInheritance() {
        // Проверяем, не нужно ли удалить игрока
        let player = this.pendingInheritance.player;
        let hasCities = player.cities.some(c => c.rulerId !== null);

        if (!hasCities && player.persons.filter(p => p.isAlive).length === 0) {
            this.addChronicle(`⚠️ Дом ${player.name} остался без земель и наследников! Игра окончена.`);
            this.eliminatePlayer(player);
        }

        this.pendingInheritance = null;
        this.drawMap();
        this.updateUI();
    }

    distributeInheritanceCities(player, newRuler, cities) {
        if (cities.length === 0) {
            this.updateUI();
            return;
        }

        // Находим доступных членов семьи (не мейстеры и не септоны, не мертвые, не правитель, старше 16)
        let availableFamily = player.persons.filter(p =>
            p.isAlive === true &&
            p.id !== newRuler.id &&
            p.role !== "Мейстер" &&
            p.role !== "Септон" &&
            !p.isRuler &&
            p.age >= 16
        );

        // Также можно передать новым вассалам
        let html = `<div class="build-dialog">
        <h3>🏰 Распределение земель</h3>
        <p>Осталось распределить ${cities.length} городов:</p>
        <div id="distributionList"></div>
        <button id="autoDistributeBtn">Автоматически распределить</button>
        <button id="skipDistributionBtn">Пропустить (оставить под управлением)</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        this.showNextCityDistribution(player, newRuler, cities, availableFamily, 0);
    }

    showNextCityDistribution(player, newRuler, cities, availableFamily, index) {
        if (index >= cities.length) {
            this.updateUI();
            return;
        }

        let city = cities[index];
        let remainingCities = cities.slice(index + 1);

        let familyOptions = "";
        for (let person of availableFamily) {
            familyOptions += `<div class="family-member" data-person-id="${person.id}" data-type="family">
            ${person.name} (${person.role}, ${person.age} лет) - создать младшую ветвь
        </div>`;
        }

        // Опция создания нового вассала
        familyOptions += `<div class="family-member" data-type="new_vassal">
            🏰 Создать нового вассала
        </div>`;

        let html = `<div class="build-dialog">
        <h3>🏰 Распределение земель - город ${index + 1} из ${cities.length}</h3>
        <p>Город <strong>${city.name}</strong> (сила ${city.strength})</p>
        <p>Выберите, кому передать этот город:</p>
        <div id="recipientsList" style="max-height:200px; overflow-y:auto;">${familyOptions}</div>
        <button id="keepCityBtn">Оставить под прямым управлением</button>
        <button id="giveToNeighborBtn">Подарить соседнему дому</button>
        <button id="skipCityBtn">Пропустить (распределить позже)</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let personId = parseFloat(el.dataset.personId);
                let newLord = player.persons.find(p => p.id === personId);
                if (newLord) {
                    newLord.isLord = true;
                    city.rulerId = newLord.id;
                    this.addChronicle(`🏰 Город ${city.name} передан ${newLord.name}, основана младшая ветвь Дома ${player.name}`);

                    // Удаляем из доступных
                    let idx = availableFamily.findIndex(p => p.id === personId);
                    if (idx !== -1) availableFamily.splice(idx, 1);

                    this.showNextCityDistribution(player, newRuler, cities, availableFamily, index + 1);
                }
            };
        });

        document.querySelectorAll("[data-type='new_vassal']").forEach(el => {
            el.onclick = () => {
                this.createNewVassalForCity(city, player, newRuler, cities, availableFamily, index);
            };
        });

        document.getElementById("keepCityBtn").onclick = () => {
            city.rulerId = newRuler.id;
            this.addChronicle(`🏰 Город ${city.name} остаётся под прямым управлением ${newRuler.name}`);
            this.showNextCityDistribution(player, newRuler, cities, availableFamily, index + 1);
        };

        document.getElementById("giveToNeighborBtn").onclick = () => {
            let neighbors = [];
            for (let otherPlayer of this.players) {
                if (otherPlayer.id !== player.id) {
                    neighbors.push(otherPlayer);
                }
            }

            if (neighbors.length === 0) {
                city.rulerId = newRuler.id;
                this.addChronicle(`🏰 Город ${city.name} остаётся под управлением ${newRuler.name} (нет соседей)`);
                this.showNextCityDistribution(player, newRuler, cities, availableFamily, index + 1);
            } else {
                this.selectNeighborForCityGift(city, player, newRuler, cities, availableFamily, index, neighbors);
            }
        };

        document.getElementById("skipCityBtn").onclick = () => {
            this.showNextCityDistribution(player, newRuler, cities, availableFamily, index + 1);
        };
    }

    selectNeighborForCityGift(city, player, newRuler, cities, availableFamily, index, neighbors) {
        let html = `<div class="build-dialog">
        <h3>🎁 Подарок соседу</h3>
        <p>Город <strong>${city.name}</strong> будет подарен:</p>
        <div id="neighborsList"></div>
        <button id="cancelGiftBtn">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let neighborsDiv = document.getElementById("neighborsList");
        for (let neighbor of neighbors) {
            neighborsDiv.innerHTML += `<div class="enemy-card" data-player-id="${neighbor.id}">
            <b>🏰 Дом ${neighbor.name}</b>
        </div>`;
        }

        document.querySelectorAll("[data-player-id]").forEach(el => {
            el.onclick = () => {
                let neighborId = parseInt(el.dataset.playerId);
                let neighbor = this.players.find(p => p.id === neighborId);
                city.playerId = neighborId;
                city.rulerId = null;
                neighbor.cities.push(city);
                this.addChronicle(`🎁 Город ${city.name} подарен Дому ${neighbor.name}`);
                this.showNextCityDistribution(player, newRuler, cities, availableFamily, index + 1);
            };
        });

        document.getElementById("cancelGiftBtn").onclick = () => {
            city.rulerId = newRuler.id;
            this.showNextCityDistribution(player, newRuler, cities, availableFamily, index + 1);
        };
    }

    createNewVassalForCity(city, player, newRuler, cities, availableFamily, index) {
        let html = `<div class="build-dialog">
        <h3>🏰 Создание нового вассала для города ${city.name}</h3>
        <p>Название нового дома:</p>
        <input type="text" id="newVassalHouseName" placeholder="Название дома" value="${player.name} Вассал" style="width:90%; margin-bottom:15px; padding:8px; border-radius:20px;">
        <p>Имя лорда:</p>
        <input type="text" id="newLordName" placeholder="Имя" value="Лорд" style="width:90%; margin-bottom:15px; padding:8px; border-radius:20px;">
        <p>Возраст лорда:</p>
        <input type="number" id="newLordAge" value="30" style="width:90%; margin-bottom:15px; padding:8px; border-radius:20px;">
        <button id="createNewLordBtn">✅ Создать</button>
        <button id="cancelCreateBtn">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("createNewLordBtn").onclick = () => {
            let houseName = document.getElementById("newVassalHouseName").value.trim() || `${player.name} Вассал`;
            let lordName = document.getElementById("newLordName").value.trim() || "Лорд";
            let lordAge = parseInt(document.getElementById("newLordAge").value) || 30;

            let newLord = new Person(Date.now() + Math.random(), lordName, "Лорд", lordAge, "male");
            newLord.isLord = true;

            let newVassalHouse = {
                id: Date.now() + Math.random(),
                houseName: houseName,
                cityId: city.id,
                cityName: city.name,
                family: [newLord]
            };

            if (!player.vassalHouses) player.vassalHouses = [];
            player.vassalHouses.push(newVassalHouse);
            player.persons.push(newLord);

            city.rulerId = newLord.id;
            city.governorId = newLord.id;

            this.addChronicle(`🏰 Создан новый вассальный дом ${houseName} с лордом ${lordName} для города ${city.name}`);
            this.showNextCityDistribution(player, newRuler, cities, availableFamily, index + 1);
        };

        document.getElementById("cancelCreateBtn").onclick = () => {
            city.rulerId = newRuler.id;
            this.showNextCityDistribution(player, newRuler, cities, availableFamily, index + 1);
        };
    }

    showInheritanceMenu(player, heir, deadRuler, rulerCities) {
        let message = `👑 ${heir.name} становится новым правителем Дома ${player.name}\n\n`;
        message += `Умерший правитель владел городами:\n`;
        for (let i = 0; i < rulerCities.length; i++) {
            message += `${i + 1}. ${rulerCities[i].name} (сила ${rulerCities[i].strength})\n`;
        }
        message += `\nВыберите, сколько городов оставить себе (максимум 2):`;

        let maxKeep = Math.min(2, rulerCities.length);

        let html = `<div class="build-dialog">
        <h3>👑 Наследование</h3>
        <p>${heir.name} становится новым правителем Дома ${player.name}</p>
        <p>Умерший правитель владел городами:</p>
        <div id="citiesList"></div>
        <p>Сколько городов вы хотите оставить под прямым управлением? (максимум ${maxKeep})</p>
        <select id="keepCountSelect">
            ${Array.from({ length: maxKeep + 1 }, (_, i) => `<option value="${i}">${i}</option>`).join("")}
        </select>
        <button id="confirmInheritanceBtn">Подтвердить</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let citiesDiv = document.getElementById("citiesList");
        for (let city of rulerCities) {
            citiesDiv.innerHTML += `<div class="city-card" data-city-id="${city.id}">
            <b>🏰 ${city.name}</b><br>
            Сила: ${city.strength} | Золото: ${city.gold}
        </div>`;
        }

        document.getElementById("confirmInheritanceBtn").onclick = () => {
            let keepCount = parseInt(document.getElementById("keepCountSelect").value);
            let citiesToKeep = rulerCities.slice(0, keepCount);
            let citiesToDistribute = rulerCities.slice(keepCount);

            // Оставляем выбранные города под управлением наследника
            for (let city of citiesToKeep) {
                city.rulerId = heir.id;
                city.isCapital = (city === citiesToKeep[0]);
                if (city === citiesToKeep[0]) {
                    heir.rulingCityId = city.id;
                    this.addChronicle(`🏰 ${heir.name} оставил себе город ${city.name} как столицу`);
                } else {
                    this.addChronicle(`🏰 ${heir.name} оставил себе город ${city.name}`);
                }
            }

            // Делаем наследника правителем
            heir.isRuler = true;
            heir.isLord = true;
            heir.role = deadRuler.role === "Король" ? "Король" : "Лорд";
            this.addChronicle(`👑 ${heir.name} стал новым правителем Дома ${player.name}`);

            // Распределяем остальные города
            if (citiesToDistribute.length > 0) {
                this.distributeInheritanceCities(player, heir, citiesToDistribute);
            } else {
                this.updateUI();
            }
        };
    }

    distributeInheritanceCities(player, newRuler, cities) {
        if (cities.length === 0) {
            this.updateUI();
            return;
        }

        // Находим доступных членов семьи (не мейстеры и не септоны, не мертвые, не правитель, старше 16)
        let availableFamily = player.persons.filter(p =>
            p.isAlive === true &&
            p.id !== newRuler.id &&
            p.role !== "Мейстер" &&
            p.role !== "Септон" &&
            !p.isRuler &&
            p.age >= 16
        );

        // Также можно передать вассальным домам
        let availableVassals = [];
        if (player.vassalHouses) {
            for (let vh of player.vassalHouses) {
                availableVassals.push({
                    id: vh.id,
                    name: vh.houseName,
                    type: "vassal",
                    persons: vh.family
                });
            }
        }
        if (player.vassalFamily && player.vassalFamily.length > 0) {
            availableVassals.push({
                id: "initial_vassal",
                name: player.vassalHouseName || "Вассалы",
                type: "vassal",
                persons: player.vassalFamily
            });
        }

        if (availableFamily.length === 0 && availableVassals.length === 0) {
            // Нет никого - города остаются под прямым управлением
            for (let city of cities) {
                city.rulerId = newRuler.id;
                this.addChronicle(`🏰 Город ${city.name} остаётся под прямым управлением ${newRuler.name}`);
            }
            this.updateUI();
            return;
        }

        this.distributeInheritanceMenu(player, newRuler, cities, availableFamily, availableVassals);
    }

    distributeInheritanceMenu(player, newRuler, cities, availableFamily, availableVassals) {
        if (cities.length === 0) {
            this.updateUI();
            return;
        }

        let city = cities[0];
        let remainingCities = cities.slice(1);

        let html = `<div class="build-dialog">
        <h3>🏰 Распределение земель</h3>
        <p>Город <strong>${city.name}</strong> (сила ${city.strength})</p>
        <p>Выберите, кому передать этот город:</p>
        <div id="familyList"></div>
        <div id="vassalList"></div>
        <button id="keepCity">Оставить под прямым управлением</button>
        <button id="giveToNeighbor">Подарить соседнему дому</button>
        <button id="skipCity">Пропустить (оставить под управлением)</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let familyDiv = document.getElementById("familyList");
        if (availableFamily.length > 0) {
            familyDiv.innerHTML = "<h4>👑 Члены семьи:</h4>";
            for (let person of availableFamily) {
                familyDiv.innerHTML += `<div class="family-member" data-person-id="${person.id}" data-type="family">
                ${person.name} (${person.role}, ${person.age} лет) - создать младшую ветвь
            </div>`;
            }
        }

        let vassalDiv = document.getElementById("vassalList");
        if (availableVassals.length > 0) {
            vassalDiv.innerHTML = "<h4>⚔️ Вассальные дома:</h4>";
            for (let vassal of availableVassals) {
                vassalDiv.innerHTML += `<div class="enemy-card" data-vassal-id="${vassal.id}" data-type="vassal" data-vassal-name="${vassal.name}">
                🏰 Дом ${vassal.name}
            </div>`;
            }
        }

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let personId = parseFloat(el.dataset.personId);
                let newLord = player.persons.find(p => p.id === personId);
                if (newLord) {
                    newLord.isLord = true;
                    city.rulerId = newLord.id;
                    this.addChronicle(`🏰 Город ${city.name} передан ${newLord.name}, основана младшая ветвь Дома ${player.name}`);

                    // Удаляем из доступных
                    let index = availableFamily.findIndex(p => p.id === personId);
                    if (index !== -1) availableFamily.splice(index, 1);

                    // Продолжаем с оставшимися городами
                    if (remainingCities.length > 0) {
                        this.distributeInheritanceMenu(player, newRuler, remainingCities, availableFamily, availableVassals);
                    } else {
                        this.updateUI();
                    }
                }
            };
        });

        document.querySelectorAll("[data-vassal-id]").forEach(el => {
            el.onclick = () => {
                let vassalId = el.dataset.vassalId;
                let vassalName = el.dataset.vassalName;
                city.rulerId = null;
                city.playerId = player.id; // остаётся у того же игрока, но под управлением вассала
                this.addChronicle(`🏰 Город ${city.name} передан под управление вассала ${vassalName}`);

                if (remainingCities.length > 0) {
                    this.distributeInheritanceMenu(player, newRuler, remainingCities, availableFamily, availableVassals);
                } else {
                    this.updateUI();
                }
            };
        });

        document.getElementById("keepCity").onclick = () => {
            city.rulerId = newRuler.id;
            this.addChronicle(`🏰 Город ${city.name} остаётся под прямым управлением ${newRuler.name}`);

            if (remainingCities.length > 0) {
                this.distributeInheritanceMenu(player, newRuler, remainingCities, availableFamily, availableVassals);
            } else {
                this.updateUI();
            }
        };

        document.getElementById("giveToNeighbor").onclick = () => {
            let neighbors = [];
            for (let otherPlayer of this.players) {
                if (otherPlayer.id !== player.id) {
                    neighbors.push(otherPlayer);
                }
            }

            if (neighbors.length === 0) {
                city.rulerId = newRuler.id;
                this.addChronicle(`🏰 Город ${city.name} остаётся под управлением ${newRuler.name} (нет соседей)`);
                if (remainingCities.length > 0) {
                    this.distributeInheritanceMenu(player, newRuler, remainingCities, availableFamily, availableVassals);
                } else {
                    this.updateUI();
                }
            } else {
                this.selectNeighborForGiftInheritance(player, newRuler, city, remainingCities, availableFamily, availableVassals, neighbors);
            }
        };

        document.getElementById("skipCity").onclick = () => {
            city.rulerId = newRuler.id;
            if (remainingCities.length > 0) {
                this.distributeInheritanceMenu(player, newRuler, remainingCities, availableFamily, availableVassals);
            } else {
                this.updateUI();
            }
        };
    }

    selectNeighborForGiftInheritance(player, newRuler, city, remainingCities, availableFamily, availableVassals, neighbors) {
        let html = `<div class="build-dialog">
        <h3>🎁 Подарок соседу</h3>
        <p>Город <strong>${city.name}</strong> будет подарен:</p>
        <div id="neighborsList"></div>
        <button id="cancelGift">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let neighborsDiv = document.getElementById("neighborsList");
        for (let neighbor of neighbors) {
            neighborsDiv.innerHTML += `<div class="enemy-card" data-player-id="${neighbor.id}">
            <b>🏰 Дом ${neighbor.name}</b>
        </div>`;
        }

        document.querySelectorAll("[data-player-id]").forEach(el => {
            el.onclick = () => {
                let neighborId = parseInt(el.dataset.playerId);
                let neighbor = this.players.find(p => p.id === neighborId);
                city.playerId = neighborId;
                city.rulerId = null;
                neighbor.cities.push(city);
                this.addChronicle(`🎁 Город ${city.name} подарен Дому ${neighbor.name}`);

                if (remainingCities.length > 0) {
                    this.distributeInheritanceMenu(player, newRuler, remainingCities, availableFamily, availableVassals);
                } else {
                    this.updateUI();
                }
            };
        });

        document.getElementById("cancelGift").onclick = () => {
            city.rulerId = newRuler.id;
            if (remainingCities.length > 0) {
                this.distributeInheritanceMenu(player, newRuler, remainingCities, availableFamily, availableVassals);
            } else {
                this.updateUI();
            }
        };
    }

    findHeir(player, deadRuler) {
        // 1. Ищем старшего сына
        let sons = player.persons.filter(p => p.fatherId === deadRuler.id && p.gender === "male" && p.isAlive === true);
        sons.sort((a, b) => a.age - b.age);
        if (sons.length > 0) {
            return sons[0];
        }

        // 2. Ищем брата
        let brothers = player.persons.filter(p => p.fatherId === deadRuler.fatherId && p.gender === "male" && p.isAlive === true && p.id !== deadRuler.id);
        brothers.sort((a, b) => a.age - b.age);
        if (brothers.length > 0) {
            this.addChronicle(`⚠️ Прямых наследников нет. Новым правителем становится брат ${brothers[0].name}`);
            return brothers[0];
        }

        // 3. Ищем старшую дочь
        let daughters = player.persons.filter(p => p.fatherId === deadRuler.id && p.gender === "female" && p.isAlive === true);
        daughters.sort((a, b) => a.age - b.age);
        if (daughters.length > 0) {
            let heiress = daughters[0];
            this.addChronicle(`⚠️ Наследницей Дома ${player.name} стала дочь ${heiress.name}`);
            return heiress;
        }

        // 4. Ищем супругу
        let spouse = player.persons.find(p => p.spouseId === deadRuler.id && p.isAlive === true);
        if (spouse) {
            this.addChronicle(`⚠️ Наследницей Дома ${player.name} стала вдова ${spouse.name}`);
            return spouse;
        }

        // 5. Ищем любого мужчину по крови
        let maleRelatives = player.persons.filter(p => p.gender === "male" && p.isAlive === true && p.id !== deadRuler.id);
        maleRelatives.sort((a, b) => a.age - b.age);
        if (maleRelatives.length > 0) {
            this.addChronicle(`⚠️ Прямых наследников нет. Новым правителем становится ${maleRelatives[0].name} из боковой ветви`);
            return maleRelatives[0];
        }

        // 6. Любая старшая женщина
        let femaleRelatives = player.persons.filter(p => p.gender === "female" && p.isAlive === true && p.id !== deadRuler.id);
        femaleRelatives.sort((a, b) => a.age - b.age);
        if (femaleRelatives.length > 0) {
            let heiress = femaleRelatives[0];
            this.addChronicle(`⚠️ Наследницей Дома ${player.name} стала ${heiress.name}. Род ${player.name} прервётся.`);
            return heiress;
        }

        return null;
    }

    async checkPendingProposals() {
        let currentPlayer = this.players[this.currentPlayerIndex];

        let allCurrentPersons = [...currentPlayer.persons];
        if (currentPlayer.vassalHouses) {
            for (let vh of currentPlayer.vassalHouses) {
                allCurrentPersons.push(...vh.family);
            }
        }

        // Берем копию массива, чтобы не изменять его во время итерации
        let marriageProposals = [...this.pendingMarriageProposals];
        let processedProposals = [];

        for (let proposal of marriageProposals) {
            if (proposal.toPlayerId !== currentPlayer.id) continue;

            let fromPlayer = this.players.find(p => p.id === proposal.fromPlayerId);
            let targetPerson = allCurrentPersons.find(p => p.id === proposal.targetPersonId);

            if (!targetPerson || !targetPerson.isAlive) {
                this.addChronicle(`❌ Персона для брака из дома ${proposal.toHouseName} больше не доступна`);
                processedProposals.push(proposal);
                continue;
            }

            let message = `💍 Дом ${fromPlayer.name} предлагает брак между ${proposal.sourcePersonName} и ${targetPerson.name} (Дом ${proposal.toHouseName}). Принять?`;
            let accepted = await this.showConfirmModal("Предложение брака", message, null, null);

            if (accepted) {
                let sourcePerson = fromPlayer.persons.find(p => p.id === proposal.sourcePersonId);
                if (!sourcePerson && fromPlayer.vassalHouses) {
                    for (let vh of fromPlayer.vassalHouses) {
                        sourcePerson = vh.family.find(p => p.id === proposal.sourcePersonId);
                        if (sourcePerson) break;
                    }
                }
                if (sourcePerson && targetPerson) {
                    sourcePerson.spouseId = targetPerson.id;
                    sourcePerson.spouseName = `${targetPerson.name} (Дом ${proposal.toHouseName})`;
                    sourcePerson.isMarried = true;
                    targetPerson.spouseId = sourcePerson.id;
                    targetPerson.spouseName = `${sourcePerson.name} (Дом ${fromPlayer.name})`;
                    targetPerson.isMarried = true;
                    this.addChronicle(`💍 Заключён брак между ${sourcePerson.name} (Дом ${fromPlayer.name}) и ${targetPerson.name} (Дом ${proposal.toHouseName})`);
                    this.updateUI();
                }
            } else {
                this.addChronicle(`❌ Дом ${proposal.toHouseName} отклонил предложение о браке`);
            }
            processedProposals.push(proposal);
        }

        // Удаляем только обработанные предложения
        this.pendingMarriageProposals = this.pendingMarriageProposals.filter(p =>
            !processedProposals.some(pp => pp === p)
        );

        // Аналогично для оруженосцев
        let squireProposals = [...this.pendingSquireProposals];
        let processedSquire = [];

        for (let proposal of squireProposals) {
            if (proposal.toPlayerId !== currentPlayer.id) continue;

            let fromPlayer = this.players.find(p => p.id === proposal.fromPlayerId);
            let boy = fromPlayer.persons.find(p => p.id === proposal.boyId);
            if (boy && boy.isAlive) {
                let message = `🛡️ Дом ${proposal.fromHouseName || fromPlayer.name} предлагает отдать ${boy.name} в оруженосцы вам. Принять?`;
                let accepted = await this.showConfirmModal("Предложение оруженосца", message, null, null);
                if (accepted) {
                    boy.isSquire = true;
                    boy.squireYears = 0;
                    boy.knightChance = 30;
                    boy.servingTo = proposal.toHouseName;
                    boy.servingToId = currentPlayer.id;
                    this.addChronicle(`${boy.name} из Дома ${proposal.fromHouseName || fromPlayer.name} отправлен в оруженосцы к Дому ${proposal.toHouseName}`);
                    this.updateUI();
                } else {
                    this.addChronicle(`❌ Дом ${proposal.toHouseName} отклонил предложение об оруженосце`);
                }
            }
            processedSquire.push(proposal);
        }

        this.pendingSquireProposals = this.pendingSquireProposals.filter(p =>
            !processedSquire.some(ps => ps === p)
        );
    }

    endTurn() {
        let currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.hasEndedTurn = true;

        // Сохраняем состояние
        this.saveToStorage();

        let allEnded = this.players.every(p => p.hasEndedTurn === true);
        console.log("Все игроки завершили ход?", allEnded);

        if (allEnded) {
            // Проходят годы
            let years = Math.floor(Math.random() * 6) + 1;
            this.totalYears += years;
            this.currentTurn++;
            console.log(`Прошло лет: ${years}, Ход: ${this.currentTurn}`);

            // 1. Восстановление ресурсов
            for (let player of this.players) {
                for (let city of player.cities) {
                    city.gold = Math.min(city.gold + 1, city.strength);
                    city.army = Math.min(city.army + 1, city.strength);
                }
            }

            // 2. Старение персонажей
            for (let player of this.players) {
                for (let person of player.persons) {
                    if (person.isAlive) {
                        person.age += years;
                    }
                }
            }

            // И вызовите его в endTurn после старения:
            for (let player of this.players) {
                this.processKnighthood(player);
            }

            // В endTurn, после старения, добавьте:
            for (let player of this.players) {
                for (let person of player.persons) {
                    if (person.isSquire && !person.isKnight && person.isAlive && person.age >= 16) {
                        let chance = 35 + (person.squireYears * 10);
                        chance = Math.min(chance, 95);
                        let roll = Math.floor(Math.random() * 100) + 1;
                        if (roll <= chance) {
                            person.isKnight = true;
                            person.isSquire = false;
                            this.addChronicle(`⚔️ ${person.name} из Дома ${player.name} посвящён в рыцари!`);
                        }
                    }
                }
            }

            // 3. Рождение детей (ВАЖНО: вызываем для каждого игрока)
            for (let player of this.players) {
                this.processBirths(player);
            }

            // 4. Смерть и наследование (ВАЖНО: вызываем для каждого игрока)
            for (let player of this.players) {
                this.checkSuccession(player);
            }

            // 5. Сброс флагов
            for (let player of this.players) {
                player.hasEndedTurn = false;
            }

            // 6. Переключение на первого игрока
            this.currentPlayerIndex = 0;

            // 7. Проверка предложений (ВАЖНО: после переключения)
            this.checkPendingProposals();

            // 8. Запись в хронику
            this.addChronicle(`🌾 Наступил ход ${this.currentTurn}. Прошло ${years} ${years === 1 ? 'год' : (years < 5 ? 'года' : 'лет')}. Ресурсы восстановлены.`);

            // 9. Обновление интерфейса
            this.drawMap();
            this.updateUI();
            this.saveToStorage();

            document.getElementById("globalMsg").innerHTML = `✅ Ход ${this.currentTurn} начался. Ход игрока ${this.players[0].name}`;
        } else {
            // Переключение на следующего игрока
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            console.log(`Переключение на игрока: ${this.players[this.currentPlayerIndex].name}`);

            // Проверяем предложения для следующего игрока
            this.checkPendingProposals();

            this.drawMap();
            this.updateUI();
            this.saveToStorage();
            document.getElementById("globalMsg").innerHTML = `Ход игрока ${this.players[this.currentPlayerIndex].name}`;
        }
    }

    // ========== ДИПЛОМАТИЯ ==========

    showDiplomacy() {
        let currentPlayer = this.players[this.currentPlayerIndex];

        let html = `<div class="build-dialog">
        <h3>💍 Дипломатия - Дом ${currentPlayer.name}</h3>
        <p>Выберите действие:</p>
        <button id="marriageWithHouseBtn">💒 Брак с другим домом</button>
        <button id="marriageWithNobleBtn">👰 Женитьба на дворянке</button>
        <button id="closeDiplo">Закрыть</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("marriageWithHouseBtn").onclick = () => this.selectOwnPersonForMarriage();
        document.getElementById("marriageWithNobleBtn").onclick = () => this.marryNoblewoman();
        document.getElementById("closeDiplo").onclick = () => this.updateUI();
    }

    selectOwnPersonForMarriage() {
        let currentPlayer = this.players[this.currentPlayerIndex];

        // Собираем ВСЕ свои дома (уникальные, без дублирования)
        let myHouses = [];
        let houseNames = new Set();

        // Основная семья - только те, кто не принадлежит вассальным домам
        let mainFamilyPersons = currentPlayer.persons.filter(p => {
            if (!currentPlayer.vassalHouses) return true;
            for (let vh of currentPlayer.vassalHouses) {
                if (vh.family && vh.family.some(v => v.id === p.id)) return false;
            }
            if (currentPlayer.vassalFamily && currentPlayer.vassalFamily.some(v => v.id === p.id)) return false;
            return true;
        }).filter(p => !p.spouseId && p.age >= 16 && p.isAlive);

        if (mainFamilyPersons.length > 0) {
            myHouses.push({
                id: "main",
                name: currentPlayer.name,
                type: "main",
                persons: mainFamilyPersons
            });
            houseNames.add(currentPlayer.name);
        }

        // Начальный вассал
        if (currentPlayer.vassalFamily && currentPlayer.vassalFamily.length > 0) {
            let vassalPersons = currentPlayer.vassalFamily.filter(p => !p.spouseId && p.age >= 16 && p.isAlive);
            if (vassalPersons.length > 0 && !houseNames.has(currentPlayer.vassalHouseName || "Вассалы")) {
                myHouses.push({
                    id: "initial_vassal",
                    name: currentPlayer.vassalHouseName || "Вассалы",
                    type: "vassal",
                    persons: vassalPersons
                });
                houseNames.add(currentPlayer.vassalHouseName || "Вассалы");
            }
        }

        // Другие вассальные дома
        if (currentPlayer.vassalHouses) {
            for (let vh of currentPlayer.vassalHouses) {
                if (!houseNames.has(vh.houseName)) {
                    let vassalPersons = vh.family.filter(p => !p.spouseId && p.age >= 16 && p.isAlive);
                    if (vassalPersons.length > 0) {
                        myHouses.push({
                            id: vh.id,
                            name: vh.houseName,
                            type: "vassal",
                            persons: vassalPersons
                        });
                        houseNames.add(vh.houseName);
                    }
                }
            }
        }

        // Фильтруем дома, где есть доступные кандидаты
        myHouses = myHouses.filter(house => house.persons.length > 0);

        if (myHouses.length === 0) {
            alert("В ваших домах нет доступных для брака кандидатов");
            this.showDiplomacy();
            return;
        }

        // ШАГ 1: Выбор дома
        let html = `<div class="build-dialog">
        <h3>💍 Шаг 1: Выберите свой дом</h3>
        <p>Из какого дома будет жених/невеста?</p>
        <div id="myHousesList"></div>
        <button id="backToDiplo">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let housesDiv = document.getElementById("myHousesList");
        for (let house of myHouses) {
            housesDiv.innerHTML += `<div class="enemy-card" data-house-id="${house.id}" data-house-name="${house.name}">
            <b>🏰 ${house.name}</b> (${house.type === "main" ? "Основной дом" : "Вассальный дом"})<br>
            👤 Доступно: ${house.persons.length}
        </div>`;
        }

        document.querySelectorAll("[data-house-id]").forEach(card => {
            card.onclick = () => {
                let houseId = card.dataset.houseId;
                let selectedHouse = myHouses.find(h => h.id == houseId);
                if (selectedHouse) {
                    this.selectPersonFromHouse(selectedHouse);
                }
            };
        });

        document.getElementById("backToDiplo").onclick = () => this.showDiplomacy();
    }

    selectPersonFromHouse(house) {
        // ШАГ 2: Выбор конкретной персоны из выбранного дома
        let html = `<div class="build-dialog">
        <h3>💍 Шаг 2: Выберите ${house.type === "main" ? "члена семьи" : "вассала"}</h3>
        <p>Из дома: <strong>${house.name}</strong></p>
        <div id="personsList"></div>
        <button id="backToHouses">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let personsDiv = document.getElementById("personsList");
        for (let person of house.persons) {
            personsDiv.innerHTML += `<div class="family-member" data-person-id="${person.id}" data-person-name="${person.name}" data-person-gender="${person.gender}" data-person-house="${house.name}">
            ${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "Мужчина" : "Женщина"})
        </div>`;
        }

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let sourcePerson = {
                    id: parseFloat(el.dataset.personId),
                    name: el.dataset.personName,
                    gender: el.dataset.personGender,
                    houseName: el.dataset.personHouse
                };
                this.selectTargetHouseForMarriage(sourcePerson);
            };
        });

        document.getElementById("backToHouses").onclick = () => this.selectOwnPersonForMarriage();
    }

    selectTargetHouseForMarriage(sourcePerson) {
        let currentPlayer = this.players[this.currentPlayerIndex];

        // Собираем все дома (включая свои, исключая дом источника)
        let targetHouses = [];
        let houseNames = new Set();

        for (let player of this.players) {
            // Основной дом
            if (player.name !== sourcePerson.houseName) {
                let mainPersons = player.persons.filter(p => {
                    if (!player.vassalHouses) return true;
                    for (let vh of player.vassalHouses) {
                        if (vh.family && vh.family.some(v => v.id === p.id)) return false;
                    }
                    if (player.vassalFamily && player.vassalFamily.some(v => v.id === p.id)) return false;
                    return true;
                }).filter(p => !p.spouseId && p.age >= 16 && p.isAlive && p.gender !== sourcePerson.gender);

                if (mainPersons.length > 0 && !houseNames.has(player.name)) {
                    targetHouses.push({
                        id: player.id,
                        name: player.name,
                        type: "main",
                        player: player,
                        persons: mainPersons
                    });
                    houseNames.add(player.name);
                }
            }

            // Вассальные дома
            if (player.vassalFamily && player.vassalFamily.length > 0 && player.vassalHouseName !== sourcePerson.houseName) {
                let vassalPersons = player.vassalFamily.filter(p => !p.spouseId && p.age >= 16 && p.isAlive && p.gender !== sourcePerson.gender);
                if (vassalPersons.length > 0 && !houseNames.has(player.vassalHouseName)) {
                    targetHouses.push({
                        id: `vassal_${player.id}_initial`,
                        name: player.vassalHouseName || "Вассалы",
                        type: "vassal",
                        player: player,
                        persons: vassalPersons
                    });
                    houseNames.add(player.vassalHouseName);
                }
            }

            if (player.vassalHouses) {
                for (let vh of player.vassalHouses) {
                    if (vh.houseName !== sourcePerson.houseName && !houseNames.has(vh.houseName)) {
                        let vassalPersons = vh.family.filter(p => !p.spouseId && p.age >= 16 && p.isAlive && p.gender !== sourcePerson.gender);
                        if (vassalPersons.length > 0) {
                            targetHouses.push({
                                id: vh.id,
                                name: vh.houseName,
                                type: "vassal",
                                player: player,
                                persons: vassalPersons
                            });
                            houseNames.add(vh.houseName);
                        }
                    }
                }
            }
        }

        targetHouses = targetHouses.filter(h => h.persons.length > 0);

        if (targetHouses.length === 0) {
            alert("Нет доступных домов для брака");
            this.selectOwnPersonForMarriage();
            return;
        }

        let html = `<div class="build-dialog">
        <h3>💍 Шаг 2: Выберите дом будущего супруга</h3>
        <p>Ваша персона: <strong>${sourcePerson.name}</strong> (Дом ${sourcePerson.houseName})</p>
        <div id="housesList"></div>
        <button id="backToPersons">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let housesDiv = document.getElementById("housesList");
        for (let house of targetHouses) {
            housesDiv.innerHTML += `<div class="enemy-card" data-house-id="${house.id}" data-house-name="${house.name}" data-player-id="${house.player.id}">
            <b>🏰 ${house.name}</b> (${house.type === "main" ? "Основной дом" : "Вассальный дом"})<br>
            👤 Доступно: ${house.persons.length}
        </div>`;
        }

        document.querySelectorAll("[data-house-id]").forEach(card => {
            card.onclick = () => {
                let houseName = card.dataset.houseName;
                let targetPlayerId = parseInt(card.dataset.playerId);
                let targetPlayer = this.players.find(p => p.id === targetPlayerId);
                let targetHouse = targetHouses.find(h => h.name === houseName && h.player.id === targetPlayerId);
                if (targetHouse) {
                    this.selectTargetPersonForMarriage(sourcePerson, targetHouse);
                }
            };
        });

        document.getElementById("backToPersons").onclick = () => this.selectPersonFromHouse({ name: sourcePerson.houseName, persons: [] });
    }

    selectTargetPersonForMarriage(sourcePerson, targetHouse) {
        let html = `<div class="build-dialog">
        <h3>💍 Шаг 3: Выберите супруга из дома ${targetHouse.name}</h3>
        <p>Ваша персона: <strong>${sourcePerson.name}</strong> (Дом ${sourcePerson.houseName})</p>
        <div id="personsList"></div>
        <button id="backToHouses">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let personsDiv = document.getElementById("personsList");
        for (let person of targetHouse.persons) {
            personsDiv.innerHTML += `<div class="family-member" data-person-id="${person.id}" data-person-name="${person.name}">
            ${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "Мужчина" : "Женщина"})
        </div>`;
        }

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let targetPerson = {
                    id: parseFloat(el.dataset.personId),
                    name: el.dataset.personName
                };

                this.pendingMarriageProposals.push({
                    fromPlayerId: this.players[this.currentPlayerIndex].id,
                    toPlayerId: targetHouse.player.id,
                    toHouseType: targetHouse.type,
                    toHouseName: targetHouse.name,
                    sourcePersonId: sourcePerson.id,
                    sourcePersonName: sourcePerson.name,
                    sourcePersonHouse: sourcePerson.houseName,
                    targetPersonId: targetPerson.id,
                    targetPersonName: targetPerson.name
                });
                this.addChronicle(`💌 Дом ${this.players[this.currentPlayerIndex].name} предложил брак между ${sourcePerson.name} и ${targetPerson.name} дому ${targetHouse.name}. Ожидайте ответа.`);
                this.updateUI();
            };
        });

        document.getElementById("backToHouses").onclick = () => this.selectTargetHouseForMarriage(sourcePerson);
    }

    marryNoblewoman() {
        let currentPlayer = this.players[this.currentPlayerIndex];

        // Ищем мужчин для женитьбы (из всех своих домов)
        let availableMen = [];

        // Основная семья
        for (let person of currentPlayer.persons) {
            if (!person.spouseId && person.age >= 16 && person.isAlive && (person.role === "Король" || person.role === "Лорд" || person.role === "Сын" || person.role === "Брат")) {
                availableMen.push({
                    id: person.id,
                    name: person.name,
                    role: person.role,
                    houseName: currentPlayer.name,
                    cityId: person.rulingCityId
                });
            }
        }

        // Вассальные дома
        if (currentPlayer.vassalFamily) {
            for (let person of currentPlayer.vassalFamily) {
                if (!person.spouseId && person.age >= 16 && person.isAlive && (person.role === "Лорд" || person.role === "Сын" || person.role === "Брат")) {
                    availableMen.push({
                        id: person.id,
                        name: person.name,
                        role: person.role,
                        houseName: currentPlayer.vassalHouseName || "Вассалы",
                        cityId: null
                    });
                }
            }
        }

        if (currentPlayer.vassalHouses) {
            for (let vh of currentPlayer.vassalHouses) {
                for (let person of vh.family) {
                    if (!person.spouseId && person.age >= 16 && person.isAlive && (person.role === "Лорд" || person.role === "Сын" || person.role === "Брат")) {
                        availableMen.push({
                            id: person.id,
                            name: person.name,
                            role: person.role,
                            houseName: vh.houseName,
                            cityId: null
                        });
                    }
                }
            }
        }

        if (availableMen.length === 0) {
            alert("Нет доступных мужчин для женитьбы");
            this.showDiplomacy();
            return;
        }

        let html = `<div class="build-dialog">
        <h3>👰 Женитьба на дворянке - Выберите жениха</h3>
        <div id="menList"></div>
        <button id="backToDiplo">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let menDiv = document.getElementById("menList");
        for (let man of availableMen) {
            menDiv.innerHTML += `<div class="family-member" data-man-id="${man.id}" data-man-name="${man.name}" data-man-house="${man.houseName}" data-man-city="${man.cityId || ''}">
            ${man.name} (${man.role}, из дома ${man.houseName})
        </div>`;
        }

        document.querySelectorAll("[data-man-id]").forEach(el => {
            el.onclick = () => {
                let groom = {
                    id: parseFloat(el.dataset.manId),
                    name: el.dataset.manName,
                    houseName: el.dataset.manHouse,
                    cityId: el.dataset.manCity ? parseFloat(el.dataset.manCity) : null
                };
                this.createNoblewomanBride(groom);
            };
        });

        document.getElementById("backToDiplo").onclick = () => this.showDiplomacy();
    }

    createNoblewomanBride(groom) {
        let currentPlayer = this.players[this.currentPlayerIndex];

        let html = `<div class="build-dialog">
        <h3>👰 Создание дворянской невесты</h3>
        <p>Жених: <strong>${groom.name}</strong> (Дом ${groom.houseName})</p>
        <p>Введите имя невесты:</p>
        <input type="text" id="brideName" placeholder="Имя" value="Элинор" style="width:90%; padding:8px; margin:10px 0; border-radius:20px;">
        <p>Введите фамилию (название дома):</p>
        <input type="text" id="brideHouse" placeholder="Фамилия" value="Дворянка" style="width:90%; padding:8px; margin:10px 0; border-radius:20px;">
        <p>Возраст невесты:</p>
        <input type="number" id="brideAge" value="18" style="width:90%; padding:8px; margin:10px 0; border-radius:20px;">
        <button id="confirmNobleMarriageBtn">✅ Жениться</button>
        <button id="cancelNobleBtn">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("confirmNobleMarriageBtn").onclick = () => {
            let brideName = document.getElementById("brideName").value.trim() || "Элинор";
            let brideHouse = document.getElementById("brideHouse").value.trim() || "Дворянка";
            let brideAge = parseInt(document.getElementById("brideAge").value) || 18;

            let bride = new Person(Date.now() + Math.random(), brideName, "Супруга", brideAge, "female");

            // Находим жениха
            let groomPerson = null;
            for (let player of this.players) {
                groomPerson = player.persons.find(p => p.id === groom.id);
                if (groomPerson) break;
            }

            if (groomPerson) {
                // Добавляем невесту в ту же семью, где живёт жених
                // Определяем, к какой семье принадлежит жених
                let targetFamily = null;

                if (groomPerson.role === "Король" || groomPerson.role === "Лорд" || groomPerson.role === "Сын" || groomPerson.role === "Брат") {
                    if (currentPlayer.persons.some(p => p.id === groomPerson.id)) {
                        currentPlayer.persons.push(bride);
                        targetFamily = currentPlayer.name;
                    } else if (currentPlayer.vassalFamily && currentPlayer.vassalFamily.some(p => p.id === groomPerson.id)) {
                        currentPlayer.vassalFamily.push(bride);
                        currentPlayer.persons.push(bride);
                        targetFamily = currentPlayer.vassalHouseName;
                    } else if (currentPlayer.vassalHouses) {
                        for (let vh of currentPlayer.vassalHouses) {
                            if (vh.family.some(p => p.id === groomPerson.id)) {
                                vh.family.push(bride);
                                currentPlayer.persons.push(bride);
                                targetFamily = vh.houseName;
                                break;
                            }
                        }
                    }
                }

                groomPerson.spouseId = bride.id;
                groomPerson.spouseName = `${bride.name} (Дом ${brideHouse})`;
                groomPerson.isMarried = true;
                bride.spouseId = groomPerson.id;
                bride.spouseName = groomPerson.name;
                bride.isMarried = true;

                this.addChronicle(`💍 ${groom.name} (Дом ${groom.houseName}) женился на ${bride.name} из дома ${brideHouse}. Невеста поселилась в доме ${targetFamily}`);
            }
            this.updateUI();
        };

        document.getElementById("cancelNobleBtn").onclick = () => this.marryNoblewoman();
    }

    showMarriageWithHouse() {
        let currentPlayer = this.players[this.currentPlayerIndex];

        // Собираем ВСЕ дома (включая свои)
        let allHouses = [];

        for (let player of this.players) {
            // Основной дом
            allHouses.push({
                id: player.id,
                name: player.name,
                type: "main",
                player: player,
                persons: player.persons.filter(p => {
                    if (!player.vassalHouses) return true;
                    for (let vh of player.vassalHouses) {
                        if (vh.family && vh.family.some(v => v.id === p.id)) return false;
                    }
                    if (player.vassalFamily && player.vassalFamily.some(v => v.id === p.id)) return false;
                    return true;
                })
            });

            // Вассальные дома
            if (player.vassalFamily && player.vassalFamily.length > 0) {
                allHouses.push({
                    id: `vassal_${player.id}_initial`,
                    name: player.vassalHouseName || "Вассалы",
                    type: "vassal",
                    player: player,
                    persons: player.vassalFamily
                });
            }

            if (player.vassalHouses) {
                for (let vh of player.vassalHouses) {
                    allHouses.push({
                        id: vh.id,
                        name: vh.houseName,
                        type: "vassal",
                        player: player,
                        persons: vh.family
                    });
                }
            }
        }

        let html = `<div class="build-dialog">
        <h3>💍 Брак с другим домом - Шаг 1: Выберите свой дом</h3>
        <div id="myHousesList"></div>
        <button id="backToDiplo">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let myHouses = allHouses.filter(h => h.player.id === currentPlayer.id);
        let housesDiv = document.getElementById("myHousesList");
        for (let house of myHouses) {
            let availableCount = house.persons.filter(p => !p.spouseId && p.age >= 16 && p.isAlive && (p.role === "Король" || p.role === "Лорд" || p.role === "Сын" || p.role === "Брат")).length;
            housesDiv.innerHTML += `<div class="enemy-card" data-house-id="${house.id}" data-house-name="${house.name}">
            <b>🏰 ${house.name}</b><br>
            👤 Доступно для брака (мужчины): ${availableCount}
        </div>`;
        }

        document.querySelectorAll("[data-house-id]").forEach(card => {
            card.onclick = () => {
                let houseId = card.dataset.houseId;
                let houseName = card.dataset.houseName;
                let selectedHouse = myHouses.find(h => h.id == houseId);
                if (selectedHouse) {
                    this.selectGroomFromMyHouse(currentPlayer, selectedHouse, allHouses);
                }
            };
        });

        document.getElementById("backToDiplo").onclick = () => this.showDiplomacy();
    }

    selectGroomFromMyHouse(currentPlayer, myHouse, allHouses) {
        let availableMen = myHouse.persons.filter(p => !p.spouseId && p.age >= 16 && p.isAlive && (p.role === "Король" || p.role === "Лорд" || p.role === "Сын" || p.role === "Брат"));

        if (availableMen.length === 0) {
            alert(`В доме ${myHouse.name} нет доступных мужчин для брака`);
            this.showMarriageWithHouse();
            return;
        }

        let html = `<div class="build-dialog">
        <h3>💍 Брак - Шаг 2: Выберите жениха</h3>
        <p>Из дома: <strong>${myHouse.name}</strong></p>
        <div id="groomList"></div>
        <button id="backToHouses">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let personsDiv = document.getElementById("groomList");
        for (let person of availableMen) {
            personsDiv.innerHTML += `<div class="family-member" data-person-id="${person.id}" data-person-name="${person.name}" data-person-house="${myHouse.name}">
            ${person.name} (${person.role}, ${person.age} лет)
        </div>`;
        }

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let groom = {
                    id: parseFloat(el.dataset.personId),
                    name: el.dataset.personName,
                    houseName: el.dataset.personHouse
                };
                this.selectBrideFromHouse(currentPlayer, groom, allHouses.filter(h => h.player.id !== currentPlayer.id || h.name !== myHouse.name));
            };
        });

        document.getElementById("backToHouses").onclick = () => this.showMarriageWithHouse();
    }

    selectBrideFromHouse(currentPlayer, groom, targetHouses) {
        let html = `<div class="build-dialog">
        <h3>💍 Брак - Шаг 3: Выберите дом невесты</h3>
        <p>Жених: <strong>${groom.name}</strong> (Дом ${groom.houseName})</p>
        <div id="targetHousesList"></div>
        <button id="backToGroom">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let housesDiv = document.getElementById("targetHousesList");
        for (let house of targetHouses) {
            let availableCount = house.persons.filter(p => !p.spouseId && p.age >= 16 && p.isAlive && (p.role === "Дочь" || p.role === "Сестра" || p.role === "Супруга")).length;
            housesDiv.innerHTML += `<div class="enemy-card" data-house-id="${house.id}" data-house-name="${house.name}" data-player-id="${house.player.id}">
            <b>🏰 ${house.name}</b><br>
            👤 Доступно для брака (женщины): ${availableCount}
        </div>`;
        }

        document.querySelectorAll("[data-house-id]").forEach(card => {
            card.onclick = () => {
                let houseName = card.dataset.houseName;
                let targetPlayerId = parseInt(card.dataset.playerId);
                let targetPlayer = this.players.find(p => p.id === targetPlayerId);
                let targetHouse = targetHouses.find(h => h.name === houseName && h.player.id === targetPlayerId);
                if (targetHouse) {
                    this.selectBrideFromHousePersons(currentPlayer, groom, targetHouse);
                }
            };
        });

        document.getElementById("backToGroom").onclick = () => this.selectGroomFromMyHouse(currentPlayer, { name: groom.houseName, persons: [] }, []);
    }

    selectBrideFromHousePersons(currentPlayer, groom, targetHouse) {
        let availableWomen = targetHouse.persons.filter(p => !p.spouseId && p.age >= 16 && p.isAlive && (p.role === "Дочь" || p.role === "Сестра"));

        if (availableWomen.length === 0) {
            alert(`В доме ${targetHouse.name} нет доступных женщин для брака`);
            this.selectBrideFromHouse(currentPlayer, groom, [targetHouse]);
            return;
        }

        let html = `<div class="build-dialog">
        <h3>💍 Брак - Шаг 4: Выберите невесту</h3>
        <p>Жених: <strong>${groom.name}</strong> (Дом ${groom.houseName})</p>
        <p>Дом невесты: <strong>${targetHouse.name}</strong></p>
        <div id="brideList"></div>
        <button id="backToTargetHouses">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let personsDiv = document.getElementById("brideList");
        for (let person of availableWomen) {
            personsDiv.innerHTML += `<div class="family-member" data-person-id="${person.id}" data-person-name="${person.name}">
            ${person.name} (${person.role}, ${person.age} лет)
        </div>`;
        }

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let bride = {
                    id: parseFloat(el.dataset.personId),
                    name: el.dataset.personName
                };

                // Отправляем предложение
                this.pendingMarriageProposals.push({
                    fromPlayerId: currentPlayer.id,
                    toPlayerId: targetHouse.player.id,
                    toHouseType: targetHouse.type,
                    toHouseName: targetHouse.name,
                    sourcePersonId: groom.id,
                    sourcePersonName: groom.name,
                    sourcePersonHouse: groom.houseName,
                    targetPersonId: bride.id,
                    targetPersonName: bride.name
                });
                this.addChronicle(`💌 Дом ${currentPlayer.name} (${groom.houseName}) предложил брак между ${groom.name} и ${bride.name} дому ${targetHouse.name}. Ожидайте ответа.`);
                this.updateUI();
            };
        });

        document.getElementById("backToTargetHouses").onclick = () => this.selectBrideFromHouse(currentPlayer, groom, [targetHouse]);
    }

    showMarriageWithNoble() {
        let currentPlayer = this.players[this.currentPlayerIndex];

        let availableMen = currentPlayer.persons.filter(p => !p.spouseId && p.age >= 16 && p.isAlive && (p.role === "Король" || p.role === "Лорд" || p.role === "Сын" || p.role === "Брат"));

        if (availableMen.length === 0) {
            alert("Нет доступных мужчин для женитьбы");
            this.showDiplomacy();
            return;
        }

        let html = `<div class="build-dialog">
        <h3>👰 Женитьба на дворянке</h3>
        <p>Выберите жениха:</p>
        <div id="groomList"></div>
        <button id="backToDiplo">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let personsDiv = document.getElementById("groomList");
        for (let person of availableMen) {
            personsDiv.innerHTML += `<div class="family-member" data-person-id="${person.id}" data-person-name="${person.name}" data-person-house="${currentPlayer.name}">
            ${person.name} (${person.role}, ${person.age} лет)
        </div>`;
        }

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let groom = {
                    id: parseFloat(el.dataset.personId),
                    name: el.dataset.personName,
                    houseName: el.dataset.personHouse
                };
                this.createNobleBride(currentPlayer, groom);
            };
        });

        document.getElementById("backToDiplo").onclick = () => this.showDiplomacy();
    }

    createNobleBride(currentPlayer, groom) {
        let html = `<div class="build-dialog">
        <h3>👰 Создание дворянской невесты</h3>
        <p>Жених: <strong>${groom.name}</strong> (Дом ${groom.houseName})</p>
        <p>Введите имя невесты:</p>
        <input type="text" id="brideName" placeholder="Имя" value="Элинор" style="width:90%; padding:8px; margin:10px 0; border-radius:20px;">
        <p>Введите фамилию (название дома):</p>
        <input type="text" id="brideHouse" placeholder="Фамилия" value="Дворянка" style="width:90%; padding:8px; margin:10px 0; border-radius:20px;">
        <p>Возраст невесты:</p>
        <input type="number" id="brideAge" value="18" style="width:90%; padding:8px; margin:10px 0; border-radius:20px;">
        <button id="confirmNobleMarriageBtn">✅ Жениться</button>
        <button id="cancelNobleBtn">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("confirmNobleMarriageBtn").onclick = () => {
            let brideName = document.getElementById("brideName").value.trim() || "Элинор";
            let brideHouse = document.getElementById("brideHouse").value.trim() || "Дворянка";
            let brideAge = parseInt(document.getElementById("brideAge").value) || 18;

            // Создаём новую персону - невесту
            let bride = new Person(Date.now() + Math.random(), brideName, "Супруга", brideAge, "female");

            // Добавляем её в основную семью игрока
            currentPlayer.persons.push(bride);

            // Женим
            let groomPerson = currentPlayer.persons.find(p => p.id === groom.id);
            if (groomPerson) {
                groomPerson.spouseId = bride.id;
                groomPerson.spouseName = `${bride.name} (Дом ${brideHouse})`;
                groomPerson.isMarried = true;
                bride.spouseId = groomPerson.id;
                bride.spouseName = groomPerson.name;
                bride.isMarried = true;
            }

            this.addChronicle(`💍 ${groom.name} (Дом ${groom.houseName}) женился на ${bride.name} из дома ${brideHouse}`);
            this.updateUI();
        };

        document.getElementById("cancelNobleBtn").onclick = () => this.showDiplomacy();
    }

    selectPersonFromMyHouse(currentPlayer, myHouse) {
        let availablePersons = myHouse.persons.filter(p => !p.spouseId && p.age >= 16 && p.isAlive);

        if (availablePersons.length === 0) {
            alert(`В доме ${myHouse.name} нет доступных для брака кандидатов`);
            this.updateUI();
            return;
        }

        let html = `<div class="build-dialog">
            <h3>💍 Брак - Шаг 2: Выберите ${myHouse.type === "main" ? "члена семьи" : "вассала"}</h3>
            <p>Из дома: <strong>${myHouse.name}</strong></p>
            <div id="myPersonsList"></div>
            <button id="backToHouses">Назад</button>
            <button id="cancelSelection">Отмена</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let personsDiv = document.getElementById("myPersonsList");
        for (let person of availablePersons) {
            personsDiv.innerHTML += `<div class="family-member" data-person-id="${person.id}" data-person-name="${person.name}" data-person-gender="${person.gender}" data-person-role="${person.role}">
                ${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "Мужчина" : "Женщина"})
            </div>`;
        }

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let sourcePerson = {
                    id: parseFloat(el.dataset.personId),
                    name: el.dataset.personName,
                    gender: el.dataset.personGender,
                    role: el.dataset.personRole,
                    houseName: myHouse.name,
                    houseType: myHouse.type
                };
                this.selectTargetHouse(currentPlayer, sourcePerson);
            };
        });

        document.getElementById("backToHouses").onclick = () => this.showDiplomacy();
        document.getElementById("cancelSelection").onclick = () => this.updateUI();
    }

    selectTargetHouse(currentPlayer, sourcePerson) {
        let targetHouses = [];

        for (let player of this.players) {
            if (player.id === currentPlayer.id) continue;

            targetHouses.push({
                id: player.id,
                name: player.name,
                type: "main",
                player: player,
                persons: player.persons.filter(p => {
                    if (!player.vassalHouses) return true;
                    for (let vh of player.vassalHouses) {
                        if (vh.family && vh.family.some(v => v.id === p.id)) return false;
                    }
                    if (player.vassalFamily && player.vassalFamily.some(v => v.id === p.id)) return false;
                    return true;
                })
            });

            if (player.vassalFamily && player.vassalFamily.length > 0) {
                targetHouses.push({
                    id: `vassal_${player.id}_initial`,
                    name: player.vassalHouseName || "Вассалы",
                    type: "vassal",
                    player: player,
                    persons: player.vassalFamily
                });
            }

            if (player.vassalHouses) {
                for (let vh of player.vassalHouses) {
                    if (vh.houseName !== player.vassalHouseName) {
                        targetHouses.push({
                            id: vh.id,
                            name: vh.houseName,
                            type: "vassal",
                            player: player,
                            persons: vh.family
                        });
                    }
                }
            }
        }

        if (targetHouses.length === 0) {
            alert("Нет других домов для предложения брака");
            this.updateUI();
            return;
        }

        let html = `<div class="build-dialog">
            <h3>💍 Брак - Шаг 3: Выберите дом будущего супруга</h3>
            <p>Ваша персона: <strong>${sourcePerson.name}</strong> (${sourcePerson.role}, ${sourcePerson.gender === "male" ? "Мужчина" : "Женщина"})</p>
            <div id="targetHousesList"></div>
            <button id="backToPersons">Назад</button>
            <button id="cancelSelection">Отмена</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let housesDiv = document.getElementById("targetHousesList");
        for (let house of targetHouses) {
            let availableCount = house.persons.filter(p => !p.spouseId && p.age >= 16 && p.isAlive).length;
            housesDiv.innerHTML += `<div class="enemy-card" data-house-id="${house.id}" data-house-name="${house.name}" data-house-type="${house.type}" data-player-id="${house.player.id}">
                <b>🏰 ${house.name}</b> (${house.type === "main" ? "Основной дом" : "Вассальный дом"})<br>
                👤 Доступно для брака: ${availableCount}
            </div>`;
        }

        document.querySelectorAll("[data-house-id]").forEach(card => {
            card.onclick = () => {
                let houseId = card.dataset.houseId;
                let houseType = card.dataset.houseType;
                let targetPlayerId = parseInt(card.dataset.playerId);
                let targetPlayer = this.players.find(p => p.id === targetPlayerId);
                let houseName = card.dataset.houseName;

                let targetHouse = null;
                if (houseType === "main") {
                    targetHouse = {
                        name: targetPlayer.name,
                        persons: targetPlayer.persons.filter(p => {
                            if (!targetPlayer.vassalHouses) return true;
                            for (let vh of targetPlayer.vassalHouses) {
                                if (vh.family && vh.family.some(v => v.id === p.id)) return false;
                            }
                            if (targetPlayer.vassalFamily && targetPlayer.vassalFamily.some(v => v.id === p.id)) return false;
                            return true;
                        }),
                        type: "main",
                        player: targetPlayer
                    };
                } else {
                    let vh = null;
                    if (houseId.includes("initial")) {
                        vh = { family: targetPlayer.vassalFamily, houseName: targetPlayer.vassalHouseName };
                    } else {
                        vh = targetPlayer.vassalHouses?.find(v => v.id == houseId || v.houseName === houseName);
                    }
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
                    this.selectTargetPerson(currentPlayer, sourcePerson, targetHouse);
                }
            };
        });

        document.getElementById("backToPersons").onclick = () => this.selectPersonFromMyHouse(currentPlayer, { name: sourcePerson.houseName, type: sourcePerson.houseType, persons: [] });
        document.getElementById("cancelSelection").onclick = () => this.updateUI();
    }

    selectTargetPerson(currentPlayer, sourcePerson, targetHouse) {
        let availablePersons = targetHouse.persons.filter(p => !p.spouseId && p.age >= 16 && p.isAlive);

        if (availablePersons.length === 0) {
            alert(`В доме ${targetHouse.name} нет доступных для брака кандидатов`);
            this.updateUI();
            return;
        }

        let html = `<div class="build-dialog">
            <h3>💍 Брак - Шаг 4: Выберите супруга из дома ${targetHouse.name}</h3>
            <p>Ваша персона: <strong>${sourcePerson.name}</strong> (${sourcePerson.role}, ${sourcePerson.gender === "male" ? "Мужчина" : "Женщина"})</p>
            <div id="targetPersonsList"></div>
            <button id="backToTargetHouses">Назад</button>
            <button id="cancelSelection">Отмена</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let personsDiv = document.getElementById("targetPersonsList");
        for (let person of availablePersons) {
            personsDiv.innerHTML += `<div class="family-member" data-person-id="${person.id}" data-person-name="${person.name}" data-person-gender="${person.gender}">
                ${person.name} (${person.role}, ${person.age} лет, ${person.gender === "male" ? "Мужчина" : "Женщина"})
            </div>`;
        }

        document.querySelectorAll("[data-person-id]").forEach(el => {
            el.onclick = () => {
                let targetPerson = {
                    id: parseFloat(el.dataset.personId),
                    name: el.dataset.personName,
                    gender: el.dataset.personGender
                };

                if (sourcePerson.gender === targetPerson.gender) {
                    alert("❌ Брак между однополыми персонами невозможен!");
                    this.updateUI();
                    return;
                }

                this.pendingMarriageProposals.push({
                    fromPlayerId: currentPlayer.id,
                    toPlayerId: targetHouse.player.id,
                    toHouseType: targetHouse.type,
                    toHouseName: targetHouse.name,
                    sourcePersonId: sourcePerson.id,
                    sourcePersonName: sourcePerson.name,
                    sourcePersonHouse: sourcePerson.houseName,
                    targetPersonId: targetPerson.id,
                    targetPersonName: targetPerson.name
                });
                this.addChronicle(`💌 Дом ${currentPlayer.name} (${sourcePerson.houseName}) предложил брак между ${sourcePerson.name} и ${targetPerson.name} дому ${targetHouse.name}. Ожидайте ответа.`);
                this.updateUI();
            };
        });

        // В конце метода selectTargetPerson, после push, добавьте:
        console.log("Предложение отправлено!");
        console.log("Текущий массив предложений:", this.pendingMarriageProposals);

        document.getElementById("backToTargetHouses").onclick = () => this.selectTargetHouse(currentPlayer, sourcePerson);
        document.getElementById("cancelSelection").onclick = () => this.updateUI();
    }

    showSquireMenu() {
        let currentPlayer = this.players[this.currentPlayerIndex];
        let eligibleBoys = [];

        // Собираем всех мальчиков из всех домов игрока
        for (let person of currentPlayer.persons) {
            if (person.gender === "male" && !person.isSquire && !person.isKnight && person.age >= 12 && person.age < 16 && person.isAlive) {
                eligibleBoys.push({
                    id: person.id,
                    name: person.name,
                    age: person.age,
                    houseName: currentPlayer.name
                });
            }
        }

        if (currentPlayer.vassalFamily) {
            for (let person of currentPlayer.vassalFamily) {
                if (person.gender === "male" && !person.isSquire && !person.isKnight && person.age >= 12 && person.age < 16 && person.isAlive) {
                    eligibleBoys.push({
                        id: person.id,
                        name: person.name,
                        age: person.age,
                        houseName: currentPlayer.vassalHouseName || "Вассалы"
                    });
                }
            }
        }

        if (currentPlayer.vassalHouses) {
            for (let vh of currentPlayer.vassalHouses) {
                for (let person of vh.family) {
                    if (person.gender === "male" && !person.isSquire && !person.isKnight && person.age >= 12 && person.age < 16 && person.isAlive) {
                        eligibleBoys.push({
                            id: person.id,
                            name: person.name,
                            age: person.age,
                            houseName: vh.houseName
                        });
                    }
                }
            }
        }

        if (eligibleBoys.length === 0) {
            alert("Нет мальчиков от 12 до 16 лет, которых можно отдать в оруженосцы");
            return;
        }

        let html = `<div class="build-dialog">
        <h3>🛡️ Отдать в оруженосцы - Выберите мальчика</h3>
        <div id="boysList"></div>
        <button id="cancelSquire">Отмена</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let boysDiv = document.getElementById("boysList");
        for (let boy of eligibleBoys) {
            boysDiv.innerHTML += `<div class="family-member" data-boy-id="${boy.id}" data-boy-name="${boy.name}" data-boy-house="${boy.houseName}">
            ${boy.name} (${boy.age} лет) - Дом ${boy.houseName}
        </div>`;
        }

        document.querySelectorAll("[data-boy-id]").forEach(el => {
            el.onclick = () => {
                let boyId = parseFloat(el.dataset.boyId);
                let boyName = el.dataset.boyName;
                let boyHouse = el.dataset.boyHouse;
                this.selectLordForSquireUniversal(currentPlayer, boyId, boyName, boyHouse);
            };
        });

        document.getElementById("cancelSquire").onclick = () => this.updateUI();
    }

    selectLordForSquireUniversal(currentPlayer, boyId, boyName, boyHouse) {
        let targetHouses = [];

        for (let player of this.players) {
            if (player.id === currentPlayer.id && player.name === boyHouse) continue;

            targetHouses.push({
                id: player.id,
                name: player.name,
                type: "main",
                player: player
            });

            if (player.vassalFamily && player.vassalFamily.length > 0 && (player.id !== currentPlayer.id || player.vassalHouseName !== boyHouse)) {
                targetHouses.push({
                    id: `vassal_${player.id}_initial`,
                    name: player.vassalHouseName || "Вассалы",
                    type: "vassal",
                    player: player
                });
            }

            if (player.vassalHouses) {
                for (let vh of player.vassalHouses) {
                    if (vh.houseName !== boyHouse) {
                        targetHouses.push({
                            id: vh.id,
                            name: vh.houseName,
                            type: "vassal",
                            player: player
                        });
                    }
                }
            }
        }

        if (targetHouses.length === 0) {
            alert("Нет доступных домов для отправки в оруженосцы");
            this.showSquireMenu();
            return;
        }

        let html = `<div class="build-dialog">
        <h3>🛡️ Выберите дом для службы ${boyName}</h3>
        <div id="housesList"></div>
        <button id="backToBoys">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let housesDiv = document.getElementById("housesList");
        for (let house of targetHouses) {
            housesDiv.innerHTML += `<div class="enemy-card" data-house-id="${house.id}" data-house-name="${house.name}" data-player-id="${house.player.id}">
            <b>🏰 Дом ${house.name}</b> (${house.type === "main" ? "Основной дом" : "Вассальный дом"})
        </div>`;
        }

        document.querySelectorAll("[data-house-id]").forEach(card => {
            card.onclick = () => {
                let houseName = card.dataset.houseName;
                let targetPlayerId = parseInt(card.dataset.playerId);
                let targetPlayer = this.players.find(p => p.id === targetPlayerId);

                this.pendingSquireProposals.push({
                    fromPlayerId: currentPlayer.id,
                    toPlayerId: targetPlayerId,
                    boyId: boyId,
                    boyName: boyName,
                    toHouseName: houseName,
                    fromHouseName: boyHouse
                });
                this.addChronicle(`📨 Дом ${boyHouse} предложил отдать ${boyName} в оруженосцы дому ${houseName}. Ожидайте ответа.`);
                this.updateUI();
            };
        });

        document.getElementById("backToBoys").onclick = () => this.showSquireMenu();
    }

    selectLordForSquireImproved(currentPlayer, boy) {
        // Собираем все дома (кроме дома мальчика)
        let targetHouses = [];

        for (let player of this.players) {
            if (player.id === currentPlayer.id) continue;

            // Основной дом
            targetHouses.push({
                id: player.id,
                name: player.name,
                type: "main",
                player: player
            });

            // Вассальные дома
            if (player.vassalFamily && player.vassalFamily.length > 0) {
                targetHouses.push({
                    id: `vassal_${player.id}_initial`,
                    name: player.vassalHouseName || "Вассалы",
                    type: "vassal",
                    player: player
                });
            }

            if (player.vassalHouses) {
                for (let vh of player.vassalHouses) {
                    targetHouses.push({
                        id: vh.id,
                        name: vh.houseName,
                        type: "vassal",
                        player: player
                    });
                }
            }
        }

        if (targetHouses.length === 0) {
            alert("Нет других домов для отправки в оруженосцы");
            this.updateUI();
            return;
        }

        let html = `<div class="build-dialog">
        <h3>🛡️ Отдать в оруженосцы - Шаг 2: Выберите дом</h3>
        <p>Мальчик: <strong>${boy.name}</strong></p>
        <div id="housesList"></div>
        <button id="backToBoys">Назад</button>
    </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        let housesDiv = document.getElementById("housesList");
        for (let house of targetHouses) {
            housesDiv.innerHTML += `<div class="enemy-card" data-house-id="${house.id}" data-house-name="${house.name}" data-player-id="${house.player.id}">
            <b>🏰 Дом ${house.name}</b> (${house.type === "main" ? "Основной дом" : "Вассальный дом"})
        </div>`;
        }

        document.querySelectorAll("[data-house-id]").forEach(card => {
            card.onclick = () => {
                let houseName = card.dataset.houseName;
                let targetPlayerId = parseInt(card.dataset.playerId);
                let targetPlayer = this.players.find(p => p.id === targetPlayerId);

                this.pendingSquireProposals.push({
                    fromPlayerId: currentPlayer.id,
                    toPlayerId: targetPlayerId,
                    boyId: boy.id,
                    boyName: boy.name,
                    toHouseName: houseName
                });
                this.addChronicle(`📨 Дом ${currentPlayer.name} предложил отдать ${boy.name} в оруженосцы дому ${houseName}. Ожидайте ответа.`);
                this.updateUI();
            };
        });

        document.getElementById("backToBoys").onclick = () => this.showSquireMenu();
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

    // ========== СОЗДАНИЕ ИГРЫ ==========

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
            setTimeout(() => this.askCityName(), 800);
        };
    }

    askCityName() {
        let defaultName = `${this.currentCreatingPlayer.name}холд`;
        let html = `<div class="build-dialog">
            <h3>🏰 Название столицы</h3>
            <p>Придумайте название для вашего главного города</p>
            <input type="text" id="cityNameInput" placeholder="Название города" value="${defaultName}" style="width:90%; padding:10px; margin:10px 0; border-radius:20px;">
            <button id="confirmCityNameBtn">Подтвердить</button>
        </div>`;
        document.getElementById("dynamicContent").innerHTML = html;

        document.getElementById("confirmCityNameBtn").onclick = () => {
            let cityName = document.getElementById("cityNameInput").value.trim();
            if (cityName === "") {
                cityName = defaultName;
            }
            this.pendingCityName = cityName;
            this.createFamily();
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
        let cityName = this.pendingCityName || `${this.currentCreatingPlayer.name}холд`;

        let html = `<h3>Семья Дома ${this.currentCreatingPlayer.name}</h3>
                <p><small>Город будет называться: <strong>${cityName}</strong></small></p>
                <p><small>Пол назначается автоматически в зависимости от роли</small></p>`;
        for (let i = 0; i < count; i++) {
            let defaultRole = i === 0 ? "Лорд" : this.ROLES[Math.floor(Math.random() * this.ROLES.length)];
            let defaultAge = i === 0 ? 35 : 20 + i * 5;
            html += `<div class="member-input">
            <strong>Член ${i + 1}</strong>
            <input type="text" id="name_${i}" placeholder="Имя" value="${this.getDefaultName(i)}">
            <select id="role_${i}" class="role-select">
                ${this.ROLES.map(r => `<option value="${r}" ${r === defaultRole ? "selected" : ""}>${r}</option>`).join("")}
            </select>
            <input type="number" id="age_${i}" value="${defaultAge}" style="width:60px" placeholder="Возраст">
            <span id="gender_display_${i}" style="width:60px; display:inline-block;">👤</span>
        </div>`;
        }
        html += `<button id="saveFamilyBtn">Сохранить семью</button>`;
        document.getElementById("dynamicContent").innerHTML = html;

        // Функция обновления пола
        const updateGender = (idx) => {
            let role = document.getElementById(`role_${idx}`).value;
            let genderDisplay = document.getElementById(`gender_display_${idx}`);
            if (role === "Король" || role === "Лорд" || role === "Сын" || role === "Брат") {
                genderDisplay.innerHTML = "♂ Мужской";
            } else {
                genderDisplay.innerHTML = "♀ Женский";
            }
        };

        for (let i = 0; i < count; i++) {
            document.getElementById(`role_${i}`).onchange = () => updateGender(i);
            updateGender(i);
        }

        document.getElementById("saveFamilyBtn").onclick = () => {
            let persons = [];
            for (let i = 0; i < count; i++) {
                let name = document.getElementById(`name_${i}`).value.trim() || `Член ${i + 1}`;
                let role = document.getElementById(`role_${i}`).value;
                let age = parseInt(document.getElementById(`age_${i}`).value) || (i === 0 ? 35 : 20 + i * 5);
                let gender = (role === "Король" || role === "Лорд" || role === "Сын" || role === "Брат") ? "male" : "female";
                persons.push(new Person(Date.now() + Math.random() + i, name, role, age, gender));
            }

            // Находим Лорда/Короля и Супругу
            let lord = persons.find(p => p.role === "Лорд" && p.gender === "male");
            let king = persons.find(p => p.role === "Король" && p.gender === "male");
            let ruler = king || lord;
            let spouse = persons.find(p => p.role === "Супруга" && p.gender === "female");

            if (ruler && spouse) {
                ruler.spouseId = spouse.id;
                ruler.spouseName = spouse.name;
                ruler.isMarried = true;
                spouse.spouseId = ruler.id;
                spouse.spouseName = ruler.name;
                spouse.isMarried = true;
            }

            this.currentCreatingPlayer.persons = persons;
            this.currentCreatingPlayer.lordCityName = cityName;
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
        let defaultVassalCityName = `${vassalHouseName} замок`;

        let html = `<h3>Семья вассала ${vassalHouseName}</h3>
                <p>Название города вассала:</p>
                <input type="text" id="vassalCityNameInput" placeholder="Название города" value="${defaultVassalCityName}" style="width:90%; padding:8px; margin:10px 0; border-radius:20px;">
                <p><small>Пол назначается автоматически в зависимости от роли</small></p>`;

        let vassalRoles = ["Лорд", "Супруга", "Сын", "Дочь", "Брат", "Сестра"];

        for (let i = 0; i < count; i++) {
            let defaultRole = i === 0 ? "Лорд" : vassalRoles[Math.floor(Math.random() * vassalRoles.length)];
            let defaultAge = i === 0 ? 35 : 20 + i * 5;
            html += `<div class="member-input">
            <strong>Член ${i + 1}</strong>
            <input type="text" id="vassal_name_${i}" placeholder="Имя" value="${this.getDefaultName(i)}">
            <select id="vassal_role_${i}" class="role-select">
                ${vassalRoles.map(r => `<option value="${r}" ${r === defaultRole ? "selected" : ""}>${r}</option>`).join("")}
            </select>
            <input type="number" id="vassal_age_${i}" value="${defaultAge}" style="width:60px" placeholder="Возраст">
            <span id="vassal_gender_display_${i}" style="width:60px; display:inline-block;">👤</span>
        </div>`;
        }
        html += `<button id="saveVassalFamilyBtn">Сохранить семью вассала</button>`;
        document.getElementById("dynamicContent").innerHTML = html;

        const updateGender = (idx) => {
            let role = document.getElementById(`vassal_role_${idx}`).value;
            let genderDisplay = document.getElementById(`vassal_gender_display_${idx}`);
            if (role === "Лорд" || role === "Сын" || role === "Брат") {
                genderDisplay.innerHTML = "♂ Мужской";
            } else {
                genderDisplay.innerHTML = "♀ Женский";
            }
        };

        for (let i = 0; i < count; i++) {
            let roleSelect = document.getElementById(`vassal_role_${i}`);
            if (roleSelect) {
                roleSelect.onchange = () => updateGender(i);
                updateGender(i);
            }
        }

        document.getElementById("saveVassalFamilyBtn").onclick = () => {
            console.log("Сохранение семьи вассала, количество членов:", count);

            let vassalPersons = [];
            for (let i = 0; i < count; i++) {
                let nameInput = document.getElementById(`vassal_name_${i}`);
                let roleSelect = document.getElementById(`vassal_role_${i}`);
                let ageInput = document.getElementById(`vassal_age_${i}`);
                let genderDisplay = document.getElementById(`vassal_gender_display_${i}`);

                let name = nameInput ? nameInput.value.trim() : `Член ${i + 1}`;
                let role = roleSelect ? roleSelect.value : (i === 0 ? "Лорд" : "Дочь");
                let age = ageInput ? parseInt(ageInput.value) : (i === 0 ? 35 : 20 + i * 5);
                let gender = (role === "Лорд" || role === "Сын" || role === "Брат") ? "male" : "female";

                console.log(`Вассал ${i + 1}: имя=${name}, роль=${role}, возраст=${age}, пол=${gender}`);
                vassalPersons.push(new Person(Date.now() + Math.random() + i + 100, name, role, age, gender));
            }

            // Находим Лорда и Супругу у вассалов
            let lord = vassalPersons.find(p => p.role === "Лорд" && p.gender === "male");
            let spouse = vassalPersons.find(p => p.role === "Супруга" && p.gender === "female");
            if (lord && spouse) {
                lord.spouseId = spouse.id;
                lord.spouseName = spouse.name;
                lord.isMarried = true;
                spouse.spouseId = lord.id;
                spouse.spouseName = lord.name;
                spouse.isMarried = true;
                console.log(`Вассальный брак: ${lord.name} и ${spouse.name}`);
            }

            let lordHexObj = this.hexes.find(h => h.row === this.selectedLordHex.row && h.col === this.selectedLordHex.col);
            let vassalHexObj = this.hexes.find(h => h.row === this.selectedVassalHex.row && h.col === this.selectedVassalHex.col);

            console.log("lordHexObj:", lordHexObj);
            console.log("vassalHexObj:", vassalHexObj);
            console.log("pendingCityStrength:", this.pendingCityStrength);

            let lordCityName = this.currentCreatingPlayer.lordCityName || `${this.currentCreatingPlayer.name}холд`;
            let vassalCityNameInput = document.getElementById("vassalCityNameInput");
            let vassalCityName = vassalCityNameInput ? vassalCityNameInput.value.trim() : defaultVassalCityName;

            let lordCity = new City(Date.now(), lordHexObj.row, lordHexObj.col, lordCityName, this.pendingCityStrength, this.currentCreatingPlayer.id, "normal", null);
            lordCity.gold = this.pendingCityStrength;
            lordCity.army = this.pendingCityStrength;
            lordCity.isStartCity = true;

            let vassalStrength = Math.max(1, this.pendingCityStrength - 1);
            let vassalCity = new City(Date.now() + 1, vassalHexObj.row, vassalHexObj.col, vassalCityName, vassalStrength, this.currentCreatingPlayer.id, "normal", null);
            vassalCity.gold = vassalStrength;
            vassalCity.army = vassalStrength;
            vassalCity.isStartCity = true;

            this.currentCreatingPlayer.cities = [lordCity, vassalCity];
            this.currentCreatingPlayer.lordStrength = this.pendingCityStrength;
            this.currentCreatingPlayer.vassalHouseName = vassalHouseName;
            this.currentCreatingPlayer.vassalFamily = vassalPersons;

            let allPersons = [...this.currentCreatingPlayer.persons, ...vassalPersons];
            this.currentCreatingPlayer.persons = allPersons;

            this.addChronicle(`Дом ${this.currentCreatingPlayer.name} создан. Столица: ${lordCity.name} (сила ${this.pendingCityStrength}), Вассал: ${vassalHouseName} (${vassalCity.name}, сила ${vassalStrength})`);

            console.log("Переход к следующему игроку");
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

        this.closeModal();

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