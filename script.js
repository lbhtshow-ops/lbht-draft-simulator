let state = {
  userTeam: "BAL",
  rounds: 3,
  order: [],
  current: 0,
  prospects: [],
  completed: [],
  tab: "ALL",
  trades: [],
  selectedPlayerIndex: null,
  isSimulating: false
};

const POSITIONS = ["ALL","QB","RB","WR","TE","OT","IOL","EDGE","DL","LB","CB","S"];

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function getTeam(abbr){ return TEAMS.find(t => t.abbr === abbr); }
function currentPickNumber(){ return state.current + 1; }
function currentRound(){ return Math.floor(state.current / 32) + 1; }
function currentTeam(){ return state.order[state.current]; }

function pickValue(pick){
  const slot = ((pick - 1) % 32) + 1;
  return PICK_VALUE[slot] || Math.max(1, 600 - pick * 4);
}

function buildOrder(){
  state.order = [];
  for(let i = 0; i < state.rounds; i++){
    state.order.push(...DEFAULT_ORDER);
  }
}

function init(){
  state.prospects = clone(PROSPECTS);
  buildOrder();
  render();
}

function restart(){
  if(state.isSimulating) return;

  state.userTeam = document.getElementById("teamSelect")?.value || "BAL";
  state.rounds = Number(document.getElementById("roundSelect")?.value || 3);
  state.current = 0;
  state.completed = [];
  state.trades = [];
  state.tab = "ALL";
  state.selectedPlayerIndex = null;
  state.prospects = clone(PROSPECTS);

  buildOrder();
  render();
}

function cpuPick(){
  if(state.current >= state.order.length || !state.prospects.length) return;

  const team = getTeam(currentTeam());
  const needs = team?.needs || [];

  let idx = state.prospects.findIndex(p => needs.includes(p.pos));
  if(idx === -1 || Math.random() < 0.35) idx = 0;

  makePick(idx, true);
}

function simToUser(){
  if(state.isSimulating) return;
  state.isSimulating = true;
  render();

  function step(){
    if(state.current >= state.order.length || currentTeam() === state.userTeam){
      state.isSimulating = false;
      render();
      return;
    }

    cpuPick();
    setTimeout(step, 20);
  }

  step();
}

function finishDraft(){
  if(state.isSimulating) return;
  state.isSimulating = true;
  render();

  function step(){
    let batch = 0;

    while(state.current < state.order.length && batch < 4){
      cpuPick();
      batch++;
    }

    render();

    if(state.current >= state.order.length){
      state.isSimulating = false;
      render();
      return;
    }

    setTimeout(step, 30);
  }

  step();
}

function makePick(index, cpu = false){
  if(state.current >= state.order.length) return;
  if(!state.prospects[index]) return;

  const player = state.prospects.splice(index, 1)[0];

  state.completed.push({
    pick: currentPickNumber(),
    round: currentRound(),
    team: currentTeam(),
    player,
    cpu
  });

  state.current++;

  if(!cpu){
    closeProfile();
    simToUser();
  }
}

function autoPick(){
  if(state.isSimulating) return;
  if(currentTeam() !== state.userTeam) return;

  const team = getTeam(state.userTeam);
  const needs = team?.needs || [];

  let idx = state.prospects.findIndex(p => needs.includes(p.pos));
  if(idx === -1) idx = 0;

  makePick(idx, false);
}

function setTab(tab){
  state.tab = tab;
  renderProspectsOnly();
  renderTabsOnly();
}

function visibleProspects(){
  const q = (document.getElementById("searchBox")?.value || "").toLowerCase();

  return state.prospects.filter(p => {
    const tabMatch = state.tab === "ALL" || p.pos === state.tab;
    const searchMatch = `${p.name} ${p.school} ${p.pos}`.toLowerCase().includes(q);
    return tabMatch && searchMatch;
  });
}

function getFit(player, abbr = state.userTeam){
  const team = getTeam(abbr);
  const needs = team?.needs || [];
  const pick = currentPickNumber();

  let score = 0;
  const valueGap = player.rank - pick;

  if(needs.includes(player.pos)) score += 45;
  if(valueGap <= -8) score += 35;
  else if(valueGap <= 4) score += 25;
  else if(valueGap <= 15) score += 10;
  else score -= 10;

  if(player.grade >= 92) score += 15;
  else if(player.grade >= 86) score += 8;

  if(score >= 70){
    return {
      label:"Elite Fit",
      css:"fit-elite",
      text:`${player.name} is an excellent fit for ${team.name}. He addresses a major need at ${player.pos} while also giving strong value.`
    };
  }

  if(score >= 45){
    return {
      label:"Good Fit",
      css:"fit-good",
      text:`${player.name} is a strong fit for ${team.name}. The position lines up well enough with the team's needs and the value is solid.`
    };
  }

  return {
    label:"Low Fit",
    css:"fit-low",
    text:`${team.name} could draft ${player.name}, but ${player.pos} is not one of their listed top needs or the value may be less ideal here.`
  };
}

function valueTag(player){
  const gap = player.rank - currentPickNumber();

  if(gap <= -10) return `<span class="steal">STEAL</span>`;
  if(gap >= 18) return `<span class="reach">REACH</span>`;

  return `<span class="small">Fair Value</span>`;
}

function gradeDraft(){
  const picks = state.completed.filter(p => p.team === state.userTeam);
  if(!picks.length) return "N/A";

  const needs = getTeam(state.userTeam)?.needs || [];
  let score = 0;

  picks.forEach(p => {
    let value = 100 - Math.abs(p.player.rank - p.pick) * 1.5;
    if(needs.includes(p.player.pos)) value += 8;
    score += value;
  });

  const avg = score / picks.length;

  if(avg >= 104) return "A+";
  if(avg >= 96) return "A";
  if(avg >= 90) return "A-";
  if(avg >= 84) return "B+";
  if(avg >= 78) return "B";
  if(avg >= 72) return "B-";
  return "C+";
}

function shareText(){
  const picks = state.completed.filter(p => p.team === state.userTeam);
  const team = getTeam(state.userTeam);

  if(!picks.length) return "Your mock draft results will appear here.";

  return `LBHT Mock Draft Result
Team: ${team.name}
Grade: ${gradeDraft()}

${picks.map(p => `Pick ${p.pick}: ${p.player.name}, ${p.player.pos}, ${p.player.school}`).join("\n")}

Run your own mock at lbhtshow.com`;
}

function copyShare(){
  navigator.clipboard.writeText(shareText());
  alert("Mock draft copied!");
}

function openProfile(index){
  if(state.isSimulating) return;

  state.selectedPlayerIndex = index;
  renderProfile();

  const modal = document.getElementById("profileModal");
  if(modal) modal.style.display = "block";
}

function closeProfile(){
  const modal = document.getElementById("profileModal");
  if(modal) modal.style.display = "none";

  state.selectedPlayerIndex = null;
}

function renderProfile(){
  const player = state.prospects[state.selectedPlayerIndex];
  if(!player) return;

  const userTeam = getTeam(state.userTeam);
  const fit = getFit(player);
  const canPick = currentTeam() === state.userTeam && !state.isSimulating;
  const box = document.getElementById("profileContent");

  if(!box) return;

  box.innerHTML = `
    <button class="modal-close" onclick="closeProfile()">×</button>

    <div class="profile-top">
      <div>
        <div class="profile-name">${player.name}</div>
        <div class="profile-sub">${player.pos} • ${player.school} • Rank #${player.rank} • ${player.projection || "Draft Prospect"}</div>
        <div class="profile-sub">Player comparison: ${player.comparison || "N/A"}</div>
      </div>

      <div class="profile-grade">
        Grade<br>
        <span style="font-size:26px;">${player.grade}</span>
      </div>
    </div>

    <div class="profile-grid">
      <div class="profile-box">
        <h3>Scouting Summary</h3>
        <p class="small">${player.summary || ""}</p>
        <p>${valueTag(player)}</p>
      </div>

      <div class="profile-box">
        <h3>Draft Fit For ${userTeam.name}</h3>
        <p class="${fit.css}">${fit.label}</p>
        <p class="small">${fit.text}</p>
      </div>

      <div class="profile-box">
        <h3>Strengths</h3>
        <ul>${(player.strengths || []).map(x => `<li>${x}</li>`).join("")}</ul>
      </div>

      <div class="profile-box">
        <h3>Weaknesses</h3>
        <ul>${(player.weaknesses || []).map(x => `<li>${x}</li>`).join("")}</ul>
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

function openTrade(){
  if(state.isSimulating) return;

  const modal = document.getElementById("tradeModal");
  if(!modal) return;

  modal.style.display = "block";
  renderTradeModal();
}

function closeTrade(){
  const modal = document.getElementById("tradeModal");
  if(modal) modal.style.display = "none";
}

function renderTradeModal(){
  const tradeTeam = document.getElementById("tradeTeam");

  if(!tradeTeam) return;

  tradeTeam.innerHTML = TEAMS
    .filter(t => t.abbr !== state.userTeam)
    .map(t => `<option value="${t.abbr}">${t.name}</option>`)
    .join("");

  updateTradeReceive();
}

function updateTradeReceive(){
  const tradeTeam = document.getElementById("tradeTeam");
  const givePicks = document.getElementById("givePicks");
  const receivePicks = document.getElementById("receivePicks");

  if(!tradeTeam || !givePicks || !receivePicks) return;

  const target = tradeTeam.value;

  const myPicks = state.order
    .map((abbr, i) => ({ abbr, pick: i + 1 }))
    .filter(x => x.abbr === state.userTeam && x.pick > currentPickNumber());

  const theirPicks = state.order
    .map((abbr, i) => ({ abbr, pick: i + 1 }))
    .filter(x => x.abbr === target && x.pick >= currentPickNumber());

  givePicks.innerHTML = myPicks.length
    ? myPicks.map(x => `
      <label class="check">
        <input type="checkbox" value="${x.pick}" onchange="tradeMath()">
        Pick ${x.pick} - Round ${Math.floor((x.pick - 1) / 32) + 1}
      </label>
    `).join("")
    : `<div class="small">No future picks available.</div>`;

  receivePicks.innerHTML = theirPicks.length
    ? theirPicks.slice(0, 12).map(x => `
      <label class="check">
        <input type="checkbox" value="${x.pick}" onchange="tradeMath()">
        Pick ${x.pick} - Round ${Math.floor((x.pick - 1) / 32) + 1}
      </label>
    `).join("")
    : `<div class="small">No picks available from this team.</div>`;

  tradeMath();
}

function checked(id){
  return [...document.querySelectorAll(`#${id} input:checked`)]
    .map(x => Number(x.value));
}

function tradeMath(){
  const tradeMathBox = document.getElementById("tradeMath");
  if(!tradeMathBox) return;

  const give = checked("givePicks");
  const receive = checked("receivePicks");

  const giveValue = give.reduce((s, p) => s + pickValue(p), 0);
  const receiveValue = receive.reduce((s, p) => s + pickValue(p), 0);
  const diff = receiveValue - giveValue;

  let verdict = "Select picks to calculate value.";

  if(give.length && receive.length){
    if(Math.abs(diff) < 80) verdict = "Fair deal";
    else if(diff > 0) verdict = "You are winning this trade";
    else verdict = "Other team is winning this trade";
  }

  tradeMathBox.innerHTML = `
    <strong>${verdict}</strong><br>
    You give: ${giveValue} pts | You receive: ${receiveValue} pts | Difference: ${diff} pts
  `;
}

function acceptTrade(){
  const tradeTeam = document.getElementById("tradeTeam");
  if(!tradeTeam) return;

  const target = tradeTeam.value;
  const give = checked("givePicks");
  const receive = checked("receivePicks");

  if(!give.length || !receive.length){
    alert("Select picks from both sides.");
    return;
  }

  give.forEach(pick => {
    if(state.order[pick - 1] === state.userTeam){
      state.order[pick - 1] = target;
    }
  });

  receive.forEach(pick => {
    if(state.order[pick - 1] === target){
      state.order[pick - 1] = state.userTeam;
    }
  });

  state.trades.push(
    `${getTeam(state.userTeam).name} received pick(s) ${receive.join(", ")} from ${getTeam(target).name} for pick(s) ${give.join(", ")}.`
  );

  closeTrade();
  render();
}

function renderTabsOnly(){
  const tabs = document.getElementById("tabs");
  if(!tabs) return;

  tabs.innerHTML = POSITIONS
    .map(t => `<button class="tab ${state.tab === t ? "active" : ""}" onclick="setTab('${t}')">${t}</button>`)
    .join("");
}

function renderProspectsOnly(){
  const user = getTeam(state.userTeam);
  const box = document.getElementById("prospectList");

  if(!box) return;

  box.innerHTML = visibleProspects().slice(0, 35).map(player => {
    const idx = state.prospects.findIndex(x => x.name === player.name);
    const need = user.needs.includes(player.pos);
    const fit = getFit(player);

    return `
      <div class="prospect" onclick="openProfile(${idx})">
        <div class="rank">${player.rank}</div>
        <div>
          <div class="player">${player.name} ${need ? `<span class="chip">Need</span>` : ""}</div>
          <div class="small">${player.school} • Grade ${player.grade} • <span class="${fit.css}">${fit.label}</span></div>
          <div class="small">${player.summary || ""}</div>
        </div>
        <div class="pos">${player.pos}</div>
      </div>
    `;
  }).join("");
}

function renderOrderOnly(){
  const box = document.getElementById("draftOrderList");
  if(!box) return;

  box.innerHTML = state.order
    .map((abbr, i) => ({ abbr, i }))
    .slice(
      Math.max(0, state.current - 10),
      Math.min(state.order.length, state.current + 25)
    )
    .map(({ abbr, i }) => {
      const made = state.completed.find(p => p.pick === i + 1);

      return `
        <div class="pick ${i === state.current ? "active-pick" : ""}">
          <strong>${i + 1}. ${abbr}</strong>
          <div class="small">
            ${made ? `${made.player.name} - ${made.player.pos}` : `Round ${Math.floor(i / 32) + 1}`}
          </div>
        </div>
      `;
    }).join("");
}

function renderResultsOnly(){
  const box = document.getElementById("resultsList");
  const gradeBox = document.getElementById("gradeBox");
  const shareBox = document.getElementById("shareBox");
  const tradesBox = document.getElementById("tradesBox");

  if(box){
    const picks = state.completed.filter(p => p.team === state.userTeam);

    box.innerHTML = picks.length
      ? picks.map(p => {
        const tag = p.player.rank < p.pick - 10 ? `<span class="steal">STEAL</span>` : "";

        return `
          <div class="result">
            <strong>Pick ${p.pick}: ${p.player.name}</strong> ${tag}
            <div class="small">${p.player.pos}, ${p.player.school} • Rank ${p.player.rank}</div>
          </div>
        `;
      }).join("")
      : `<div class="small">No picks yet.</div>`;
  }

  if(gradeBox) gradeBox.innerHTML = `<strong>${gradeDraft()}</strong>`;
  if(shareBox) shareBox.textContent = shareText();

  if(tradesBox){
    tradesBox.innerHTML = state.trades.length
      ? state.trades.map(t => `<div class="trade-log small">${t}</div>`).join("")
      : `<div class="small">No trades yet.</div>`;
  }
}

function renderClockOnly(){
  const box = document.getElementById("clockBox");
  if(!box) return;

  const onClock = state.current < state.order.length ? getTeam(currentTeam()) : null;

  if(!onClock){
    box.innerHTML = `<div class="clock"><strong>Draft Complete</strong></div>`;
    return;
  }

  box.innerHTML = `
    <div class="clock">
      <div class="clock-left">
        <img class="logo" src="${onClock.logo}" loading="lazy" />
        <div>
          <strong>Pick ${currentPickNumber()} - Round ${currentRound()}</strong>
          <div class="small">${onClock.name} are on the clock</div>
        </div>
      </div>
      <button onclick="autoPick()" ${currentTeam() === state.userTeam && !state.isSimulating ? "" : "disabled"}>
        Auto Pick
      </button>
    </div>
  `;
}

function render(){
  const user = getTeam(state.userTeam);

  document.getElementById("app").innerHTML = `
    <div class="header">
      <div>
        <h1>LBHT NFL Draft Simulator</h1>
        <p>Make picks, trade up/down, build your team, and share your mock.</p>
      </div>
      <div class="pill">${state.isSimulating ? "Simulating..." : "● LBHT Draft War Room"}</div>
    </div>

    <div class="layout">
      <aside class="panel">
        <h2>Setup</h2>

        <label>Select Team</label>
        <select id="teamSelect" ${state.isSimulating ? "disabled" : ""}>
          ${TEAMS.map(t => `<option value="${t.abbr}" ${t.abbr === state.userTeam ? "selected" : ""}>${t.name}</option>`).join("")}
        </select>

        <label>Rounds</label>
        <select id="roundSelect" ${state.isSimulating ? "disabled" : ""}>
          <option value="1" ${state.rounds === 1 ? "selected" : ""}>1 Round</option>
          <option value="3" ${state.rounds === 3 ? "selected" : ""}>3 Rounds</option>
          <option value="7" ${state.rounds === 7 ? "selected" : ""}>7 Rounds</option>
        </select>

        <button onclick="restart()" style="width:100%;" ${state.isSimulating ? "disabled" : ""}>Start Draft</button>

        <div class="btn-row">
          <button class="secondary" onclick="simToUser()" ${state.isSimulating ? "disabled" : ""}>Sim To Pick</button>
          <button class="secondary" onclick="finishDraft()" ${state.isSimulating ? "disabled" : ""}>Finish</button>
        </div>

        <div class="team-card">
          <img class="logo" src="${user.logo}" loading="lazy" />
          <div>
            <strong>${user.name}</strong>
            <div class="small">Current team</div>
          </div>
        </div>

        <div class="needs">
          ${user.needs.map(n => `<span class="chip">${n}</span>`).join("")}
        </div>

        <button onclick="openTrade()" style="width:100%;" ${state.isSimulating ? "disabled" : ""}>Propose Trade</button>

        <h2 style="margin-top:16px;">Draft Order</h2>
        <div id="draftOrderList" class="list"></div>
      </aside>

      <main class="panel">
        <div id="clockBox"></div>

        <div id="tabs" class="tabs"></div>

        <input id="searchBox" placeholder="Search prospects..." oninput="renderProspectsOnly()" />

        <div id="prospectList" class="list"></div>
      </main>

      <aside class="panel">
        <h2>Your Draft</h2>
        <div id="resultsList" class="list"></div>

        <h2 style="margin-top:16px;">Draft Grade</h2>
        <div id="gradeBox" class="summary"></div>

        <h2 style="margin-top:16px;">Share Result</h2>
        <div id="shareBox" class="summary"></div>
        <button onclick="copyShare()" style="width:100%;">Copy Share Text</button>

        <h2 style="margin-top:16px;">Trades</h2>
        <div id="tradesBox"></div>
      </aside>
    </div>

    <div id="tradeModal" class="modal" onclick="if(event.target.id==='tradeModal') closeTrade()">
      <div class="modal-card">
        <button class="modal-close" onclick="closeTrade()">×</button>

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

    <div id="profileModal" class="profile-modal" onclick="if(event.target.id==='profileModal') closeProfile()">
      <div class="profile-card">
        <div id="profileContent"></div>
      </div>
    </div>
  `;

  renderTabsOnly();
  renderClockOnly();
  renderOrderOnly();
  renderProspectsOnly();
  renderResultsOnly();
}

document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    closeProfile();
    closeTrade();
  }
});

init();
