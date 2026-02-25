// ============================================
// LANGUAGE SYSTEM — Hebrew / English
// ============================================

const TRANSLATIONS = {
  en: {
    // Menu
    title: 'SPACE BETRAYAL',
    subtitle: 'A social deduction game',
    enterName: 'Enter your name',
    createGame: 'Create Game',
    roomCode: 'Room code',
    joinGame: 'Join Game',
    spectate: 'Spectate',
    browseRooms: 'Browse Rooms',
    stats: 'Stats',
    achievements: 'Achievements',
    installApp: 'Install App',
    iosInstallHint: 'Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install',
    master: 'Master',
    sfx: 'SFX',
    music: 'Music',

    // Lobby
    lobby: 'LOBBY',
    roomCodeLabel: 'Room Code:',
    shareCode: 'Share this code with friends',
    players10: (n) => `${n} / 10 players`,
    host: 'HOST',
    startGame: 'Start Game',
    waitingForHost: 'Waiting for host to start...',
    uploadPhoto: 'Upload Photo',
    noPhoto: 'No photo',
    uploaded: 'Uploaded!',
    tooLarge: 'Too large',
    hat: 'Hat',
    outfit: 'Outfit',
    pet: 'Pet',
    face: 'Face',

    // Settings
    gameSettings: 'GAME SETTINGS',
    impostors: 'Impostors:',
    killCooldown: 'Kill Cooldown:',
    playerSpeed: 'Player Speed:',
    tasks: 'Tasks:',
    discussion: 'Discussion:',
    voting: 'Voting:',
    crewVision: 'Crew Vision:',
    impostorVision: 'Impostor Vision:',
    confirmEjects: 'Confirm Ejects:',
    anonymousVotes: 'Anonymous Votes:',
    specialRoles: 'Special Roles:',
    map: 'Map:',
    publicRoom: 'Public Room:',
    makePublic: 'Make Public',
    on: 'On',
    off: 'Off',
    slow: 'Slow',
    normal: 'Normal',
    fast: 'Fast',
    veryFast: 'Very Fast',
    theSkeld: 'The Skeld',
    spaceStationBeta: 'Space Station Beta',

    // Meeting
    reportedBody: (name) => `${name} reported a dead body!`,
    calledMeeting: (name) => `${name} called an Emergency Meeting!`,
    discussionPhase: 'Discussion phase - talk it out!',
    voteNow: 'Vote now!',
    skipVote: 'Skip Vote',
    typeMessage: 'Type a message...',
    send: 'Send',

    // Voting results
    votingResults: 'VOTING RESULTS',
    noOneEjected: 'No one was ejected.',
    skipped: '(Skipped)',
    wasEjected: (name) => `${name} was ejected.`,
    wasImpostor: (name) => `${name} was an Impostor.`,
    wasNotImpostor: (name) => `${name} was not an Impostor.`,

    // Game over
    crewmatesWin: 'CREWMATES WIN',
    impostorsWin: 'IMPOSTORS WIN',
    dead: '(dead)',
    backToLobby: 'Back to Lobby',
    leaveRoom: 'Leave Room',
    waitingNextRound: 'Waiting for host to start next round...',

    // HUD / Canvas
    impostor: 'IMPOSTOR',
    crewmate: 'CREWMATE',
    ghost: 'GHOST',
    spectating: 'SPECTATING',
    tasksLabel: 'Tasks:',
    tasksPercent: (p) => `Tasks: ${p}%`,
    killCooldownHUD: (s) => `Kill: ${s}s`,
    fellowImpostor: (names) => `Fellow impostor: ${names}`,
    completeTasksFindImpostor: 'Complete your tasks. Find the impostor.',

    // Action buttons
    kill: 'KILL',
    report: 'REPORT',
    use: 'USE',
    emergency: 'EMERGENCY',
    vent: 'VENT',
    sabo: 'SABO',
    door: 'DOOR',
    fix: 'FIX',
    shoot: 'SHOOT',
    vitals: 'VITALS',
    cams: 'CAMS',
    exitCam: 'EXIT CAM',
    admin: 'ADMIN',

    // Sabotage menu
    sabotage: 'SABOTAGE',
    lightsLabel: 'Lights',
    lightsCut: 'Cut the lights',
    o2Label: 'O2',
    o2Deplete: 'Deplete oxygen (45s)',
    reactorLabel: 'Reactor',
    reactorMeltdown: 'Meltdown (60s)',

    // Sabotage alerts
    saboLightsAlert: 'LIGHTS SABOTAGED',
    saboO2Alert: 'O2 DEPLETING',
    saboReactorAlert: 'REACTOR MELTDOWN',

    // Cameras / Admin / Vitals
    securityCameras: 'SECURITY CAMERAS',
    pressToClose: 'Press [C] or EXIT CAM button to close',
    adminTable: 'ADMIN TABLE',
    empty: 'empty',
    vitalsTitle: 'VITALS',
    alive: 'ALIVE',
    deadStatus: 'DEAD',

    // Roles
    sheriffRole: 'SHERIFF - You can attempt to kill!',
    engineerRole: 'ENGINEER - You can use vents!',
    scientistRole: 'SCIENTIST - You can check vitals!',

    // Task names
    fixWiring: 'Fix Wiring',
    swipeCard: 'Swipe Card',
    clearAsteroids: 'Clear Asteroids',
    downloadData: 'Download Data',
    fuelEngines: 'Fuel Engines',
    calibrateDistributor: 'Calibrate Distributor',
    simonSays: 'Simon Says',
    unlockSafe: 'Unlock Safe',
    emptyTrash: 'Empty Trash',
    solveMaze: 'Solve Maze',
    memoryMatch: 'Memory Match',
    connectPipes: 'Connect Pipes',
    tracePattern: 'Trace Pattern',
    medScan: 'MedBay Scan',
    crackSafe: 'Crack Safe',

    // Task instructions
    swipeInstruction: '→ SWIPE →',
    accepted: 'Accepted!',
    tooFast: 'Too fast. Try again.',
    tooSlow: 'Too slow. Try again.',
    dragCard: 'Drag card from left to right',
    download: 'Download',
    holdToFill: 'HOLD TO\nFILL',
    fillToRedLine: 'Fill to the red line, then release',
    clickGreenZone: 'Click when needle is in green zone',
    holdLeverTrash: 'Hold lever to empty trash',
    done: 'Done!',

    // Quick messages
    followMe: 'Follow me',
    iSawSomething: 'I saw something',
    where: 'Where?',
    trustMe: 'Trust me',
    sus: 'Sus!',
    iWasIn: 'I was in...',
    help: 'Help!',
    letsGo: "Let's go",

    // Stats
    playerStats: 'PLAYER STATS',
    gamesPlayed: 'Games Played',
    gamesWon: 'Games Won',
    timesImpostor: 'Times Impostor',
    impostorWins: 'Impostor Wins',
    totalKills: 'Total Kills',
    tasksCompleted: 'Tasks Completed',
    meetingsCalled: 'Meetings Called',
    bodiesReported: 'Bodies Reported',
    ventsUsed: 'Vents Used',
    sabotages: 'Sabotages',
    chatMessages: 'Chat Messages',
    gamesSurvived: 'Games Survived',
    close: 'Close',

    // Room browser
    publicRoomsTitle: 'PUBLIC ROOMS',
    onlyPublicShown: 'Only rooms set to Public are shown',
    refresh: 'Refresh',
    noRooms: 'No public rooms available',
    inLobby: 'In Lobby',
    inProgress: 'In Progress',
    join: 'Join',

    // Achievements
    achievementUnlocked: (name) => `Achievement Unlocked: ${name}`,
    achieveFirstBlood: 'First Blood',
    achieveFirstBloodDesc: 'Get your first kill as impostor',
    achieveSerialKiller: 'Serial Killer',
    achieveSerialKillerDesc: 'Get 10 total kills',
    achieveTaskMaster: 'Task Master',
    achieveTaskMasterDesc: 'Complete 50 total tasks',
    achieveVeteran: 'Veteran',
    achieveVeteranDesc: 'Play 10 games',
    achieveWinner: 'Winner',
    achieveWinnerDesc: 'Win 5 games',
    achieveChampion: 'Champion',
    achieveChampionDesc: 'Win 20 games',
    achieveDetective: 'Detective',
    achieveDetectiveDesc: 'Vote out the impostor 5 times',
    achieveSurvivor: 'Survivor',
    achieveSurvivorDesc: 'Survive 10 games as crewmate',
    achieveMasterDeception: 'Master of Deception',
    achieveMasterDeceptionDesc: 'Win 5 games as impostor',
    achieveEmergency: 'Emergency!',
    achieveEmergencyDesc: 'Call 5 emergency meetings',
    achieveSocial: 'Social Butterfly',
    achieveSocialDesc: 'Send 50 chat messages',
    achieveBodyFinder: 'Body Finder',
    achieveBodyFinderDesc: 'Report 10 bodies',
    achieveVentRat: 'Vent Rat',
    achieveVentRatDesc: 'Use vents 20 times',
    achieveSaboteur: 'Saboteur',
    achieveSaboteurDesc: 'Trigger 10 sabotages',
    achieveSheriffStar: 'Sheriff Star',
    achieveSheriffStarDesc: 'Correctly shoot an impostor as Sheriff',

    // Room names (alpha)
    Cafeteria: 'Cafeteria',
    'Upper Engine': 'Upper Engine',
    MedBay: 'MedBay',
    Weapons: 'Weapons',
    Security: 'Security',
    Storage: 'Storage',
    O2: 'O2',
    Electrical: 'Electrical',
    'Lower Engine': 'Lower Engine',
    Shields: 'Shields',
    Navigation: 'Navigation',
    Kitchen: 'Kitchen',

    // Room names (beta)
    'Central Hub': 'Central Hub',
    Bridge: 'Bridge',
    'Reactor Core': 'Reactor Core',
    Observatory: 'Observatory',
    Laboratory: 'Laboratory',
    Armory: 'Armory',
    Communications: 'Communications',
    'Cargo Bay': 'Cargo Bay',
    'Life Support': 'Life Support',
    Greenhouse: 'Greenhouse',
    Airlock: 'Airlock',

    // Cosmetics
    hatNone: 'None', hatCrown: 'Crown', hatTophat: 'Top Hat', hatPartyhat: 'Party Hat',
    hatChef: 'Chef Hat', hatHeadband: 'Headband', hatFlower: 'Flower', hatDevil: 'Devil Horns',
    hatHalo: 'Halo', hatBeanie: 'Beanie', hatAntenna: 'Antenna', hatPirate: 'Pirate Hat',
    hatGlasses: 'Glasses', hatSunglasses: 'Sunglasses', hatHeadphones: 'Headphones', hatCap: 'Cap',
    hatWizard: 'Wizard Hat', hatCowboy: 'Cowboy Hat', hatNinja: 'Ninja Mask', hatSanta: 'Santa Hat',
    hatWitch: 'Witch Hat', hatElfhat: 'Elf Hat', hatBunnyears: 'Bunny Ears', hatPumpkin: 'Pumpkin',

    outfitNone: 'None', outfitSuit: 'Suit', outfitLabcoat: 'Lab Coat', outfitMilitary: 'Military',
    outfitScarf: 'Scarf', outfitCape: 'Cape', outfitToolbelt: 'Tool Belt', outfitAstronaut: 'Astronaut',
    outfitHoodie: 'Hoodie', outfitPolice: 'Police', outfitPirate: 'Pirate', outfitNinja: 'Ninja',

    petNone: 'None', petMiniCrewmate: 'Mini Crewmate', petDog: 'Dog', petCat: 'Cat',
    petRobot: 'Robot', petAlien: 'Alien', petHamster: 'Hamster',

    // Friends
    friends: 'Friends',
    yourCode: 'Your Code:',
    addFriend: 'Add',
    friendCodePlaceholder: 'Friend code',
    online: 'Online',
    offline: 'Offline',
    joinFriend: 'Join',
    noFriends: 'No friends added yet',
    friendAdded: 'Friend added!',
    friendRemoved: 'Removed',

    // Replay
    watchReplay: 'Watch Replay',
    replayLoading: 'Loading replay...',
    replayNoData: 'No replay data available',

    // Drawing board
    draw: 'Draw:',
    eraser: 'Eraser',
    clearBoard: 'Clear',

    // Daily Challenges
    dailyChallenges: 'Daily Challenges',
    challengeStreak: (n) => `Streak: ${n} days`,
    stars: (n) => `Stars: ${n}`,
    challengeComplete: 'Complete!',
    challengeWinImpostor: 'Win a game as impostor',
    challengeWinCrewmate: 'Win a game as crewmate',
    challengeComplete5Tasks: 'Complete 5 tasks',
    challengeComplete10Tasks: 'Complete 10 tasks',
    challengeSurvive: 'Survive a full game',
    challengeGet2Kills: 'Get 2 kills in one game',
    challengeReport: 'Report a dead body',
    challengeCallMeeting: 'Call an emergency meeting',
    challengePlay3Games: 'Play 3 games',
    challengeUseVent: 'Use a vent',
    challengeSendChat: 'Send 5 chat messages',
    challengeWinGame: 'Win a game',
    allChallengesBonus: 'All 3 done! +3 bonus stars',

    // Game modes
    gameMode: 'Game Mode:',
    modeClassic: 'Classic',
    modeHideSeek: 'Hide & Seek',
    modeSpeedRun: 'Speed Run',
    modeInfection: 'Infection',
    hideSeekImpostorRevealed: 'The impostor is revealed! RUN!',
    hideSeekYouAreHunter: 'You are the HUNTER! Everyone can see you!',
    speedRunCoopMode: 'Co-op Mode - Complete all tasks!',
    speedRunTimer: (s) => `Time: ${s}s`,
    infectionSurvive: 'Survive! Infected players hunt you!',
    youWereInfected: 'You have been INFECTED!',
    infectedCount: (n, total) => `Infected: ${n}/${total}`,
    headStart: (s) => `Head start: ${s}s`,

    // Language
    language: 'Language',
  },

  he: {
    // Menu
    title: 'בגידה בחלל',
    subtitle: 'משחק ניחוש חברתי',
    enterName: 'הכנס את שמך',
    createGame: 'צור משחק',
    roomCode: 'קוד חדר',
    joinGame: 'הצטרף',
    spectate: 'צפה',
    browseRooms: 'דפדף בחדרים',
    stats: 'סטטיסטיקות',
    achievements: 'הישגים',
    installApp: 'התקן אפליקציה',
    iosInstallHint: 'לחץ על <strong>שתף</strong> ואז <strong>הוסף למסך הבית</strong> להתקנה',
    master: 'ראשי',
    sfx: 'אפקטים',
    music: 'מוזיקה',

    // Lobby
    lobby: 'לובי',
    roomCodeLabel: 'קוד חדר:',
    shareCode: 'שתף את הקוד עם חברים',
    players10: (n) => `${n} / 10 שחקנים`,
    host: 'מארח',
    startGame: 'התחל משחק',
    waitingForHost: 'ממתין למארח...',
    uploadPhoto: 'העלה תמונה',
    noPhoto: 'אין תמונה',
    uploaded: 'הועלה!',
    tooLarge: 'גדול מדי',
    hat: 'כובע',
    outfit: 'לבוש',
    pet: 'חיית מחמד',
    face: 'פנים',

    // Settings
    gameSettings: 'הגדרות משחק',
    impostors: 'מתחזים:',
    killCooldown: 'זמן המתנה להריגה:',
    playerSpeed: 'מהירות שחקן:',
    tasks: 'משימות:',
    discussion: 'דיון:',
    voting: 'הצבעה:',
    crewVision: 'שדה ראייה צוות:',
    impostorVision: 'שדה ראייה מתחזה:',
    confirmEjects: 'אישור הדחה:',
    anonymousVotes: 'הצבעה אנונימית:',
    specialRoles: 'תפקידים מיוחדים:',
    map: 'מפה:',
    publicRoom: 'חדר פתוח:',
    makePublic: 'הפוך לפתוח',
    on: 'פעיל',
    off: 'כבוי',
    slow: 'איטי',
    normal: 'רגיל',
    fast: 'מהיר',
    veryFast: 'מהיר מאוד',
    theSkeld: 'The Skeld',
    spaceStationBeta: 'תחנת חלל בטא',

    // Meeting
    reportedBody: (name) => `${name} מצא גופה!`,
    calledMeeting: (name) => `${name} זימן אסיפת חירום!`,
    discussionPhase: 'שלב דיון - דברו על זה!',
    voteNow: '!הצביעו עכשיו',
    skipVote: 'דלג על הצבעה',
    typeMessage: '...כתוב הודעה',
    send: 'שלח',

    // Voting results
    votingResults: 'תוצאות ההצבעה',
    noOneEjected: 'אף אחד לא הודח.',
    skipped: '(דילוג)',
    wasEjected: (name) => `${name} הודח.`,
    wasImpostor: (name) => `${name} היה מתחזה.`,
    wasNotImpostor: (name) => `${name} לא היה מתחזה.`,

    // Game over
    crewmatesWin: 'הצוות ניצח',
    impostorsWin: 'המתחזים ניצחו',
    dead: '(מת)',
    backToLobby: 'חזרה ללובי',
    leaveRoom: 'עזוב חדר',
    waitingNextRound: 'ממתין למארח להתחיל סיבוב חדש...',

    // HUD / Canvas
    impostor: 'מתחזה',
    crewmate: 'צוות',
    ghost: 'רוח',
    spectating: 'צופה',
    tasksLabel: 'משימות:',
    tasksPercent: (p) => `משימות: ${p}%`,
    killCooldownHUD: (s) => `הריגה: ${s}שנ`,
    fellowImpostor: (names) => `מתחזה נוסף: ${names}`,
    completeTasksFindImpostor: 'השלם משימות. מצא את המתחזה.',

    // Action buttons
    kill: 'הרוג',
    report: 'דווח',
    use: 'השתמש',
    emergency: 'חירום',
    vent: 'פיר',
    sabo: 'חבלה',
    door: 'דלת',
    fix: 'תקן',
    shoot: 'ירה',
    vitals: 'מדדים',
    cams: 'מצלמות',
    exitCam: 'סגור מצלמה',
    admin: 'ניהול',

    // Sabotage menu
    sabotage: 'חבלה',
    lightsLabel: 'אורות',
    lightsCut: 'כבה את האורות',
    o2Label: 'חמצן',
    o2Deplete: 'רוקן חמצן (45שנ)',
    reactorLabel: 'כור גרעיני',
    reactorMeltdown: 'התכה (60שנ)',

    // Sabotage alerts
    saboLightsAlert: 'חבלה באורות',
    saboO2Alert: 'החמצן נגמר',
    saboReactorAlert: 'הכור מתמוסס',

    // Cameras / Admin / Vitals
    securityCameras: 'מצלמות אבטחה',
    pressToClose: 'לחץ [C] או כפתור סגירה',
    adminTable: 'לוח ניהול',
    empty: 'ריק',
    vitalsTitle: 'מדדים חיוניים',
    alive: 'חי',
    deadStatus: 'מת',

    // Roles
    sheriffRole: 'שריף - אתה יכול לנסות לירות!',
    engineerRole: 'מהנדס - אתה יכול להשתמש בפירים!',
    scientistRole: 'מדען - אתה יכול לבדוק מדדים!',

    // Task names
    fixWiring: 'תקן חיווט',
    swipeCard: 'העבר כרטיס',
    clearAsteroids: 'נקה אסטרואידים',
    downloadData: 'הורד נתונים',
    fuelEngines: 'תדלק מנועים',
    calibrateDistributor: 'כייל מפזר',
    simonSays: 'סיימון אומר',
    unlockSafe: 'פתח כספת',
    emptyTrash: 'רוקן אשפה',
    solveMaze: 'פתור מבוך',
    memoryMatch: 'זיכרון',
    connectPipes: 'חבר צינורות',
    tracePattern: 'עקוב אחר תבנית',
    medScan: 'סריקה רפואית',
    crackSafe: 'פצח כספת',

    // Task instructions
    swipeInstruction: '← העבר ←',
    accepted: 'אושר!',
    tooFast: 'מהיר מדי. נסה שוב.',
    tooSlow: 'איטי מדי. נסה שוב.',
    dragCard: 'גרור כרטיס מימין לשמאל',
    download: 'הורדה',
    holdToFill: 'לחץ\nלמלא',
    fillToRedLine: 'מלא עד הקו האדום ושחרר',
    clickGreenZone: 'לחץ כשהמחוג באזור הירוק',
    holdLeverTrash: 'החזק את הידית לריקון',
    done: '!סיום',

    // Quick messages
    followMe: 'עקבו אחריי',
    iSawSomething: 'ראיתי משהו',
    where: '?איפה',
    trustMe: 'תסמכו עליי',
    sus: '!חשוד',
    iWasIn: '...הייתי ב',
    help: '!עזרה',
    letsGo: 'יאללה',

    // Stats
    playerStats: 'סטטיסטיקות שחקן',
    gamesPlayed: 'משחקים ששוחקו',
    gamesWon: 'ניצחונות',
    timesImpostor: 'פעמים מתחזה',
    impostorWins: 'ניצחונות מתחזה',
    totalKills: 'הריגות',
    tasksCompleted: 'משימות שהושלמו',
    meetingsCalled: 'אסיפות שזומנו',
    bodiesReported: 'גופות שדווחו',
    ventsUsed: 'שימוש בפירים',
    sabotages: 'חבלות',
    chatMessages: 'הודעות צאט',
    gamesSurvived: 'משחקים ששרדת',
    close: 'סגור',

    // Room browser
    publicRoomsTitle: 'חדרים פתוחים',
    onlyPublicShown: 'רק חדרים פתוחים מוצגים',
    refresh: 'רענן',
    noRooms: 'אין חדרים פתוחים',
    inLobby: 'בלובי',
    inProgress: 'במשחק',
    join: 'הצטרף',

    // Achievements
    achievementUnlocked: (name) => `הישג נפתח: ${name}`,
    achieveFirstBlood: 'דם ראשון',
    achieveFirstBloodDesc: 'הרוג בפעם הראשונה כמתחזה',
    achieveSerialKiller: 'רוצח סדרתי',
    achieveSerialKillerDesc: 'הרוג 10 פעמים',
    achieveTaskMaster: 'אלוף משימות',
    achieveTaskMasterDesc: 'השלם 50 משימות',
    achieveVeteran: 'ותיק',
    achieveVeteranDesc: 'שחק 10 משחקים',
    achieveWinner: 'מנצח',
    achieveWinnerDesc: 'נצח 5 משחקים',
    achieveChampion: 'אלוף',
    achieveChampionDesc: 'נצח 20 משחקים',
    achieveDetective: 'בלש',
    achieveDetectiveDesc: 'הצבע נכון נגד מתחזה 5 פעמים',
    achieveSurvivor: 'שורד',
    achieveSurvivorDesc: 'שרוד 10 משחקים כצוות',
    achieveMasterDeception: 'אלוף ההונאה',
    achieveMasterDeceptionDesc: 'נצח 5 משחקים כמתחזה',
    achieveEmergency: '!חירום',
    achieveEmergencyDesc: 'זמן 5 אסיפות חירום',
    achieveSocial: 'פרפר חברתי',
    achieveSocialDesc: 'שלח 50 הודעות',
    achieveBodyFinder: 'מוצא גופות',
    achieveBodyFinderDesc: 'דווח על 10 גופות',
    achieveVentRat: 'עכבר פירים',
    achieveVentRatDesc: 'השתמש בפירים 20 פעמים',
    achieveSaboteur: 'חבלן',
    achieveSaboteurDesc: 'הפעל 10 חבלות',
    achieveSheriffStar: 'כוכב השריף',
    achieveSheriffStarDesc: 'ירה במתחזה בתור שריף',

    // Room names (alpha)
    Cafeteria: 'קפיטריה',
    'Upper Engine': 'מנוע עליון',
    MedBay: 'מרפאה',
    Weapons: 'נשקייה',
    Security: 'אבטחה',
    Storage: 'אחסנה',
    O2: 'חמצן',
    Electrical: 'חשמל',
    'Lower Engine': 'מנוע תחתון',
    Shields: 'מגנים',
    Navigation: 'ניווט',
    Kitchen: 'מטבח',

    // Room names (beta)
    'Central Hub': 'מרכז',
    Bridge: 'גשר',
    'Reactor Core': 'ליבת כור',
    Observatory: 'מצפה',
    Laboratory: 'מעבדה',
    Armory: 'מחסן נשק',
    Communications: 'תקשורת',
    'Cargo Bay': 'מפרץ מטען',
    'Life Support': 'מערכת חיים',
    Greenhouse: 'חממה',
    Airlock: 'מנעול אוויר',

    // Cosmetics
    hatNone: 'ללא', hatCrown: 'כתר', hatTophat: 'מגבעת', hatPartyhat: 'כובע מסיבה',
    hatChef: 'כובע שף', hatHeadband: 'סרט ראש', hatFlower: 'פרח', hatDevil: 'קרניים',
    hatHalo: 'הילה', hatBeanie: 'כיפה', hatAntenna: 'אנטנה', hatPirate: 'כובע פיראט',
    hatGlasses: 'משקפיים', hatSunglasses: 'משקפי שמש', hatHeadphones: 'אוזניות', hatCap: 'כובע מצחייה',
    hatWizard: 'כובע קוסם', hatCowboy: 'כובע בוקרים', hatNinja: 'מסכת נינג\'ה', hatSanta: 'כובע סנטה',
    hatWitch: 'כובע מכשפה', hatElfhat: 'כובע שדון', hatBunnyears: 'אוזני ארנב', hatPumpkin: 'דלעת',

    outfitNone: 'ללא', outfitSuit: 'חליפה', outfitLabcoat: 'חלוק מעבדה', outfitMilitary: 'צבאי',
    outfitScarf: 'צעיף', outfitCape: 'גלימה', outfitToolbelt: 'חגורת כלים', outfitAstronaut: 'אסטרונאוט',
    outfitHoodie: 'קפוצ\'ון', outfitPolice: 'שוטר', outfitPirate: 'פיראט', outfitNinja: 'נינג\'ה',

    petNone: 'ללא', petMiniCrewmate: 'צוות מיני', petDog: 'כלב', petCat: 'חתול',
    petRobot: 'רובוט', petAlien: 'חייזר', petHamster: 'אוגר',

    // Friends
    friends: 'חברים',
    yourCode: 'הקוד שלך:',
    addFriend: 'הוסף',
    friendCodePlaceholder: 'קוד חבר',
    online: 'מחובר',
    offline: 'לא מחובר',
    joinFriend: 'הצטרף',
    noFriends: 'עדיין לא הוספת חברים',
    friendAdded: 'חבר נוסף!',
    friendRemoved: 'הוסר',

    // Replay
    watchReplay: 'צפה בהשבה',
    replayLoading: 'טוען השבה...',
    replayNoData: 'אין נתוני השבה',

    // Drawing board
    draw: ':צייר',
    eraser: 'מחק',
    clearBoard: 'נקה',

    // Daily Challenges
    dailyChallenges: 'אתגרים יומיים',
    challengeStreak: (n) => `רצף: ${n} ימים`,
    stars: (n) => `כוכבים: ${n}`,
    challengeComplete: '!הושלם',
    challengeWinImpostor: 'נצח כמתחזה',
    challengeWinCrewmate: 'נצח כצוות',
    challengeComplete5Tasks: 'השלם 5 משימות',
    challengeComplete10Tasks: 'השלם 10 משימות',
    challengeSurvive: 'שרוד משחק שלם',
    challengeGet2Kills: 'הרוג 2 במשחק אחד',
    challengeReport: 'דווח על גופה',
    challengeCallMeeting: 'זמן אסיפת חירום',
    challengePlay3Games: 'שחק 3 משחקים',
    challengeUseVent: 'השתמש בפיר',
    challengeSendChat: 'שלח 5 הודעות',
    challengeWinGame: 'נצח משחק',
    allChallengesBonus: 'כל 3 הושלמו! +3 כוכבי בונוס',

    // Game modes
    gameMode: 'מצב משחק:',
    modeClassic: 'קלאסי',
    modeHideSeek: 'מחבואים',
    modeSpeedRun: 'מרוץ מהירות',
    modeInfection: 'הדבקה',
    hideSeekImpostorRevealed: 'המתחזה נחשף! ברחו!',
    hideSeekYouAreHunter: 'אתה הצייד! כולם רואים אותך!',
    speedRunCoopMode: 'מצב שיתופי - השלימו את כל המשימות!',
    speedRunTimer: (s) => `זמן: ${s}שנ`,
    infectionSurvive: 'שרדו! שחקנים נדבקים צדים אתכם!',
    youWereInfected: '!נדבקת',
    infectedCount: (n, total) => `נדבקו: ${n}/${total}`,
    headStart: (s) => `יתרון: ${s}שנ`,

    // Language
    language: 'שפה',
  },
};

// Cosmetic key maps
const HAT_KEY_MAP = {
  none: 'hatNone', crown: 'hatCrown', tophat: 'hatTophat', partyhat: 'hatPartyhat',
  chef: 'hatChef', headband: 'hatHeadband', flower: 'hatFlower', devil: 'hatDevil',
  halo: 'hatHalo', beanie: 'hatBeanie', antenna: 'hatAntenna', pirate: 'hatPirate',
  glasses: 'hatGlasses', sunglasses: 'hatSunglasses', headphones: 'hatHeadphones', cap: 'hatCap',
  wizard: 'hatWizard', cowboy: 'hatCowboy', ninja: 'hatNinja', santa: 'hatSanta',
  witch: 'hatWitch', elfhat: 'hatElfhat', bunnyears: 'hatBunnyears', pumpkin: 'hatPumpkin',
};
const OUTFIT_KEY_MAP = {
  none: 'outfitNone', suit: 'outfitSuit', labcoat: 'outfitLabcoat', military: 'outfitMilitary',
  scarf: 'outfitScarf', cape: 'outfitCape', toolbelt: 'outfitToolbelt', astronaut: 'outfitAstronaut',
  hoodie: 'outfitHoodie', police: 'outfitPolice', pirate_outfit: 'outfitPirate', ninja_outfit: 'outfitNinja',
};
const PET_KEY_MAP = {
  none: 'petNone', mini_crewmate: 'petMiniCrewmate', dog: 'petDog', cat: 'petCat',
  robot: 'petRobot', alien: 'petAlien', hamster: 'petHamster',
};

// Current language
let currentLang = localStorage.getItem('sb_lang') || 'en';

function t(key) {
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return lang[key] !== undefined ? lang[key] : (TRANSLATIONS.en[key] || key);
}

function tHat(hatId) { return t(HAT_KEY_MAP[hatId] || 'hatNone'); }
function tOutfit(outfitId) { return t(OUTFIT_KEY_MAP[outfitId] || 'outfitNone'); }
function tPet(petId) { return t(PET_KEY_MAP[petId] || 'petNone'); }
function tRoom(roomName) { return t(roomName) || roomName; }

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('sb_lang', lang);
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  applyTranslations();
}

function applyTranslations() {
  // Menu screen
  const h1 = document.querySelector('#menu-screen h1');
  if (h1) h1.textContent = t('title');
  const sub = document.querySelector('#menu-screen .subtitle');
  if (sub) sub.textContent = t('subtitle');
  const nameIn = document.getElementById('name-input');
  if (nameIn) nameIn.placeholder = t('enterName');
  const createB = document.getElementById('create-btn');
  if (createB) createB.textContent = t('createGame');
  const codeIn = document.getElementById('code-input');
  if (codeIn) codeIn.placeholder = t('roomCode');
  const joinB = document.getElementById('join-btn');
  if (joinB) joinB.textContent = t('joinGame');
  const specB = document.getElementById('spectate-btn');
  if (specB) specB.textContent = t('spectate');
  const browseB = document.getElementById('browse-btn');
  if (browseB) browseB.textContent = t('browseRooms');
  const statsB = document.getElementById('stats-btn');
  if (statsB) statsB.textContent = t('stats');
  const achieveB = document.getElementById('achieve-btn');
  if (achieveB) achieveB.textContent = t('achievements');
  const installB = document.getElementById('install-btn');
  if (installB) installB.textContent = t('installApp');

  // Volume labels
  const volLabels = document.querySelectorAll('#volume-controls label');
  if (volLabels[0]) volLabels[0].textContent = t('master');
  if (volLabels[1]) volLabels[1].textContent = t('sfx');
  if (volLabels[2]) volLabels[2].textContent = t('music');

  // Lobby
  const lobbyH2 = document.querySelector('#lobby-screen h2');
  if (lobbyH2) lobbyH2.textContent = t('lobby');
  const roomLabel = document.querySelector('#lobby-screen > .panel > p:first-of-type');
  if (roomLabel) roomLabel.textContent = t('roomCodeLabel');
  const shareP = document.querySelector('#lobby-screen .panel > p[style*="margin-bottom"]');
  if (shareP) shareP.textContent = t('shareCode');
  const startB = document.getElementById('start-btn');
  if (startB) startB.textContent = t('startGame');
  const waitP = document.getElementById('lobby-wait');
  if (waitP) waitP.textContent = t('waitingForHost');
  const upBtn = document.getElementById('avatar-upload-btn');
  if (upBtn) upBtn.textContent = t('uploadPhoto');

  // Skin categories
  const cats = document.querySelectorAll('.skin-category');
  if (cats[0]) cats[0].textContent = t('hat');
  if (cats[1]) cats[1].textContent = t('outfit');
  if (cats[2]) cats[2].textContent = t('pet');
  if (cats[3]) cats[3].textContent = t('face');

  // Settings labels
  const settingsTitle = document.querySelector('#settings-panel > div:first-child');
  if (settingsTitle) settingsTitle.textContent = t('gameSettings');

  // Challenges and Friends buttons
  const challengesB = document.getElementById('challenges-btn');
  if (challengesB) challengesB.textContent = t('dailyChallenges');
  const friendsB = document.getElementById('friends-btn');
  if (friendsB) friendsB.textContent = t('friends');

  // Drawing board
  const drawLabel = document.getElementById('draw-label');
  if (drawLabel) drawLabel.textContent = t('draw');
  const eraserBtn = document.getElementById('draw-eraser');
  if (eraserBtn) eraserBtn.textContent = t('eraser');
  const clearBtn = document.getElementById('draw-clear');
  if (clearBtn) clearBtn.textContent = t('clearBoard');

  // Game mode selector
  const gmSelect = document.getElementById('set-gamemode');
  if (gmSelect) {
    const gmOpts = gmSelect.options;
    if (gmOpts[0]) gmOpts[0].textContent = t('modeClassic');
    if (gmOpts[1]) gmOpts[1].textContent = t('modeHideSeek');
    if (gmOpts[2]) gmOpts[2].textContent = t('modeSpeedRun');
    if (gmOpts[3]) gmOpts[3].textContent = t('modeInfection');
  }
  // Game mode label
  const gmLabel = gmSelect && gmSelect.parentElement ? gmSelect.parentElement.querySelector('label') : null;
  if (gmLabel) gmLabel.textContent = t('gameMode');

  // Meeting
  const skipB = document.getElementById('skip-btn');
  if (skipB) skipB.textContent = t('skipVote');
  const chatIn = document.getElementById('chat-input');
  if (chatIn) chatIn.placeholder = t('typeMessage');
  const sendB = document.getElementById('chat-send');
  if (sendB) sendB.textContent = t('send');

  // Results
  const resH2 = document.querySelector('#results-screen h2');
  if (resH2) resH2.textContent = t('votingResults');

  // Game over
  const lobBtn = document.getElementById('lobby-btn');
  if (lobBtn) lobBtn.textContent = t('backToLobby');
  const lvBtn = document.getElementById('leave-btn');
  if (lvBtn) lvBtn.textContent = t('leaveRoom');
  const goWait = document.getElementById('gameover-wait');
  if (goWait) goWait.textContent = t('waitingNextRound');
  const repBtn = document.getElementById('replay-btn');
  if (repBtn) repBtn.textContent = t('watchReplay');

  // Stats/Achievements/Browser
  const statsH2 = document.querySelector('#stats-panel h2');
  if (statsH2) statsH2.textContent = t('playerStats');
  const statsClose = document.getElementById('stats-close');
  if (statsClose) statsClose.textContent = t('close');
  const browseH2 = document.querySelector('#browse-panel h2');
  if (browseH2) browseH2.textContent = t('publicRoomsTitle');
  const browseRef = document.getElementById('browse-refresh');
  if (browseRef) browseRef.textContent = t('refresh');
  const browseClose = document.getElementById('browse-close');
  if (browseClose) browseClose.textContent = t('close');
  const achieveH2 = document.querySelector('#achieve-panel h2');
  if (achieveH2) achieveH2.textContent = t('achievements');
  const achieveClose = document.getElementById('achieve-close');
  if (achieveClose) achieveClose.textContent = t('close');

  // iOS hint
  const iosHint = document.getElementById('ios-install-hint');
  if (iosHint) iosHint.innerHTML = t('iosInstallHint');
}

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
  if (currentLang !== 'en') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  }
  applyTranslations();
});
