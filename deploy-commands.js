require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
new SlashCommandBuilder()
.setName('math')
.setDescription('ابدأ تحدي الرياضيات')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const CLIENT_ID = '1520763929415123105';
const GUILD_ID = '1492322942942711870';

(async () => {
try {
console.log('Started refreshing application commands.');

await rest.put(
Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
{ body: commands },
);

console.log('Successfully reloaded application commands.');
} catch (error) {
console.error(error);
}
})();