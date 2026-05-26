let state = {
  userTeam: "BAL",
  rounds: 3,
  order: [],
  current: 0,
  prospects: [],
  completed: [],
  tab: "ALL",
  trades: [],
  selectedPlayerIndex: null
};

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

function getTeam(abbr) {
  return TEAMS.find(t => t.abbr === abbr);
}

function pickValue(pick) {
  const slot = ((pick - 1) % 32) + 1;
  return PICK_VALUE[slot] || Math.max(1, 600 - pick * 4);
}

function currentPickNumber() {
  return state.current + 1;
}

function currentRound() {
  return Math.floor(state.current / 32) + 1;
}

function currentTeam() {
  return state.order[state.current];
}

function buildOrder() {
  state.order = [];
  for (let i = 0; i < state.rounds; i++) {
    state.order.push(...DEFAULT_ORDER);
  }
}

function init() {
  state.prospects = clone(PROSPECTS);
  buildOrder();
  render();
}

function restart() {
  state.userTeam = document.getElementById("teamSelect").value;
  state.rounds = Number(document.getElementById("roundSelect").value);
  state.current = 0;
  state.completed = [];
  state.trades = [];
  state.prospects = clone(PROSPECTS);
  buildOrder();
  render();
}

function cpuPick() {
  if (state.current >= state.order.length) return;

  const t = getTeam(currentTeam());
  const needs = t.needs;
  let idx = state.prospects.findIndex(p => needs.includes(p.pos));

  if (idx === -1 || Math.random() < 0.35) idx = 0;

  makePick(idx, true);
}

function simToUser() {
  while (state.current < state.order.length && currentTeam() !== state.userTeam) {
    cpuPick();
  }
  render();
}

function finishDraft() {
  while (state.current < state.order.length) {
    cpuPick();
  }
  render();
}

function makePick(index, cpu = false) {
  if (!state.prospects[index]) return;

  const player = state.prospects.splice(index, 1)[0];

  state.completed.push({
    pick: currentPickNumber(),
    round: currentRound(),
    team: currentTeam(),
    player,
    cpu
  });

  state.current++;
  closeProfile();

  if (!cpu) simToUser();
}

function autoPick() {
  const t = getTeam(state.userTeam);
  let idx = state.prospects.findIndex(p => t.needs.includes(p.pos));
  if (idx === -1) idx = 0;
  makePick(idx, false);
}

function setTab(tab) {
  state.tab = tab;
  render();
}

function visibleProspects() {
  const q = (document.getElementById("searchBox")?.value || "").toLowerCase();
  return state.prospects.filter(p => {
    const tabMatch = state.tab === "ALL" || p.pos === state.tab;
    const searchMatch = `${p.name} ${p.school} ${p.pos}`.toLowerCase().includes(q);
    return tabMatch && searchMatch;
  });
}

function getFit(player, abbr = state.userTeam) {
  const t = getTeam(abbr);
  const needs = t.needs || [];
  const pick = currentPickNumber();

  let valueScore = 0;
  const valueGap = player.rank - pick;

  if (needs.includes(player.pos)) valueScore += 45;
  if (valueGap <= -8) valueScore += 35;
  else if (valueGap <= 4) valueScore += 25;
  else if (valueGap <= 15) valueScore += 10;
  else valueScore -= 10;

  if (player.grade >= 92) valueScore += 15;
  else if (player.grade >= 86) valueScore += 8;

  let label = "Low Fit";
  let css = "fit-low";
  let text = `${t.name} could draft ${player.name}, but ${player.pos} is not one of their listed top needs and the value may depend on board context.`;

  if (valueScore >= 70) {
    label = "Elite Fit";
    css = "fit-elite";
    text = `${player.name} is an excellent fit for ${t.name}. He addresses a major team need at ${player.pos} while also giving strong value at this point in the draft.`;
  } else if (valueScore >= 45) {
    label = "Good Fit";
    css = "fit-good";
    text = `${player.name} is a strong fit for ${t.name}. The position lines up reasonably well with the team's needs and the value is solid.`;
  }

  return { label, css, text };
}

function valueTag(player) {
  const gap = player.rank - currentPickNumber();

  if (gap <= -10) return `<span class="steal">STEAL</span>`;
  if (gap >= 18) return `<span class="reach">REACH</span>`;
  return `<span class="small">Fair Value</span>`;
}

function gradeDraft() {
  const picks = state.completed.filter(p => p.team === state.userTeam);
  if (!picks.length) return "N/A";

  const needs = getTeam(state.userTeam).needs;
  let score = 0;

  picks.forEach(p => {
    let value = 100 - Math.abs(p.player.rank - p.pick) * 1.5;
    if (needs.includes(p.player.pos)) value += 8;
    score += value;
  });

  const avg = score / picks.length;

  if (avg >= 104) return "A+";
  if (avg >= 96) return "A";
  if (avg >= 90) return "A-";
  if (avg >= 84) return "B+";
  if (avg >= 78) return "B";
  if (avg >= 72) return "B-";
  return "C+";
}

function shareText() {
  const picks = state.completed.filter(p => p.team === state.userTeam);
  const team = getTeam(state.userTeam);

  if (!picks.length) return "Your mock draft results will appear here.";

  return `LBHT Mock Draft Result
Team: ${team.name}
Grade: ${gradeDraft()}

${picks.map(p => `Pick ${p.pick}: ${p.player.name}, ${p.player.pos}, ${p.player.school}`).join("\n")}

Run your own mock at lbhtshow.com`;
}

function copyShare() {
  navigator.clipboard.writeText(shareText());
  alert("Mock draft copied!");
}

function openProfile(index) {
  state.selectedPlayerIndex = index;
  renderProfile();
  document.getElementById("profileModal").style.display = "block";
}

function closeProfile() {
  const modal = document.getElementById("profileModal");
  if (modal) modal.style.display = "none";
  state.selectedPlayerIndex = null;
}

function renderProfile() {
  const p = state.prospects[state.selectedPlayerIndex];
  if (!p) return;

  const t = getTeam(state.userTeam);
  const fit = getFit(p);
  const canPick = currentTeam() === state.userTeam;

  document.getElementById("profileContent").innerHTML = `
    <div class="profile-top">
      <div>
        <div class="profile-name">${p.name}</div>
        <div class="profile-sub">${p.pos} • ${p.school} • Rank #${p.rank} • ${p.projection}</div>
        <div class="profile-sub">Player comparison: ${p.comparison}</div>
      </div>
      <div class="profile-grade">
        Grade<br>
        <span style="font-size:26px;">${p.grade}</span>
      </div>
    </div>

    <div class="profile-grid">
      <div class="profile-box">
        <h3>Scouting Summary</h3>
        <p class="small">${p.summary}</p>
        <p>${valueTag(p)}</p>
      </div>

      <div class="profile-box">
        <h3>Draft Fit For ${t.name}</h3>
        <p class="${fit.css}">${fit.label}</p>
        <p class="small">${fit.text}</p>
      </div>

      <div class="profile-box">
        <h3>Strengths</h3>
        <ul>${p.strengths.map(x => `<li>${x}</li>`).join("")}</ul>
      </div>

      <div class="profile-box">
        <h3>Weaknesses</h3>
        <ul>${p.weaknesses.map(x => `<li>${x}</li>`).join("")}</ul>
      </div>
    </div>

    <div class="btn-row" style="margin-top:14px;">
      <button onclick="makePick(${state.selectedPlayerIndex}, false)" ${canPick ? "" : "disabled"}>
        Draft Player
      </button>
      <button class="secondary" onclick="closeProfile()">Close</button>
    </div>
  `;
}

function openTrade() {
  document.getElementById("tradeModal").style.display = "block";
  renderTradeModal();
}

function closeTrade() {
  document.getElementById("tradeModal").style.display = "none";
}

function renderTradeModal() {
  const otherTeams = TEAMS.filter(t => t.abbr !== state.userTeam);

  document.getElementById("tradeTeam").innerHTML = otherTeams
    .map(t => `<option value="${t.abbr}">${t.name}</option>`)
    .join("");

  updateTradeReceive();
}

function updateTradeReceive() {
  const target = document.getElementById("tradeTeam").value;

  const myPicks = state.order
    .map((abbr, i) => ({ abbr, pick: i + 1 }))
    .filter(x => x.abbr === state.userTeam && x.pick > currentPickNumber());

  const theirPicks = state.order
    .map((abbr, i) => ({ abbr, pick: i + 1 }))
    .filter(x => x.abbr === target && x.pick >= currentPickNumber());

  document.getElementById("givePicks").innerHTML = myPicks
    .map(x => `<label class="check"><input type="checkbox" value="${x.pick}" onchange="tradeMath()"> Pick ${x.pick}</label>`)
    .join("");

  document.getElementById("receivePicks").innerHTML = theirPicks
    .slice(0, 10)
    .map(x => `<label class="check"><input type="checkbox" value="${x.pick}" onchange="tradeMath()"> Pick ${x.pick}</label>`)
    .join("");

  tradeMath();
}

function checked(id) {
  return [...document.querySelectorAll(`#${id} input:checked`)].map(x => Number(x.value));
}

function tradeMath() {
  const give = checked("givePicks");
  const receive = checked("receivePicks");

  const giveValue = give.reduce((s, p) => s + pickValue(p), 0);
  const receiveValue = receive.reduce((s, p) => s + pickValue(p), 0);
  const diff = receiveValue - giveValue;

  let verdict = "Select picks to calculate value.";
  if (give.length && receive.length) {
    verdict = Math.abs(diff) < 80 ? "Fair deal" : diff > 0 ? "You are winning this trade" : "Other team is winning this trade";
  }

  document.getElementById("tradeMath").innerHTML =
    `<strong>${verdict}</strong><br>You give: ${giveValue} pts | You receive: ${receiveValue} pts`;
}

function acceptTrade() {
  const target = document.getElementById("tradeTeam").value;
  const give = checked("givePicks");
  const receive = checked("receivePicks");

  if (!give.length || !receive.length) {
    alert("Select picks from both sides.");
    return;
  }

  give.forEach(p => state.order[p - 1] = target);
  receive.forEach(p => state.order[p - 1] = state.userTeam);

  state.trades.push(`${getTeam(state.userTeam).name} received pick(s) ${receive.join(", ")} from ${getTeam(target).name} for pick(s) ${give.join(", ")}.`);

  closeTrade();
  render();
}

function render() {
  const user = getTeam(state.userTeam);
  const onClock = state.current < state.order.length ? getTeam(currentTeam()) : null;

  document.getElementById("app").innerHTML = `
    <div class="header">
      <div>
        <h1>LBHT NFL Draft Simulator</h1>
        <p>Make picks, trade up/down, build your team, and share your mock.</p>
      </div>
      <div class="pill">● LBHT Draft War Room</div>
    </div>

    <div class="layout">
      <aside class="panel">
        <h2>Setup</h2>

        <label>Select Team</label>
        <select id="teamSelect">
          ${TEAMS.map(t => `<option value="${t.abbr}" ${t.abbr === state.userTeam ? "selected" : ""}>${t.name}</option>`).join("")}
        </select>

        <label>Rounds</label>
        <select id="roundSelect">
          <option value="1" ${state.rounds === 1 ? "selected" : ""}>1 Round</option>
          <option value="3" ${state.rounds === 3 ? "selected" : ""}>3 Rounds</option>
          <option value="7" ${state.rounds === 7 ? "selected" : ""}>7 Rounds</option>
        </select>

        <button onclick="restart()" style="width:100%;">Start / Restart</button>

        <div class="btn-row">
          <button class="secondary" onclick="simToUser()">Sim To Pick</button>
          <button class="secondary" onclick="finishDraft()">Finish</button>
        </div>

        <div class="team-card">
          <img class="logo" src="${user.logo}" />
          <div>
            <strong>${user.name}</strong>
            <div class="small">Current team</div>
          </div>
        </div>

        <div class="needs">
          ${user.needs.map(n => `<span class="chip">${n}</span>`).join("")}
        </div>

        <button onclick="openTrade()" style="width:100%;">Propose Trade</button>

        <h2 style="margin-top:16px;">Draft Order</h2>
        <div class="list">
          ${state.order.map((abbr, i) => {
            const t = getTeam(abbr);
            const made = state.completed.find(p => p.pick === i + 1);
            return `
              <div class="pick ${i === state.current ? "active-pick" : ""}">
                <strong>${i + 1}. ${abbr}</strong>
                <div class="small">${made ? `${made.player.name} - ${made.player.pos}` : `Round ${Math.floor(i / 32) + 1}`}</div>
              </div>
            `;
          }).join("")}
        </div>
      </aside>

      <main class="panel">
        ${onClock ? `
          <div class="clock">
            <div class="clock-left">
              <img class="logo" src="${onClock.logo}" />
              <div>
                <strong>Pick ${currentPickNumber()} - Round ${currentRound()}</strong>
                <div class="small">${onClock.name} are on the clock</div>
              </div>
            </div>
            <button onclick="autoPick()" ${currentTeam() === state.userTeam ? "" : "disabled"}>Auto Pick</button>
          </div>
        ` : `<div class="clock"><strong>Draft Complete</strong></div>`}

        <div class="tabs">
          ${["ALL","QB","RB","WR","TE","OT","IOL","EDGE","DL","LB","CB","S"]
            .map(t => `<button class="tab ${state.tab === t ? "active" : ""}" onclick="setTab('${t}')">${t}</button>`).join("")}
        </div>

        <input id="searchBox" placeholder="Search prospects..." oninput="render()" />

        <div class="list">
          ${visibleProspects().slice(0, 80).map(p => {
            const idx = state.prospects.findIndex(x => x.name === p.name);
            const need = user.needs.includes(p.pos);
            const fit = getFit(p);

            return `
              <div class="prospect" onclick="openProfile(${idx})">
                <div class="rank">${p.rank}</div>
                <div>
                  <div class="player">${p.name} ${need ? `<span class="chip">Need</span>` : ""}</div>
                  <div class="small">${p.school} • Grade ${p.grade} • <span class="${fit.css}">${fit.label}</span></div>
                  <div class="small">${p.summary}</div>
                </div>
                <div class="pos">${p.pos}</div>
              </div>
            `;
          }).join("")}
        </div>
      </main>

      <aside class="panel">
        <h2>Your Draft</h2>
        <div class="list">
          ${state.completed.filter(p => p.team === state.userTeam).map(p => {
            const tag = p.player.rank < p.pick - 10 ? `<span class="steal">STEAL</span>` : "";
            return `
              <div class="result">
                <strong>Pick ${p.pick}: ${p.player.name}</strong> ${tag}
                <div class="small">${p.player.pos}, ${p.player.school} • Rank ${p.player.rank}</div>
              </div>
            `;
          }).join("") || `<div class="small">No picks yet.</div>`}
        </div>

        <h2 style="margin-top:16px;">Draft Grade</h2>
        <div class="summary"><strong>${gradeDraft()}</strong></div>

        <h2 style="margin-top:16px;">Share Result</h2>
        <div class="summary">${shareText()}</div>
        <button onclick="copyShare()" style="width:100%;">Copy Share Text</button>

        <h2 style="margin-top:16px;">Trades</h2>
        ${state.trades.map(t => `<div class="trade-log small">${t}</div>`).join("") || `<div class="small">No trades yet.</div>`}
      </aside>
    </div>

    <div id="tradeModal" class="modal">
      <div class="modal-card">
        <h2>Propose Trade</h2>

        <label>Trade With</label>
        <select id="tradeTeam" onchange="updateTradeReceive()"></select>

        <div class="trade-grid">
          <div>
            <h2>Your Picks To Give</h2>
            <div id="givePicks" class="pickbox"></div>
          </div>

          <div>
            <h2>Picks To Receive</h2>
            <div id="receivePicks" class="pickbox"></div>
          </div>
        </div>

        <div id="tradeMath" class="summary" style="margin-top:12px;"></div>

        <div class="btn-row">
          <button onclick="acceptTrade()">Accept Trade</button>
          <button class="secondary" onclick="closeTrade()">Cancel</button>
        </div>
      </div>
    </div>

    <div id="profileModal" class="profile-modal">
      <div class="profile-card">
        <div id="profileContent"></div>
      </div>
    </div>
  `;

  if (document.getElementById("tradeTeam")) {
    renderTradeModal();
  }
}

init();
