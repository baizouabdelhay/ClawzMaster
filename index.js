require('dotenv').config();

const {
Client,
GatewayIntentBits,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
Events,
AttachmentBuilder
} = require('discord.js');

const { QuickDB } = require("quick.db");
const db = new QuickDB();

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const activeGames = new Map();

// ===== CREATURES =====
const creatures = [
{ name: 'dinosaur', file: './images/dinosaur.jpg' },
{ name: 'dragon', file: './images/dragon.jpg' },
{ name: 'shark', file: './images/shark.jpg' }
];

// ===== SPACE =====
const spaceQuestions = [
{ question: 'What is the largest planet in the solar system?', answer: 'jupiter' },
{ question: 'What galaxy do we live in?', answer: 'milky way' },
{ question: 'What is the red planet?', answer: 'mars' },
{ question: 'How are black holes formed?', answer: 'collapse of a massive star' },
{ question: 'What is the closest star to Earth?', answer: 'sun' },
{ question: 'Which planet has rings?', answer: 'saturn' },
{ question: 'What planet is known as the blue planet?', answer: 'earth' }
];

// ===== RANDOM SPACE QUESTION =====
function getRandomSpaceQuestion(usedQuestions) {

const available = spaceQuestions.filter(
q => !usedQuestions.includes(q.question)
);

const random =
available[Math.floor(Math.random() * available.length)];

usedQuestions.push(random.question);

return random;
}

// ===== RANDOM CREATURE =====
function getRandomCreature(usedCreatures) {

const available = creatures.filter(
c => !usedCreatures.includes(c.name)
);

const random =
available[Math.floor(Math.random() * available.length)];

usedCreatures.push(random.name);

return random;
}

// ===== MATH =====
function generateMathQuestion() {

const a = Math.floor(Math.random() * 20) + 1;
const b = Math.floor(Math.random() * 20) + 1;

const ops = ['+', '-', '*', '/'];
const op = ops[Math.floor(Math.random() * ops.length)];

let q, ans;

switch (op) {

case '+':
q = `${a} + ${b}`;
ans = a + b;
break;

case '-':
q = `${a} - ${b}`;
ans = a - b;
break;

case '*':
q = `${a} × ${b}`;
ans = a * b;
break;

case '/':
q = `${a * b} ÷ ${a}`;
ans = b;
break;
}

return {
question: q,
answer: ans.toString()
};
}

// ===== EQUATIONS =====
function generateEquation() {

const type = Math.floor(Math.random() * 3);

const a = Math.floor(Math.random() * 10) + 1;
const b = Math.floor(Math.random() * 10) + 1;

let q, ans;

if (type === 0) {

const x = Math.floor(Math.random() * 10) + 1;
const c = a * x + b;

q = `${a}x + ${b} = ${c}\nWhat is x?`;
ans = x;
}

else if (type === 1) {

const x = Math.floor(Math.random() * 10) + 1;

q = `${a}x = ${a * x}\nWhat is x?`;
ans = x;
}

else {

const x = Math.floor(Math.random() * 20) + 1;

q = `x + ${a} = ${x + a}\nWhat is x?`;
ans = x;
}

return {
question: q,
answer: ans.toString()
};
}

// ===== READY =====
client.once('clientReady', () => {
console.log(`${client.user.tag} is online!`);
});

// ===== COMMAND =====
client.on(Events.InteractionCreate, async interaction => {

if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === 'math') {

const button = new ButtonBuilder()
.setCustomId('start_math')
.setLabel('Start Challenge')
.setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder().addComponents(button);

await interaction.deferReply();

await interaction.editReply({
content: 'Press the button to start 😈',
components: [row]
});
}
});

// ===== BUTTON =====
client.on(Events.InteractionCreate, async interaction => {

if (!interaction.isButton()) return;

if (interaction.customId !== 'start_math') return;

const math = generateMathQuestion();

activeGames.set(interaction.user.id, {
level: 1,
score: 0,
spaceScore: 0,
equationScore: 0,
creatureScore: 0,
answer: math.answer,

usedSpaceQuestions: [],
usedCreatures: []
});

await interaction.deferReply();

await interaction.editReply({
content:
`🔥 LEVEL 1 - MATH\n\n📚 Question 1/7\n\n${math.question} = ?`
});
});

// ===== MESSAGE =====
client.on('messageCreate', async message => {

if (message.author.bot) return;

// ===== TOP =====

if (message.content.toLowerCase() === "top") {

const all = await db.all();

const pointsData = all.filter(data =>
data.id.startsWith("points_")
);

if (pointsData.length <= 0) {
return message.reply("❌ No players found.");
}

const sorted = pointsData.sort((a, b) => b.value - a.value);

let text = "🏆 TOP PLAYERS\n\n";

for (let i = 0; i < Math.min(sorted.length, 10); i++) {

const userId = sorted[i].id.replace("points_", "");
const points = sorted[i].value;

let medal = "🎖";

if (points >= 1000) medal = "🥇";
else if (points >= 500) medal = "🥈";
else if (points >= 210) medal = "🥉";

let user;

try {
user = await client.users.fetch(userId);
} catch {
user = { username: "Unknown" };
}

text += `${medal} ${user.username} - ${points}\n`;
}

return message.reply(text);
}

// ===== PROFILE =====

if (message.content.toLowerCase() === "profile") {

const points =
await db.get(`points_${message.author.id}`) || 0;

let rank = "No Rank";

if (points >= 1000) {
rank = "🥇";
}
else if (points >= 500) {
rank = "🥈";
}
else if (points >= 210) {
rank = "🥉";
}

return message.reply(`
👤 ${message.author.username}

${rank} Rank

💎 Points: ${points}
`);
}

if (!activeGames.has(message.author.id)) return;

const game = activeGames.get(message.author.id);

if (
message.content.toLowerCase() !==
game.answer.toLowerCase()
) {

let points =
await db.get(`points_${message.author.id}`) || 0;

points -= 3;

if (points < 0) points = 0;

await db.set(`points_${message.author.id}`, points);

return message.reply(
`❌ Wrong answer!\n\n-3 Points\n\n💎 Total Points: ${points}`
);
}

// ===== CORRECT ANSWER =====

let points =
await db.get(`points_${message.author.id}`) || 0;

points += 10;

await db.set(`points_${message.author.id}`, points);

// ===== LEVEL 1 =====
if (game.level === 1) {

game.score++;

if (game.score >= 7) {

game.level = 2;

const q =
getRandomSpaceQuestion(game.usedSpaceQuestions);

game.answer = q.answer;

return message.reply(
`✅ LEVEL 1 COMPLETE!\n\n+10 Points\n💎 Total Points: ${points}\n\n🌌 LEVEL 2 - SPACE\n\nQuestion 1/7\n\n${q.question}`
);
}

const math = generateMathQuestion();

game.answer = math.answer;

return message.reply(
`✅ Correct!\n\n+10 Points\n💎 Total Points: ${points}\n\n📚 Question ${game.score + 1}/7\n\n${math.question} = ?`
);
}

// ===== LEVEL 2 =====
if (game.level === 2) {

game.spaceScore++;

if (game.spaceScore >= 7) {

game.level = 3;

const eq = generateEquation();

game.answer = eq.answer;

return message.reply(
`🔥 LEVEL 3 - EQUATIONS\n\n+10 Points\n💎 Total Points: ${points}\n\n📘 Question 1/4\n\n${eq.question}`
);
}

const q =
getRandomSpaceQuestion(game.usedSpaceQuestions);

game.answer = q.answer;

return message.reply(
`✅ Correct!\n\n+10 Points\n💎 Total Points: ${points}\n\n🌌 Question ${game.spaceScore + 1}/7\n\n${q.question}`
);
}

// ===== LEVEL 3 =====
if (game.level === 3) {

game.equationScore++;

if (game.equationScore >= 4) {

game.level = 4;

const c =
getRandomCreature(game.usedCreatures);

game.answer = c.name;

return message.reply({
content:
`🔥 LEVEL 4 - CREATURES\n\n+10 Points\n💎 Total Points: ${points}\n\n🖼 Creature 1/3\n\nWhat is this creature?`,
files: [new AttachmentBuilder(c.file)]
});
}

const eq = generateEquation();

game.answer = eq.answer;

return message.reply(
`✅ Correct!\n\n+10 Points\n💎 Total Points: ${points}\n\n📘 Question ${game.equationScore + 1}/4\n\n${eq.question}`
);
}

// ===== LEVEL 4 =====
if (game.level === 4) {

game.creatureScore++;

if (game.creatureScore >= 3) {

activeGames.delete(message.author.id);

return message.reply(
`🏆 GOD LEVEL COMPLETED!\n\n+10 Points\n💎 Total Points: ${points}`
);
}

const c =
getRandomCreature(game.usedCreatures);

game.answer = c.name;

return message.reply({
content:
`✅ Correct!\n\n+10 Points\n💎 Total Points: ${points}\n\n🖼 Creature ${game.creatureScore + 1}/3\n\nWhat is this creature?`,
files: [new AttachmentBuilder(c.file)]
});
}
});

client.login(process.env.TOKEN);