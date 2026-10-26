-(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "balanceQuestMobile.v3";
  const BREAK_SECONDS = 5 * 60;

  const BREAK_ACTIVITIES = {
    "Breathing": {pose:"breathing", icon:"🌬️", text:"Sit comfortably. Breathe in gently, then breathe out slowly. Let your shoulders soften. Repeat at your own pace."},
    "Stretch": {pose:"stretch", icon:"🙆", text:"Roll your shoulders, stretch your arms overhead, gently move your neck, and stand up if that feels comfortable. No need to push or force a stretch."},
    "Drink water": {pose:"water", icon:"💧", text:"Have a drink of water and give your eyes a moment away from the screen."},
    "Short walk": {pose:"walk", icon:"🚶", text:"Walk around your room or home at a comfortable pace. Notice a few things around you as you move."},
    "Listen to music": {pose:"music", icon:"🎧", text:"Play one song you enjoy. Let yourself listen without trying to multitask."},
    "Doodle": {pose:"doodle", icon:"🎨", text:"Doodle shapes, flowers, stars, or anything that comes to mind. It does not need to look a certain way."},
    "Look outside": {pose:"window", icon:"🌤️", text:"Look out of a window or at something far away. Notice the light, clouds, trees, or movement."},
    "Spend time with an animal": {pose:"animal", icon:"🐾", text:"If you have a pet nearby, spend a calm moment with them. If not, look at an animal photo or imagine a favourite animal."},
    "Read for fun": {pose:"read", icon:"📖", text:"Read something you genuinely enjoy for a few minutes — not schoolwork."},
    "Cosy rest": {pose:"rest", icon:"🧸", text:"Get comfortable, relax your jaw and shoulders, and give yourself permission to pause."}
  };

  const TECHNIQUES = {
    "Active recall":"Close your notes and write or say everything you can remember about the topic. Then check your notes and fill the gaps.",
    "Practice questions":"Try a question before looking at the answer. Mark it, learn from any mistake, and try a similar one.",
    "Teach it back":"Explain the idea as if you were teaching a younger student. If you get stuck, that shows you what to revise.",
    "Break it down":"Make the first step tiny: open the worksheet, choose one question, or write one heading. You only need to begin.",
    "Spaced revision":"Review something briefly now, then revisit it later today or another day. Short repeat reviews help it stick."
  };

  const DECOR = [
    {id:"fairylights",name:"Fairy lights",icon:"✨",cost:8,level:1,desc:"A warm little glow",x:43,y:20},
    {id:"plant",name:"Leafy plant",icon:"🪴",cost:6,level:1,desc:"A touch of green",x:81,y:59},
    {id:"books",name:"Book stack",icon:"📚",cost:5,level:1,desc:"For your study corner",x:71,y:55},
    {id:"plushie",name:"Plushie",icon:"🧸",cost:10,level:1,desc:"A cosy companion",x:17,y:63},
    {id:"stars",name:"Star mobile",icon:"🌟",cost:12,level:2,desc:"Little stars overhead",x:54,y:10},
    {id:"flowers",name:"Flower vase",icon:"💐",cost:9,level:2,desc:"Soft and cheerful",x:84,y:45},
    {id:"lamp",name:"Star lamp",icon:"💡",cost:15,level:2,desc:"A study-time glow",x:65,y:54},
    {id:"fish",name:"Aquarium",icon:"🐠",cost:18,level:3,desc:"A tiny underwater world",x:77,y:30},
    {id:"moon",name:"Moon wall art",icon:"🌙",cost:14,level:3,desc:"A dreamy detail",x:71,y:14},
    {id:"mushroom",name:"Mushroom stool",icon:"🍄",cost:16,level:4,desc:"A storybook touch",x:47,y:65},
    {id:"butterfly",name:"Butterfly mobile",icon:"🦋",cost:20,level:5,desc:"A little movement",x:38,y:13},
    {id:"terrarium",name:"Terrarium",icon:"🌱",cost:22,level:5,desc:"A tiny garden",x:90,y:63}
  ];

  const PETS = [
    {id:"cat",name:"Cosy cat",icon:"🐈",cost:12,desc:"A soft little friend who likes sunny spots."},
    {id:"puppy",name:"Playful puppy",icon:"🐶",cost:14,desc:"A cheerful buddy for study breaks."},
    {id:"bunny",name:"Sleepy bunny",icon:"🐰",cost:10,desc:"A gentle companion with floppy ears."},
    {id:"hamster",name:"Tiny hamster",icon:"🐹",cost:8,desc:"A tiny friend for your desk corner."},
    {id:"fox",name:"Curious fox",icon:"🦊",cost:18,desc:"A curious little visitor for your room."},
    {id:"panda",name:"Panda pal",icon:"🐼",cost:20,desc:"A sleepy panda who loves cosy corners."}
  ];

  const ROOMS = [
    {level:1,name:"Cosy Pastel",className:"theme-pastel",cost:0},
    {level:3,name:"Lavender Dream",className:"theme-lavender",cost:0},
    {level:6,name:"Sage Garden",className:"theme-sage",cost:0},
    {level:9,name:"Moonlight Bedroom",className:"theme-moon",cost:0}
  ];

  const defaults = {
    started:false,
    mood:"Okay",
    goal:"Feel prepared and calm",
    mode:"Balanced",
    sessionMinutes:25,
    ownedPets:[],
    activePet:"",
    assessments:[],
    avatar:{
      name:"Mochi",
      skin:"#f6d2b5",
      hair:"bob",
      hairColor:"#5b3a32",
      eyes:"#44312b",
      outfit:"#e9a9c6",
      accessory:"none",
      pronouns:"they"
    },
    notes:"",
    tasks:[],
    energy:100,
    focus:100,
    xp:0,
    coins:20,
    roomIndex:0,
    ownedDecor:[],
    placedDecor:[],
    timer:{
      running:false,
      mode:"study",
      endAt:null,
      remaining:1500,
      studySince:null,
      studyElapsed:0,
      breaksTaken:0
    },
    break:{
      running:false,
      endAt:null,
      remaining:300,
      returnTo:"bedroom",
      activity:"Breathing",
      mandatory:false
    },
    lastBreakAt:null,
    finalMood:"Proud",
    reflections:[],
    focusSettings:{
      checklist:false,
      notifications:false,
      phoneAway:false
    },
    aiEndpoint:"",
    chat:[],
    lastNote:""
  };

  let state = loadState();
  if (state.avatar && !["none", "bow", "headphones", "flower"].includes(state.avatar.accessory)) {
    state.avatar.accessory = "none";
    saveState();
  }
  let toastTimer = null;
  let timerInterval = null;
  let breakInterval = null;
  let selectedTechnique = "";
  let activeTab = "bedroom";
  let audioContext = null;
  let chimeUnlocked = false;

  function unlockChimeAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      chimeUnlocked = true;
    } catch (error) {
      chimeUnlocked = false;
    }
  }

  function playSoftChime() {
    try {
      if (!audioContext) unlockChimeAudio();
      if (!audioContext || !chimeUnlocked) return;
      if (audioContext.state === "suspended") audioContext.resume();

      const startAt = audioContext.currentTime + 0.03;

      // A gentle three-note chime with rounded sine tones and no harsh attack.
      [659.25, 783.99, 987.77].forEach((frequency, index) => {
        const start = startAt + index * 0.19;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.075, start + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.75);
      });
    } catch (error) {
      // Browser sound is optional; the timer and visual notification still work.
    }
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        ...structuredClone(defaults),
        ...saved,
        ownedPets: Array.isArray(saved.ownedPets) ? saved.ownedPets : [],
        activePet: typeof saved.activePet === "string" ? saved.activePet : "",
        assessments: Array.isArray(saved.assessments) ? saved.assessments : []
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c]));
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Math.ceil(seconds || 0));
    return `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`;
  }

  function getRemaining(t) {
    if (t.running && t.endAt) {
      return Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000));
    }
    return Math.max(0, t.remaining || 0);
  }

  function setAvatarVars(el) {
    if (!el) return;
    const a = state.avatar;

    el.style.setProperty("--skin", a.skin);
    el.style.setProperty("--hair", a.hairColor);
    el.style.setProperty("--eyes", a.eyes);
    el.style.setProperty("--outfit", a.outfit);

    el.classList.remove(
      "accessory-bow",
      "accessory-headphones",
      "accessory-flower"
    );

    if (["bow", "headphones", "flower"].includes(a.accessory)) {
      el.classList.add("accessory-" + a.accessory);
    }

    const hair = el.querySelector(".avatar-hair");
    if (hair) {
      const map = {
        bob:"48% 48% 30% 30%",
        long:"48% 48% 18% 18%",
        curly:"45% 45% 40% 40%",
        bun:"45% 45% 35% 35%",
        short:"48% 48% 22% 22%",
        ponytail:"48% 48% 28% 28%"
      };

      hair.style.borderRadius = map[a.hair] || map.bob;

      // Keep the room hair behind the face; the CSS cap supplies the fringe.
      const inRoom = el.classList.contains("room-avatar");
      const hairHeight = inRoom
        ? ({long:"42%",curly:"43%",bun:"35%",short:"25%",ponytail:"31%",bob:"35%"}[a.hair] || "35%")
        : ({long:"58%",curly:"48%",bun:"43%",short:"31%",ponytail:"40%",bob:"39%"}[a.hair] || "39%");

      if (inRoom) {
        hair.style.setProperty("height", hairHeight, "important");
      } else {
        hair.style.height = hairHeight;
      }

      hair.style.boxShadow = a.hair === "long"
        ? (inRoom
            ? "9px 25px 0 -2px var(--hair), -9px 25px 0 -2px var(--hair)"
            : "7px 17px 0 -1px var(--hair), -7px 17px 0 -1px var(--hair)")
        : "none";
    }
  }

  function renderAvatar() {
    const a = state.avatar;
    $("headerAvatar").textContent = "☺";
    $("headerName").textContent = a.name || "Mochi";
    $("previewName").textContent = a.name || "Mochi";
    $("buddyCardName").textContent = a.name || "Mochi";
    $("miniAvatar").textContent = "☺";
    $("finalAvatar").textContent = "☺";

    ["avatarPreview", "avatarInRoom"].forEach(id => setAvatarVars($(id)));

    const avatar = $("avatarInRoom");
    avatar.className = "room-avatar pose-idle" +
      (["bow", "headphones", "flower"].includes(a.accessory) ? " accessory-" + a.accessory : "");
    setAvatarVars(avatar);
  }

  function renderTasks() {
    const setup = $("setupTaskList");
    const room = $("bedroomTaskList");

    if (!state.tasks.length) {
      setup.innerHTML = '<div class="empty-state">No tasks yet — add one above to get started.</div>';
      room.innerHTML = '<div class="empty-state">Your tasks will appear here ✿</div>';
    } else {
      setup.innerHTML = state.tasks.map((t, i) =>
        `<div class="task-row" draggable="true" data-task-id="${t.id}">
          <span class="task-number">${i + 1}.</span>
          <span class="task-title">${escapeHtml(t.title)}</span>
          <span class="priority ${t.priority}">${t.priority}</span>
          <button class="icon-btn" data-move="-1" data-id="${t.id}" aria-label="Move up">↑</button>
          <button class="icon-btn" data-move="1" data-id="${t.id}" aria-label="Move down">↓</button>
          <button class="icon-btn" data-delete="${t.id}" aria-label="Delete task">×</button>
        </div>`
      ).join("");

      room.innerHTML = state.tasks.map((t, i) =>
        `<label class="sticky-task ${t.done ? "done" : ""}">
          <input type="checkbox" data-complete="${t.id}" ${t.done ? "checked" : ""}>
          <span>${i + 1}. ${escapeHtml(t.title)}</span>
          <small>${escapeHtml(t.priority)}</small>
        </label>`
      ).join("");
    }

    const done = state.tasks.filter(t => t.done).length;
    $("taskProgress").textContent = `${done} of ${state.tasks.length} complete`;
    saveState();
  }

  function renderStats() {
    const energy = Math.max(0, Math.min(100, state.energy));
    const focus = Math.max(0, Math.min(100, state.focus));

    $("energyBar").style.width = energy + "%";
    $("focusBar").style.width = focus + "%";
    $("energyValue").textContent = energy + "%";
    $("focusValue").textContent = focus + "%";

    const level = 1 + Math.floor(state.xp / 100);
    $("levelValue").textContent = "Level " + level;
    $("xpValue").textContent = (100 - (state.xp % 100)) + " XP";
    $("coinValue").textContent = state.coins;
    $("roomTitle").textContent = ROOMS[state.roomIndex]?.name + " Bedroom" || "Cosy Pastel Bedroom";

    $("roomCaption").textContent =
      state.mood === "Stressed" ? "Gentle steps count." :
      state.mood === "Tired" ? "Let's protect your energy." :
      "One small step at a time.";

    $("stickyGoal").textContent = state.goal || "Your goal for today";
    const stickyNote = $("stickyBuddyNote");
    if (stickyNote) {
      stickyNote.textContent = state.notes || "";
      stickyNote.classList.toggle("hidden", !String(state.notes || "").trim());
    }
    $("buddyMoodText").textContent = `Feeling ${state.mood.toLowerCase()} · ${state.mode} mode`;

    if (energy < 30 || focus < 25) {
      $("buddySpeech").textContent = "I’m noticing your energy is running low. Let’s take a real pause before pushing on.";
    } else if (state.mood === "Stressed") {
      $("buddySpeech").textContent = "We can make this smaller. Pick one task, and only focus on the first step.";
    } else {
      $("buddySpeech").textContent = "You don't have to do everything at once. Let's start with one small thing.";
    }
  }

  function renderDecor() {
    const layer = $("placedDecorations");
    layer.innerHTML = "";

    state.placedDecor.forEach(item => {
      const d = DECOR.find(x => x.id === item.id);
      if (!d) return;

      const el = document.createElement("button");
      el.className = "placed-item";
      el.type = "button";
      el.title = d.name + " — drag to move";
      el.textContent = d.icon;
      el.style.left = item.x + "%";
      el.style.top = item.y + "%";
      el.dataset.decorId = item.id;
      el.setAttribute("aria-label", d.name + ", drag to move");
      el.addEventListener("pointerdown", startDragDecor);
      layer.appendChild(el);
    });
  }

  function renderPet() {
    const el = $("roomPet");
    if (!el) return;

    const pet = PETS.find(p => p.id === state.activePet && state.ownedPets.includes(p.id));
    el.classList.toggle("hidden", !pet);

    if (!pet) {
      el.innerHTML = "";
      el.removeAttribute("data-pet-id");
      el.classList.remove("pet-playing");
      return;
    }

    el.dataset.petId = pet.id;
    el.dataset.pet = pet.id;
    el.setAttribute("aria-label", `Play with your ${pet.name}`);
    el.title = `Play with your ${pet.name}`;

    el.innerHTML = `
      <span class="pet-shadow"></span>
      <span class="pet-tail"></span>
      <span class="pet-body">
        <span class="pet-paw paw-left"></span>
        <span class="pet-paw paw-right"></span>
      </span>
      <span class="pet-head">
        <span class="pet-ear ear-left"></span>
        <span class="pet-ear ear-right"></span>
        <span class="pet-eye eye-left"></span>
        <span class="pet-eye eye-right"></span>
        <span class="pet-nose"></span>
        <span class="pet-mouth"></span>
        <span class="pet-cheek cheek-left"></span>
        <span class="pet-cheek cheek-right"></span>
      </span>
    `;

    if (state.break.activity === "Spend time with an animal" && state.break.running) {
      el.classList.add("pet-playing");
    } else {
      el.classList.remove("pet-playing");
    }
  }

  function renderActivityProps(activity) {
    const scene = $("roomScene");
    let layer = $("activityProps");

    if (!layer) {
      layer = document.createElement("div");
      layer.id = "activityProps";
      layer.className = "activity-props";
      layer.setAttribute("aria-hidden", "true");
      scene.appendChild(layer);
    }

    const props = {
      "Breathing": `<span class="prop-breath-bubble bubble-one"></span><span class="prop-breath-bubble bubble-two"></span><span class="prop-breath-bubble bubble-three"></span>`,
      "Stretch": `<span class="prop-yoga-mat"></span><span class="prop-sparkle">✦</span>`,
      "Drink water": `<span class="prop-water-bottle"><i class="bottle-cap"></i><i class="bottle-neck"></i><i class="bottle-body"><b></b></i></span>`,
      "Short walk": `<span class="prop-footprint footprint-one">●</span><span class="prop-footprint footprint-two">●</span><span class="prop-footprint footprint-three">●</span>`,
      "Listen to music": `<span class="prop-music-note note-one">♪</span><span class="prop-music-note note-two">♫</span><span class="prop-music-headphones">♬</span>`,
      "Doodle": `<span class="prop-paper"><i>✿</i><b>~</b><em>♡</em></span><span class="prop-pencil"></span>`,
      "Look outside": `<span class="prop-sun">☼</span><span class="prop-cloud">☁</span>`,
      "Spend time with an animal": `<span class="prop-pet-toy">●</span><span class="prop-heart">♥</span><span class="prop-heart heart-two">♥</span>`,
      "Read for fun": `<span class="prop-open-book prop-held-book"><i></i><b></b><em></em></span>`,
      "Cosy rest": `<span class="prop-rest-stars">✦　♡　✦</span>`
    };

    const classes = {
      "Breathing":"breathing",
      "Stretch":"stretch",
      "Drink water":"water",
      "Short walk":"walk",
      "Listen to music":"music",
      "Doodle":"doodle",
      "Look outside":"window",
      "Spend time with an animal":"animal",
      "Read for fun":"read",
      "Cosy rest":"rest"
    };

    layer.className = "activity-props activity-" + (classes[activity] || "breathing");
    layer.innerHTML = props[activity] || props["Breathing"];
  }

  function renderRoom() {
    const room = ROOMS[state.roomIndex] || ROOMS[0];
    $("roomScene").className = "room-scene " + room.className;
    renderDecor();
    renderPet();
    renderStats();
    renderAvatar();
  }

  function showScreen(name) {
    ["setupScreen", "bedroomScreen", "finalScreen"].forEach(id =>
      $(id).classList.toggle("hidden", id !== name)
    );
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function updateTimerUI() {
    const t = state.timer;

    $("timerDisplay").textContent = formatTime(getRemaining(t));
    $("timerModeLabel").textContent = t.mode === "study" ? "Study session" : "Paused";
    $("timerStatus").textContent = t.running
      ? (t.mode === "study" ? "Timer running in background" : "Break running")
      : "Ready when you are";
    $("timerStart").textContent = t.running ? "Running" : "Start";
    $("timerStart").disabled = t.running;
    $("timerPause").disabled = !t.running;
    $("timerMinutes").value = Math.max(1, Math.round((t.remaining || state.sessionMinutes * 60) / 60));

    const elapsed = t.studyElapsed + (t.studySince ? Math.max(0, (Date.now() - t.studySince) / 1000) : 0);
    const secsToBreak = 1800 - (elapsed % 1800);

    if (t.running && t.mode === "study" && secsToBreak <= 60) {
      $("breakDueNotice").classList.remove("hidden");
      $("breakDueNotice").textContent = secsToBreak <= 0
        ? "A 5-minute reset is due. Pause your study timer and take a break."
        : `A 5-minute reset is due in about ${Math.ceil(secsToBreak)} seconds.`;
    } else {
      $("breakDueNotice").classList.add("hidden");
    }
  }

  function syncTimerFromClock() {
    if (!state.timer.running || !state.timer.endAt) return;

    const remaining = getRemaining(state.timer);
    state.timer.remaining = remaining;

    if (remaining <= 0) {
      state.timer.running = false;
      state.timer.endAt = null;
      playSoftChime();

      if (state.timer.mode === "study") {
        state.timer.mode = "study";
        state.timer.remaining = state.sessionMinutes * 60;
        state.timer.studySince = null;
        saveState();
        updateTimerUI();
        toast("Study timer finished. Take a 5-minute break if you’ve been studying continuously.");

        if (state.tasks.some(t => !t.done)) {
          beginBreak(false, "Study timer finished — take a little reset before continuing.");
        }
      } else {
        state.break.running = false;
        state.break.endAt = null;
        state.break.remaining = 0;
        saveState();
        updateTimerUI();

        if (state.break.returnTo === "final") {
          showScreen("finalScreen");
        } else {
          showScreen("bedroomScreen");
          state.energy = Math.min(100, state.energy + 15);
          state.focus = Math.min(100, state.focus + 10);
          renderStats();
          toast("Break complete. Welcome back ✿");
        }
      }
    } else {
      updateTimerUI();
    }
  }

  function startStudyTimer() {
    unlockChimeAudio();

    if (state.break.running || state.break.mandatory) {
      toast("Finish your required five-minute break before starting the next study session.");
      return;
    }

    const mins = Math.max(1, Math.min(240, parseInt($("timerMinutes").value, 10) || state.sessionMinutes));
    state.sessionMinutes = mins;
    state.timer.mode = "study";
    state.timer.remaining = mins * 60;
    state.timer.endAt = Date.now() + mins * 60000;
    state.timer.running = true;

    if (!state.timer.studySince) state.timer.studySince = Date.now();

    saveState();
    updateTimerUI();
    startIntervals();

    $("avatarInRoom").className = "room-avatar pose-studying" +
      (state.avatar.accessory !== "none" ? " accessory-" + state.avatar.accessory : "");
    setAvatarVars($("avatarInRoom"));
    $("roomActionLabel").textContent = "Studying with " + state.avatar.name;
    toast("Timer started — you can move around the app while it runs.");
  }

  function pauseStudyTimer() {
    if (state.timer.running) {
      const remaining = getRemaining(state.timer);

      if (state.timer.mode === "study" && state.timer.studySince) {
        state.timer.studyElapsed += Math.max(0, (Date.now() - state.timer.studySince) / 1000);
        state.timer.studySince = null;
      }

      state.timer.running = false;
      state.timer.endAt = null;
      state.timer.remaining = remaining;
      saveState();
      updateTimerUI();
      toast("Timer paused.");
    }
  }

  function resetStudyTimer() {
    pauseStudyTimer();
    state.timer.remaining = state.sessionMinutes * 60;
    state.timer.studyElapsed = 0;
    state.timer.studySince = null;
    saveState();
    updateTimerUI();

    $("avatarInRoom").className = "room-avatar pose-idle" +
      (state.avatar.accessory !== "none" ? " accessory-" + state.avatar.accessory : "");
    setAvatarVars($("avatarInRoom"));
    toast("Timer reset.");
  }

  function startIntervals() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      syncTimerFromClock();
      checkBurnout();
    }, 1000);
  }

  function checkBurnout() {
    const t = state.timer;
    if (!t.studySince || t.mode !== "study" || !state.tasks.some(x => !x.done)) return;

    const elapsed = t.studyElapsed + Math.max(0, (Date.now() - t.studySince) / 1000);
    const cycles = Math.floor(elapsed / 1800);

    if (cycles > t.breaksTaken) {
      t.breaksTaken = cycles;
      pauseStudyTimer();
      beginBreak(true, "You've studied for 30 minutes continuously. Your five-minute reset is starting now.");
    }
  }

  function beginBreak(mandatory = true, reason = "Your 5-minute reset", activity = "Breathing") {
    state.break = {
      running:false,
      endAt:null,
      remaining:BREAK_SECONDS,
      returnTo:"bedroom",
      activity,
      mandatory
    };

    $("breakHeading").textContent = mandatory ? "Your required 5-minute reset" : "Choose a little break activity";
    $("breakIntro").textContent = reason + " Your buddy will do the activity right in the bedroom.";
    $("breakTimerDisplay").textContent = "05:00";
    $("breakStart").textContent = mandatory ? "Break starting…" : "Start 5-minute break";
    $("breakRuleHint").textContent = mandatory
      ? "This is a required five-minute break. Choose any activity; the timer will continue while you do it."
      : "Choose an activity and start a five-minute break whenever you're ready.";

    $("inRoomBreakPanel").classList.remove("hidden");
    updateBreakActivity(activity);
    renderBreakControls();

    if (mandatory) startBreakTimer(true);

    saveState();
    $("roomScene").scrollIntoView({behavior:"smooth",block:"center"});
  }

  function updateBreakActivity(activity) {
    const selected = activity || state.break.activity || "Breathing";
    state.break.activity = selected;

    const item = BREAK_ACTIVITIES[selected] || BREAK_ACTIVITIES.Breathing;
    const instructions = $("breakInstructions");
    instructions.textContent = item.text;

    document.querySelectorAll("[data-break-activity]").forEach(b =>
      b.classList.toggle("selected", b.dataset.breakActivity === selected)
    );

    const avatar = $("avatarInRoom");
    avatar.className = "room-avatar pose-" + item.pose +
      (state.avatar.accessory !== "none" ? " accessory-" + state.avatar.accessory : "");
    setAvatarVars(avatar);
    $("roomPet").classList.remove("pet-playing");

    const labels = {
      "Breathing":"Taking a gentle breathing pause 🌬️",
      "Stretch":"Stretching gently 🙆",
      "Drink water":"Having a drink of water 💧",
      "Short walk":"Taking a little walk 🚶",
      "Listen to music":"Listening to music 🎧",
      "Doodle":"Doodling with pen and paper 🎨",
      "Look outside":"Looking out of the window 🌤️",
      "Spend time with an animal":"Playing with a furry friend 🐾",
      "Read for fun":"Reading for fun 📖",
      "Cosy rest":"Resting on the bed 🧸"
    };

    $("roomActionLabel").textContent = labels[selected] || "Taking a little break";

    if (selected === "Cosy rest" || selected === "Read for fun") avatar.classList.add("on-bed");
    if (selected === "Look outside") avatar.classList.add("by-window");
    if (selected === "Spend time with an animal") avatar.classList.add("by-pet");
    if (selected === "Doodle") avatar.classList.add("at-desk");
    if (selected === "Drink water") avatar.classList.add("at-desk");

    const pet = PETS.find(p => p.id === state.activePet && state.ownedPets.includes(p.id));

    if (selected === "Spend time with an animal") {
      if (pet) {
        instructions.textContent = `Play with ${pet.name}! Tap your companion in the room to make them hop and wag. Your buddy will move over to play, and your pet will animate beside them.`;
        if (state.break.running) $("roomPet").classList.add("pet-playing");
      } else {
        instructions.textContent = "You haven't adopted a room pet yet. Open Room shop and adopt a cat, puppy, bunny, hamster, fox or panda, then come back here to play with your companion.";
      }
    }

    renderActivityProps(selected);
    saveState();
  }

  function startBreakTimer(automatic = false) {
    unlockChimeAudio();
    if (state.break.running) return;

    state.break.activity = state.break.activity || "Breathing";
    state.break.remaining = BREAK_SECONDS;
    state.break.endAt = Date.now() + BREAK_SECONDS * 1000;
    state.break.running = true;

    if (state.break.activity === "Spend time with an animal" && state.ownedPets.includes(state.activePet)) {
      $("roomPet").classList.add("pet-playing");
    }

    $("breakStart").textContent = "Break in progress…";
    $("roomBreakStatus").textContent = "Break in progress";

    if (state.break.mandatory) {
      $("breakFinish").classList.add("hidden");
      $("hideBreakPanel").classList.add("hidden");
    } else {
      $("breakFinish").classList.remove("hidden");
      $("hideBreakPanel").classList.add("hidden");
    }

    saveState();

    if (breakInterval) clearInterval(breakInterval);
    breakInterval = setInterval(tickBreak, 500);

    if (!automatic) toast("Your five-minute break has started.");
  }

  function tickBreak() {
    if (!state.break.running || !state.break.endAt) return;

    const rem = Math.max(0, Math.ceil((state.break.endAt - Date.now()) / 1000));
    state.break.remaining = rem;
    $("breakTimerDisplay").textContent = formatTime(rem);

    if (rem <= 0) {
      playSoftChime();
      clearInterval(breakInterval);
      state.break.running = false;
      state.break.endAt = null;
      state.break.remaining = 0;
      state.break.mandatory = false;
      state.energy = Math.min(100, state.energy + 15);
      state.focus = Math.min(100, state.focus + 10);
      state.lastBreakAt = Date.now();
      state.timer.studyElapsed = 0;
      state.timer.studySince = null;
      state.timer.breaksTaken = 0;
      $("inRoomBreakPanel").classList.add("hidden");
      $("activityProps")?.replaceChildren();
      $("roomPet").classList.remove("pet-playing");
      $("roomBreakStatus").textContent = "Ready when you are";
      $("roomActionLabel").textContent = "Your room, your pace";

      $("avatarInRoom").className = "room-avatar pose-idle" +
        (state.avatar.accessory !== "none" ? " accessory-" + state.avatar.accessory : "");
      setAvatarVars($("avatarInRoom"));

      renderBreakControls();
      saveState();
      renderStats();
      toast("Break complete. You're ready when you are ✿");
    } else {
      $("roomBreakStatus").textContent = state.break.mandatory ? "Required break" : "Taking a break";
      $("breakStart").textContent = "Break in progress…";
      $("breakTimerDisplay").textContent = formatTime(rem);
    }
  }

  function finishBreakEarly() {
    if (state.break.mandatory) {
      toast("This required break lasts five minutes — choose an activity and let the timer finish.");
      return;
    }

    if (breakInterval) clearInterval(breakInterval);

    state.break.running = false;
    state.break.endAt = null;
    state.break.remaining = 0;
    state.energy = Math.min(100, state.energy + 8);
    state.focus = Math.min(100, state.focus + 5);
    state.lastBreakAt = Date.now();
    state.timer.studyElapsed = 0;
    state.timer.studySince = null;
    state.timer.breaksTaken = 0;

    $("inRoomBreakPanel").classList.add("hidden");
    $("roomActionLabel").textContent = "Your room, your pace";

    $("avatarInRoom").className = "room-avatar pose-idle" +
      (state.avatar.accessory !== "none" ? " accessory-" + state.avatar.accessory : "");
    setAvatarVars($("avatarInRoom"));

    renderBreakControls();
    saveState();
    renderStats();
    toast("Break ended. Take care of your energy.");
  }

  function renderBreakControls() {
    const running = !!state.break.running;

    $("breakStart").textContent = running ? "Break in progress…" : "Start 5-minute break";
    $("breakStart").disabled = running;
    $("breakFinish").classList.toggle("hidden", !!state.break.mandatory);
    $("breakFinish").disabled = running && !!state.break.mandatory;
    $("hideBreakPanel").classList.toggle("hidden", running);

    $("breakTimerDisplay").textContent = formatTime(
      running
        ? getRemaining({running:true,endAt:state.break.endAt,remaining:state.break.remaining})
        : BREAK_SECONDS
    );

    $("roomBreakStatus").textContent = running
      ? (state.break.mandatory ? "Required break" : "Taking a break")
      : "Choose an activity";
  }

  function completeTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task || task.done) return;

    task.done = true;
    state.xp += 25;
    state.coins += 5;
    state.energy = Math.max(5, state.energy - 12);
    state.focus = Math.max(5, state.focus - 8);

    if (state.timer.running) pauseStudyTimer();

    saveState();
    renderTasks();
    renderStats();

    const unfinished = state.tasks.filter(t => !t.done);

    if (!unfinished.length) {
      state.timer.running = false;
      state.timer.endAt = null;
      state.timer.studySince = null;
      state.break.running = false;
      state.break.endAt = null;
      state.break.mandatory = false;

      if (breakInterval) clearInterval(breakInterval);
      $("inRoomBreakPanel").classList.add("hidden");
      saveState();

      $("finalGreeting").textContent = `You did it, ${state.avatar.name || "friend"}!`;
      $("finalSummary").textContent =
        `You completed ${state.tasks.length} ${state.tasks.length === 1 ? "task" : "tasks"} and earned ${state.tasks.length * 25} XP plus ${state.tasks.length * 5} Quest Coins. Take a moment to notice what you managed today.`;

      showScreen("finalScreen");
      return;
    }

    beginBreak(true, `“${task.title}” is complete. Your required five-minute break is starting now.`);
  }

  function addTask(title, priority = "Medium") {
    title = title.trim();
    if (!title) return;

    state.tasks.push({
      id:Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      title,
      priority,
      done:false
    });

    saveState();
    renderTasks();
  }

  function moveTask(id, delta) {
    const i = state.tasks.findIndex(t => t.id === id);
    const j = i + delta;

    if (i < 0 || j < 0 || j >= state.tasks.length) return;

    [state.tasks[i], state.tasks[j]] = [state.tasks[j], state.tasks[i]];
    saveState();
    renderTasks();
  }

  function reorderByPriority() {
    const rank = {High:0,Medium:1,Low:2};
    state.tasks.sort((a,b) => rank[a.priority] - rank[b.priority]);
    renderTasks();
    toast("Tasks sorted by priority.");
  }

  function startDragDecor(e) {
    e.preventDefault();

    const el = e.currentTarget;
    const item = state.placedDecor.find(x => x.id === el.dataset.decorId);
    if (!item) return;

    el.setPointerCapture?.(e.pointerId);

    function move(ev) {
      const rect = $("roomScene").getBoundingClientRect();
      item.x = Math.max(1, Math.min(94, ((ev.clientX - rect.left) / rect.width) * 100));
      item.y = Math.max(2, Math.min(78, ((ev.clientY - rect.top) / rect.height) * 100));
      el.style.left = item.x + "%";
      el.style.top = item.y + "%";
    }

    function end() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      saveState();
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, {once:true});
  }

  function openModal(content) {
    $("modalContent").innerHTML = content;
    $("modalBackdrop").classList.remove("hidden");
  }

  function closeModal() {
    $("modalBackdrop").classList.add("hidden");
  }

  function openDecorate() {
    activeTab = "decorate";
    setActiveTab();

    const owned = DECOR.filter(d => state.ownedDecor.includes(d.id));

    openModal(`
      <p class="eyebrow">MAKE IT YOURS</p>
      <h2>Move your decorations</h2>
      <p class="edit-note">Choose an item you own to place it in your room, or remove it again. You can drag placed decorations around your bedroom.</p>
      <div class="shop-grid">
        ${owned.length ? owned.map(d => {
          const placed = state.placedDecor.some(x => x.id === d.id);
          return `
            <div class="shop-item">
              <div class="decor-icon">${d.icon}</div>
              <strong>${d.name}</strong>
              <p>${placed ? "Already in your room" : "Ready to place"}</p>
              <button class="${placed ? "soft-button" : "primary"}" data-toggle-decor="${d.id}">${placed ? "Remove from room" : "Place in room"}</button>
            </div>`;
        }).join("") : '<p class="empty-state">You have not bought decorations yet. Visit the room shop to get started.</p>'}
      </div>
      <div class="button-row">
        <button class="soft-button" id="autoArrange">Arrange for me</button>
        <button class="primary" id="doneDecorating">Done</button>
      </div>
    `);

    $("doneDecorating").onclick = closeModal;

    $("autoArrange").onclick = () => {
      state.placedDecor.forEach((x,i) => {
        x.x = 42 + (i % 4) * 13;
        x.y = 12 + Math.floor(i / 4) * 17;
      });
      saveState();
      renderDecor();
      toast("Decorations arranged — you can still drag them.");
    };

    document.querySelectorAll("[data-toggle-decor]").forEach(b => b.onclick = () => {
      const id = b.dataset.toggleDecor;
      const placed = state.placedDecor.some(x => x.id === id);
      if (placed) {
        state.placedDecor = state.placedDecor.filter(x => x.id !== id);
        toast("Decoration removed from your room.");
      } else {
        const d = DECOR.find(x => x.id === id);
        if (d) {
          state.placedDecor.push({id, x:d.x, y:d.y});
          toast("Decoration placed — drag it to move.");
        }
      }
      saveState();
      renderDecor();
      openDecorate();
    });
  }

  function openShop() {
    activeTab = "shop";
    setActiveTab();

    const level = 1 + Math.floor(state.xp / 100);
    openModal(`
      <p class="eyebrow">QUEST COIN SHOP</p>
      <h2>Room shop</h2>
      <p class="edit-note">You have <strong>${state.coins} coins</strong> · Level ${level}. Buy decorations here, then use Decorate to place or remove them.</p>
      <div class="shop-grid">
        ${DECOR.map(d => {
          const owned = state.ownedDecor.includes(d.id);
          const locked = level < d.level;
          return `
            <div class="shop-item">
              <div class="decor-icon">${d.icon}</div>
              <strong>${d.name}</strong>
              <p>${d.desc}${locked ? ` · Unlocks at level ${d.level}` : ""}</p>
              <button class="${owned ? "soft-button" : "primary"}" data-buy="${d.id}" ${owned || locked || state.coins < d.cost ? "disabled" : ""}>
                ${owned ? "Owned" : locked ? "Locked" : "Buy · " + d.cost + " coins"}
              </button>
            </div>`;
        }).join("")}
      </div>
      <div class="button-row"><button id="shopDone" class="soft-button">Close shop</button></div>
    `);

    $("shopDone").onclick = closeModal;
    document.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
      const d = DECOR.find(x => x.id === b.dataset.buy);
      if (!d || state.coins < d.cost || state.ownedDecor.includes(d.id)) return;
      state.coins -= d.cost;
      state.ownedDecor.push(d.id);
      saveState();
      renderStats();
      openShop();
      toast(`${d.name} added to your collection!`);
    });
  }

  function openPets() {
    activeTab = "pets";
    setActiveTab();
    openModal(`
      <p class="eyebrow">YOUR LITTLE COMPANIONS</p>
      <h2>Pets</h2>
      <p class="edit-note">Adopt pets with Quest Coins. Choose any pet you own to have it appear in your bedroom.</p>
      <p class="edit-note">You have <strong>${state.coins} coins</strong>.</p>
      <div class="shop-grid">
        ${PETS.map(p => {
          const owned = state.ownedPets.includes(p.id);
          const active = state.activePet === p.id;
          return `
            <div class="shop-item pet-shop-item">
              <div class="decor-icon pet-shop-icon">${p.icon}</div>
              <strong>${p.name}</strong>
              <p>${p.desc}</p>
              <button class="${owned ? "soft-button" : "primary"}" data-buy-pet="${p.id}" ${owned || state.coins < p.cost ? "disabled" : ""}>
                ${owned ? "Owned" : `Adopt · ${p.cost} coins`}
              </button>
              ${owned ? `<button class="text-button" data-use-pet="${p.id}" ${active ? "disabled" : ""}>${active ? "In your room" : "Choose this pet"}</button>` : ""}
            </div>`;
        }).join("")}
      </div>
      <div class="button-row"><button id="petsDone" class="soft-button">Done</button></div>
    `);
    $("petsDone").onclick = closeModal;
    document.querySelectorAll("[data-buy-pet]").forEach(b => b.onclick = () => {
      const pet = PETS.find(x => x.id === b.dataset.buyPet);
      if (!pet || state.ownedPets.includes(pet.id) || state.coins < pet.cost) return;
      state.coins -= pet.cost;
      state.ownedPets.push(pet.id);
      state.activePet = pet.id;
      saveState();
      renderRoom();
      openPets();
      toast(`${pet.name} joined your room!`);
    });
    document.querySelectorAll("[data-use-pet]").forEach(b => b.onclick = () => {
      const pet = PETS.find(x => x.id === b.dataset.usePet);
      if (!pet || !state.ownedPets.includes(pet.id)) return;
      state.activePet = pet.id;
      saveState();
      renderRoom();
      openPets();
      toast(`${pet.name} is now in your room.`);
    });
  }

  function openBedroomThemes() {
    activeTab = "bedroom";
    setActiveTab();
    const level = 1 + Math.floor(state.xp / 100);
    openModal(`
      <p class="eyebrow">YOUR PERSONAL SPACE</p>
      <h2>Bedroom themes</h2>
      <p class="edit-note">Choose a theme for your bedroom. Some themes unlock as you level up.</p>
      <div class="shop-grid">
        ${ROOMS.map((r,i) => `
          <div class="shop-item">
            <strong>${r.name}</strong>
            <p>${i === 0 ? "Your starting room" : `Unlocks at level ${r.level}`}</p>
            <button class="${state.roomIndex === i ? "soft-button" : "primary"}" data-room="${i}" ${level < r.level ? "disabled" : ""}>
              ${state.roomIndex === i ? "Current room" : level < r.level ? "Locked" : "Use this room"}
            </button>
          </div>`).join("")}
      </div>
      <div class="button-row"><button id="themesDone" class="soft-button">Done</button></div>
    `);
    $("themesDone").onclick = closeModal;
    document.querySelectorAll("[data-room]").forEach(b => b.onclick = () => {
      const i = Number(b.dataset.room);
      const lv = 1 + Math.floor(state.xp / 100);
      if (!ROOMS[i] || lv < ROOMS[i].level) return;
      state.roomIndex = i;
      saveState();
      renderRoom();
      openBedroomThemes();
      toast("Room theme changed!");
    });
  }

  function openCalendar() {
    activeTab = "calendar";
    setActiveTab();
    const sorted = [...(state.assessments || [])].sort((a,b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
    openModal(`
      <p class="eyebrow">PLAN AHEAD, GENTLY</p>
      <h2>Assessment calendar</h2>
      <p class="edit-note">Add tests, assignments, presentations or other school deadlines. They are saved on this device.</p>
      <form id="assessmentForm" class="assessment-form">
        <label for="assessmentTitle">Assessment or task</label>
        <input id="assessmentTitle" maxlength="100" placeholder="e.g. Chemistry test" required>
        <div class="form-grid">
          <div><label for="assessmentSubject">Subject</label><input id="assessmentSubject" maxlength="50" placeholder="e.g. Science"></div>
          <div><label for="assessmentDate">Due date</label><input id="assessmentDate" type="date" required></div>
          <div><label for="assessmentType">Type</label><select id="assessmentType"><option>Test</option><option>Assignment</option><option>Presentation</option><option>Exam</option><option>Other</option></select></div>
        </div>
        <label for="assessmentNotes">Notes (optional)</label>
        <textarea id="assessmentNotes" rows="2" maxlength="300" placeholder="Topics to revise, what to bring, or progress notes"></textarea>
        <button class="primary" type="submit">Add to calendar +</button>
      </form>
      <h3>Your upcoming assessments</h3>
      <div class="assessment-list">
        ${sorted.length ? sorted.map(a => `
          <article class="assessment-entry">
            <div><strong>${escapeHtml(a.title)}</strong><p>${escapeHtml(a.subject || "No subject")} · ${escapeHtml(a.type || "Assessment")} · ${escapeHtml(a.date || "No date")}</p>${a.notes ? `<p>${escapeHtml(a.notes)}</p>` : ""}</div>
            <button class="icon-btn" type="button" data-delete-assessment="${a.id}" aria-label="Delete assessment">×</button>
          </article>`).join("") : '<p class="empty-state">Nothing planned yet — add your first assessment above.</p>'}
      </div>
      <div class="button-row"><button id="calendarDone" class="soft-button">Done</button></div>
    `);
    $("calendarDone").onclick = closeModal;
    $("assessmentForm").onsubmit = e => {
      e.preventDefault();
      const title = $("assessmentTitle").value.trim();
      const date = $("assessmentDate").value;
      if (!title || !date) return;
      state.assessments = Array.isArray(state.assessments) ? state.assessments : [];
      state.assessments.push({
        id: "assessment-" + Date.now() + "-" + Math.random().toString(36).slice(2,7),
        title,
        subject: $("assessmentSubject").value.trim(),
        date,
        type: $("assessmentType").value,
        notes: $("assessmentNotes").value.trim()
      });
      saveState();
      openCalendar();
      toast("Assessment added to your planner.");
    };
    document.querySelectorAll("[data-delete-assessment]").forEach(b => b.onclick = () => {
      state.assessments = (state.assessments || []).filter(a => a.id !== b.dataset.deleteAssessment);
      saveState();
      openCalendar();
      toast("Assessment removed.");
    });
  }

  function setActiveTab() {
    document.querySelectorAll(".tab").forEach(b =>
      b.classList.toggle("active", b.dataset.tab === activeTab)
    );
  }

  function handleTab(tab) {
    activeTab = tab;
    setActiveTab();

    if (tab === "bedroom") openBedroomThemes();
    if (tab === "decorate") openDecorate();
    if (tab === "shop") openShop();
    if (tab === "pets") openPets();
    if (tab === "buddy") openBuddy();
    if (tab === "focus") openFocusTools();
    if (tab === "calendar") openCalendar();
    if (tab === "history") openHistory();
    if (tab === "newquest") $("newQuest").click();
  }

  function openBuddy() {
    activeTab = "buddy";
    setActiveTab();

    openModal(`
      <p class="eyebrow">YOUR STUDY COMPANION</p>
      <h2>Talk to your AI study buddy</h2>
      <p class="edit-note">Connect a private backend endpoint to use an AI model. Do not put an OpenAI API key in this page or in app.js — anyone using the site could see it.</p>
      <label for="aiEndpointInput">Your backend chat endpoint (optional)</label>
      <input id="aiEndpointInput" placeholder="https://your-server.example/api/chat" value="${escapeHtml(state.aiEndpoint || "")}">
      <p class="small-muted">The endpoint should accept POST JSON like { "message": "...", "context": {...} } and return { "reply": "..." }. A small server example is described after the three files.</p>
      <div id="chatLog" class="chat-log">
        ${state.chat.map(m => `<div class="chat-msg ${m.role === "user" ? "user" : "bot"}">${escapeHtml(m.text)}</div>`).join("") || '<div class="chat-msg bot">Hi! I can help you break a task into smaller steps, explain a topic, or choose a study technique. Connect your endpoint to enable AI replies.</div>'}
      </div>
      <form id="chatForm" class="chat-form">
        <input id="chatInput" placeholder="Ask your buddy for help…" required>
        <button class="primary" type="submit">Send</button>
      </form>
      <div class="button-row">
        <button class="soft-button" id="saveEndpoint">Save endpoint</button>
        <button class="soft-button" id="closeBuddy">Close</button>
      </div>
    `);

    $("saveEndpoint").onclick = () => {
      state.aiEndpoint = $("aiEndpointInput").value.trim();
      saveState();
      toast("Endpoint setting saved.");
    };

    $("closeBuddy").onclick = closeModal;

    $("chatForm").onsubmit = async e => {
      e.preventDefault();

      const input = $("chatInput");
      const message = input.value.trim();
      if (!message) return;

      state.chat.push({role:"user",text:message});
      saveState();

      const log = $("chatLog");
      log.innerHTML = state.chat.map(m =>
        `<div class="chat-msg ${m.role === "user" ? "user" : "bot"}">${escapeHtml(m.text)}</div>`
      ).join("");

      input.value = "";

      if (!state.aiEndpoint) {
        state.chat.push({
          role:"assistant",
          text:"I’m ready to help, but the AI connection hasn’t been configured yet. For now, try asking me to make the task smaller: choose one action you can finish in five minutes, and begin there."
        });
        saveState();
        openBuddy();
        return;
      }

      try {
        const res = await fetch(state.aiEndpoint, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            message,
            context:{
              mood:state.mood,
              goal:state.goal,
              mode:state.mode,
              tasks:state.tasks.filter(t => !t.done).map(t => ({title:t.title,priority:t.priority})),
              technique:selectedTechnique,
              notes:state.notes
            }
          })
        });

        if (!res.ok) throw new Error("Server returned " + res.status);

        const data = await res.json();
        state.chat.push({
          role:"assistant",
          text:String(data.reply || data.message || "I couldn't find a reply in the server response.")
        });
      } catch (err) {
        state.chat.push({
          role:"assistant",
          text:"I couldn’t reach the AI server. Check that your endpoint is online, allows requests from this site, and returns JSON with a “reply” field."
        });
      }

      saveState();
      openBuddy();
    };
  }

  function openFocusTools() {
    activeTab = "focus";
    setActiveTab();

    openModal(`
      <p class="eyebrow">FOCUS MODE</p>
      <h2>Make distractions a little harder</h2>
      <p class="edit-note">A normal mobile website cannot silently lock other iPhone apps or suppress system notifications. These options are reminders and shortcuts; full app blocking needs iOS Screen Time / Focus permissions or a native app.</p>
      <label class="setting-row">
        <input id="focusPhoneAway" type="checkbox" ${state.focusSettings.phoneAway ? "checked" : ""}>
        <span><strong>Put my phone away</strong><br>Keep the phone out of reach or turn it face down.</span>
      </label>
      <label class="setting-row">
        <input id="focusNotifications" type="checkbox" ${state.focusSettings.notifications ? "checked" : ""}>
        <span><strong>Silence notifications</strong><br>Open iPhone Focus settings and enable Do Not Disturb or a study Focus.</span>
      </label>
      <label class="setting-row">
        <input id="focusChecklist" type="checkbox" ${state.focusSettings.checklist ? "checked" : ""}>
        <span><strong>Focus checklist complete</strong><br>I closed distracting tabs and opened only what I need.</span>
      </label>
      <div class="button-row">
        <button id="iosFocusHelp" class="primary">How to set up iPhone Focus</button>
        <button id="saveFocus" class="soft-button">Save checklist</button>
      </div>
      <p class="small-muted">On iPhone: open Settings → Focus → Do Not Disturb (or create a Study Focus) → choose allowed people/apps and customise Home Screen. You can also add Balance Quest to your Home Screen from Safari’s Share menu.</p>
    `);

    $("saveFocus").onclick = () => {
      state.focusSettings = {
        phoneAway:$("focusPhoneAway").checked,
        notifications:$("focusNotifications").checked,
        checklist:$("focusChecklist").checked
      };
      saveState();
      closeModal();
      toast("Focus checklist saved.");
    };

    $("iosFocusHelp").onclick = () =>
      toast("Open iPhone Settings → Focus to set up a study Focus.");
  }

 
  function openHistory() {
    activeTab = "history";
    setActiveTab();

    const entries = (Array.isArray(state.reflections) ? state.reflections : [])
      .map((entry, index) => ({ ...entry, _index: index }))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const body = entries.length ? entries.map(entry => {
      const date = entry.date ? new Date(entry.date) : null;
      const dateLabel = date && !Number.isNaN(date.getTime())
        ? date.toLocaleString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
          })
        : "Date not recorded";

      const tasks = Array.isArray(entry.tasks) ? entry.tasks : [];
      const taskSummary = tasks.length
        ? `<div class="history-task-list">${tasks.map(task =>
            `<div class="history-task ${task.done ? "is-done" : ""}">
              <span>${task.done ? "✓" : "○"}</span>
              <span>${escapeHtml(task.title || "Untitled task")}</span>
              <small>${task.done ? "Complete" : "Not completed"}</small>
            </div>`
          ).join("")}</div>`
        : '<p class="small-muted">No task details were saved for this check-in.</p>';

      return `
        <div class="history-entry-wrap">
          <details class="history-entry">
            <summary>
              <span class="history-date">${escapeHtml(dateLabel)}</span>
              <span class="history-mood">${escapeHtml(entry.mood || "Mood not recorded")}</span>
            </summary>
            <div class="history-entry-body">
              <p><strong>Reflection</strong><br>${escapeHtml(entry.reflection || "No reflection note was added.")}</p>
              <p><strong>Note for next time</strong><br>${escapeHtml(entry.nextNote || "No note saved.")}</p>
              <p><strong>Tasks</strong></p>
              ${taskSummary}
            </div>
          </details>
          <button
            type="button"
            class="history-delete"
            data-delete-checkin="${entry._index}"
            aria-label="Delete check-in from ${escapeHtml(dateLabel)}"
            title="Delete this check-in"
          >×</button>
        </div>`;
    }).join("") : `
      <div class="history-empty">
        <div class="history-empty-icon">🌷</div>
        <h3>Your check-in journal starts here</h3>
        <p>After you finish a quest and save a check-in, it will appear here with the date, mood, reflection, tasks and next-time note.</p>
      </div>`;

    openModal(`
      <p class="eyebrow">YOUR REFLECTION JOURNAL</p>
      <h2>Past check-ins</h2>
      <p class="edit-note">Your saved check-ins are stored in this browser on this device. Open any entry to read the reflection and see the tasks you recorded. Use × to delete an entry.</p>
      <div class="history-count">${entries.length} saved ${entries.length === 1 ? "check-in" : "check-ins"}</div>
      <div class="history-list">${body}</div>
      <div class="button-row">
        <button id="closeHistory" class="primary">Done</button>
      </div>
    `);

    $("modalContent").querySelectorAll("[data-delete-checkin]").forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.deleteCheckin);

        if (!Number.isInteger(index) || index < 0 || index >= state.reflections.length) {
          return;
        }

        if (!window.confirm("Delete this past check-in? This cannot be undone.")) {
          return;
        }

        state.reflections.splice(index, 1);
        saveState();
        openHistory();
        toast("Past check-in deleted.");
      });
    });

    $("closeHistory").onclick = closeModal;
  }


  function openAvatarEditor() {
    openModal(`
      <p class="eyebrow">YOUR BUDDY</p>
      <h2>Customise your avatar</h2>
      <p class="edit-note">Your changes will show up in the bedroom and break activities.</p>
      <div class="form-grid">
        <div><label>Name</label><input id="editName" value="${escapeHtml(state.avatar.name)}" maxlength="24"></div>
        <div><label>Skin tone</label><select id="editSkin">${optionList([
          ["#f6d2b5","Warm light"],["#e8b58f","Golden"],["#c98961","Caramel"],
          ["#8b573f","Deep brown"],["#f0c4a7","Peach"],["#d9a17e","Tan"]
        ],state.avatar.skin)}</select></div>
        <div><label>Hairstyle</label><select id="editHair">${optionList([
          ["bob","Soft bob"],["long","Long hair"],["curly","Curly"],
          ["bun","High bun"],["short","Short"],["ponytail","Ponytail"]
        ],state.avatar.hair)}</select></div>
        <div><label>Hair colour</label><select id="editHairColor">${optionList([
          ["#5b3a32","Chocolate brown"],["#2b2528","Black"],["#a86e43","Chestnut"],
          ["#d6a75d","Honey blonde"],["#9a6bb5","Lilac"],["#d77d9d","Rose"],
          ["#536f80","Blue-grey"]
        ],state.avatar.hairColor)}</select></div>
        <div><label>Eyes</label><select id="editEyes">${optionList([
          ["#44312b","Brown"],["#527d75","Green"],["#6487b7","Blue"],["#8a6ca8","Violet"]
        ],state.avatar.eyes)}</select></div>
        <div><label>Outfit</label><select id="editOutfit">${optionList([
          ["#e9a9c6","Pink hoodie"],["#c6b5e8","Lilac jumper"],["#9abbdc","Blue pyjamas"],
          ["#a9d3bd","Mint sweater"],["#f0bf9e","Peach outfit"],["#f1d987","Butter-yellow tee"],
          ["#d6a4a1","Rose cardigan"]
        ],state.avatar.outfit)}</select></div>
        <div><label>Accessory</label><select id="editAccessory">${optionList([
          ["none","None"],["bow","Hair bow"],
          ["headphones","Headphones"],["flower","Flower clip"]
        ],state.avatar.accessory)}</select></div>
      </div>
      <div class="button-row">
        <button id="saveAvatar" class="primary">Save avatar</button>
        <button id="cancelAvatar" class="soft-button">Cancel</button>
      </div>
    `);

    $("cancelAvatar").onclick = closeModal;

    $("saveAvatar").onclick = () => {
      state.avatar = {
        ...state.avatar,
        name:$("editName").value.trim() || "Mochi",
        skin:$("editSkin").value,
        hair:$("editHair").value,
        hairColor:$("editHairColor").value,
        eyes:$("editEyes").value,
        outfit:$("editOutfit").value,
        accessory:$("editAccessory").value
      };

      saveState();
      renderAvatar();
      renderStats();
      closeModal();
      toast("Avatar updated ✿");
    };
  }

  function optionList(list, selected) {
    return list.map(([v,l]) =>
      `<option value="${v}" ${v === selected ? "selected" : ""}>${l}</option>`
    ).join("");
  }

  function enterBedroom() {
    state.mood = document.querySelector("[data-mood].selected")?.dataset.mood || state.mood;
    state.goal = $("goalInput").value.trim() || "Feel prepared and calm";
    state.mode = $("modeSelect").value;
    state.sessionMinutes = Math.max(5, Math.min(180, parseInt($("focusInput").value, 10) || 25));
    state.notes = $("notesInput").value.trim();

    state.avatar = {
      name:$("avatarName").value.trim() || "Mochi",
      skin:$("skinSelect").value,
      hair:$("hairSelect").value,
      hairColor:$("hairColor").value,
      eyes:$("eyeSelect").value,
      outfit:$("outfitSelect").value,
      accessory:$("accessorySelect").value,
      pronouns:$("avatarPronouns").value
    };

    if (!state.tasks.length) {
      toast("Add at least one task first.");
      return;
    }

    state.started = true;
    state.timer.remaining = state.sessionMinutes * 60;
    $("timerMinutes").value = state.sessionMinutes;

    saveState();
    renderAvatar();
    renderTasks();
    renderRoom();
    showScreen("bedroomScreen");
    startIntervals();
  }

  function restoreSetup() {
    document.querySelectorAll("[data-mood]").forEach(b =>
      b.classList.toggle("selected", b.dataset.mood === state.mood)
    );

    $("goalInput").value = state.goal;
    $("modeSelect").value = state.mode;
    $("focusInput").value = state.sessionMinutes;
    $("avatarName").value = state.avatar.name;
    $("skinSelect").value = state.avatar.skin;
    $("hairSelect").value = state.avatar.hair;
    $("hairColor").value = state.avatar.hairColor;
    $("eyeSelect").value = state.avatar.eyes;
    $("outfitSelect").value = state.avatar.outfit;
    $("accessorySelect").value = state.avatar.accessory;
    $("avatarPronouns").value = state.avatar.pronouns;
    $("notesInput").value = "";

    renderAvatar();
    renderTasks();
  }

  function restoreFinal() {
    document.querySelectorAll("[data-final-mood]").forEach(b =>
      b.classList.toggle("selected", b.dataset.finalMood === state.finalMood)
    );
  }

  function init() {
    if (!state.started) {
  state.tasks = [];
  state.notes = "";
  saveState();
}
restoreSetup();
    renderRoom();
    updateTimerUI();
    restoreFinal();

    if (state.started) {
      showScreen("bedroomScreen");

      if (state.timer.running && state.timer.endAt) {
        syncTimerFromClock();
        startIntervals();
      }

      if (state.break.running && state.break.endAt) {
        $("inRoomBreakPanel").classList.remove("hidden");
        updateBreakActivity(state.break.activity || "Breathing");
        renderBreakControls();

        if (breakInterval) clearInterval(breakInterval);
        breakInterval = setInterval(tickBreak, 500);
      } else if (state.break.mandatory) {
        $("inRoomBreakPanel").classList.remove("hidden");
        updateBreakActivity(state.break.activity || "Breathing");
        renderBreakControls();
      }
    } else {
      showScreen("setupScreen");
    }
  }

  $("moodOptions").addEventListener("click", e => {
    const b = e.target.closest("[data-mood]");
    if (!b) return;

    document.querySelectorAll("[data-mood]").forEach(x =>
      x.classList.toggle("selected", x === b)
    );

    state.mood = b.dataset.mood;
    saveState();
  });

  $("taskForm").addEventListener("submit", e => {
    e.preventDefault();
    addTask($("taskInput").value, $("taskPriority").value);
    $("taskInput").value = "";
  });

  $("setupTaskList").addEventListener("click", e => {
    const del = e.target.closest("[data-delete]");
    const move = e.target.closest("[data-move]");

    if (del) {
      state.tasks = state.tasks.filter(t => t.id !== del.dataset.delete);
      renderTasks();
    }

    if (move) moveTask(move.dataset.id, Number(move.dataset.move));
  });

  $("setupTaskList").addEventListener("dragstart", e => {
    const row = e.target.closest("[data-task-id]");
    if (row) e.dataTransfer.setData("text/plain", row.dataset.taskId);
  });

  $("setupTaskList").addEventListener("dragover", e => e.preventDefault());

  $("setupTaskList").addEventListener("drop", e => {
    e.preventDefault();

    const target = e.target.closest("[data-task-id]");
    const from = e.dataTransfer.getData("text/plain");

    if (!target || !from || from === target.dataset.taskId) return;

    const a = state.tasks.findIndex(t => t.id === from);
    const b = state.tasks.findIndex(t => t.id === target.dataset.taskId);

    if (a >= 0 && b >= 0) {
      const [item] = state.tasks.splice(a, 1);
      state.tasks.splice(b, 0, item);
      renderTasks();
    }
  });

  $("bedroomTaskList").addEventListener("change", e => {
    const box = e.target.closest("[data-complete]");

    if (box && box.checked) {
      completeTask(box.dataset.complete);
    } else if (box) {
      const t = state.tasks.find(t => t.id === box.dataset.complete);
      if (t) t.done = false;
      renderTasks();
    }
  });

  $("startQuest").onclick = enterBedroom;

  $("startStudyBtn").onclick = startStudyTimer;
  $("deskStudyBtn").onclick = () => {
    startStudyTimer();
    $("timerDisplay").scrollIntoView({behavior:"smooth",block:"center"});
  };

  $("timerStart").onclick = startStudyTimer;
  $("timerPause").onclick = pauseStudyTimer;
  $("timerReset").onclick = resetStudyTimer;

  $("applyTimer").onclick = () => {
    if (state.timer.running) {
      toast("Pause the timer before changing its length.");
      return;
    }

    state.sessionMinutes = Math.max(1, Math.min(240, parseInt($("timerMinutes").value, 10) || 25));
    state.timer.remaining = state.sessionMinutes * 60;
    saveState();
    updateTimerUI();
    toast("Timer length updated.");
  };

  $("roomPet").onclick = () => {
    const pet = PETS.find(p => p.id === state.activePet && state.ownedPets.includes(p.id));
    if (!pet) return;

    const el = $("roomPet");
    el.classList.remove("pet-happy");
    void el.offsetWidth;
    el.classList.add("pet-happy");

    if (state.break.activity === "Spend time with an animal") {
      $("avatarInRoom").classList.add("playing-with-pet");
      toast(`${state.avatar.name} is playing with ${pet.name}!`);
      setTimeout(() => $("avatarInRoom").classList.remove("playing-with-pet"), 1000);
    } else {
      toast(`${pet.name} hops over to say hello!`);
    }

    setTimeout(() => el.classList.remove("pet-happy"), 900);
  };

  $("bedRestBtn").onclick = () => {
    state.energy = Math.min(100, state.energy + 15);
    state.focus = Math.min(100, state.focus + 8);
    beginBreak(false, "Take a gentle pause on your bed.", "Cosy rest");
  };

  $("openBreakBtn").onclick = () => beginBreak(false, "Choose one of the 10 ways to reset.");

  document.querySelectorAll("[data-break-activity]").forEach(b =>
    b.addEventListener("click", () => updateBreakActivity(b.dataset.breakActivity))
  );

  $("breakStart").onclick = () => startBreakTimer(false);
  $("breakFinish").onclick = finishBreakEarly;

  $("hideBreakPanel").onclick = () => {
    if (state.break.running) {
      toast("Your break timer is running — let it finish.");
      return;
    }

    $("inRoomBreakPanel").classList.add("hidden");
    $("activityProps")?.replaceChildren();
    $("roomPet").classList.remove("pet-playing");
    $("roomActionLabel").textContent = "Your room, your pace";

    $("avatarInRoom").className = "room-avatar pose-idle" +
      (state.avatar.accessory !== "none" ? " accessory-" + state.avatar.accessory : "");
    setAvatarVars($("avatarInRoom"));
  };

  document.querySelectorAll(".technique").forEach(b => b.onclick = () => {
    selectedTechnique = b.dataset.technique;
    document.querySelectorAll(".technique").forEach(x =>
      x.classList.toggle("selected", x === b)
    );

    $("techniquePrompt").innerHTML =
      `<strong>${escapeHtml(selectedTechnique)}:</strong> ${escapeHtml(TECHNIQUES[selectedTechnique])}`;
  });

  document.querySelectorAll(".tab").forEach(b =>
    b.onclick = () => handleTab(b.dataset.tab)
  );

  $("editAvatarBtn").onclick = openAvatarEditor;

  $("addTaskQuick").onclick = () => {
    openModal(`
      <h2>Add a task</h2>
      <label for="quickTaskInput">Task name</label>
      <input id="quickTaskInput" placeholder="What do you need to do?">
      <label for="quickPriority">Priority</label>
      <select id="quickPriority">
        <option>High</option>
        <option selected>Medium</option>
        <option>Low</option>
      </select>
      <div class="button-row">
        <button id="quickAddSave" class="primary">Add task</button>
        <button id="quickAddCancel" class="soft-button">Cancel</button>
      </div>
    `);

    $("quickAddCancel").onclick = closeModal;

    $("quickAddSave").onclick = () => {
      addTask($("quickTaskInput").value, $("quickPriority").value);
      closeModal();
      renderTasks();
    };
  };

  $("modalClose").onclick = closeModal;

  $("modalBackdrop").addEventListener("click", e => {
    if (e.target === $("modalBackdrop")) closeModal();
  });

  $("finalMoodOptions").addEventListener("click", e => {
    const b = e.target.closest("[data-final-mood]");
    if (!b) return;

    state.finalMood = b.dataset.finalMood;
    document.querySelectorAll("[data-final-mood]").forEach(x =>
      x.classList.toggle("selected", x === b)
    );
    saveState();
  });

  $("viewPastCheckinsFinal").onclick = openHistory;
  $("returnToBedroom").onclick = () => {
  showScreen("bedroomScreen");
  renderRoom();
};

  $("finishQuest").onclick = () => {
    const reflection = {
      date:new Date().toISOString(),
      mood:state.finalMood,
      reflection:$("finalReflection").value.trim(),
      nextNote:$("nextTimeNote").value.trim(),
      tasks:state.tasks.map(t => ({title:t.title,done:t.done}))
    };

    state.reflections.push(reflection);
    state.lastNote = reflection.nextNote;
    saveState();

    $("completionText").textContent =
      `You checked in as “${state.finalMood}”. ${reflection.reflection || "You took time to notice your progress."}${reflection.nextNote ? " Next time note: " + reflection.nextNote : ""}`;

    $("completionCard").classList.remove("hidden");
    $("finishQuest").classList.add("hidden");
    $("finalReflection").disabled = true;
    $("nextTimeNote").disabled = true;
    toast("Check-in saved on this device.");
  };

  $("newQuest").onclick = () => {
    state.tasks = [];
state.notes = "";
    state.started = false;
    state.energy = 100;
    state.focus = 100;

    state.timer = {
      running:false,
      mode:"study",
      endAt:null,
      remaining:state.sessionMinutes * 60,
      studySince:null,
      studyElapsed:0,
      breaksTaken:0
    };

    $("finalReflection").disabled = false;
    $("nextTimeNote").disabled = false;
    $("finalReflection").value = "";
    $("nextTimeNote").value = state.lastNote || "";
    $("completionCard").classList.add("hidden");
    $("finishQuest").classList.remove("hidden");

    restoreSetup();
    showScreen("setupScreen");
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (state.timer.running) syncTimerFromClock();
      if (state.break.running) tickBreak();
      renderStats();
    }
  });

  window.addEventListener("pagehide", saveState);
  init();
})();