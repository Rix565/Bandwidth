const Discord = require('discord.js');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord-api-types/v10');
const database = require('../../database');

/**
 *
 * @param {Discord.ContextMenuInteraction} interaction
 */
async function warnPiracyHandler(interaction) {
	const reportsChannelId = await database.getGuildSetting(interaction.guildId, 'reports_channel_id');
	const channels = await interaction.guild.channels.fetch();
	const reportsChannel = channels.find(channel => channel.id === reportsChannelId);

	if (!reportsChannel) {
		throw new Error('Report failed to submit - channel not setup');
	}

	const warnPiracyEmbed = new Discord.EmbedBuilder();
	warnPiracyEmbed.setColor(0xF36F8A);
	warnPiracyEmbed.setThumbnail('attachment://piracy.png');
	warnPiracyEmbed.setTitle('Piracy Warning');
	warnPiracyEmbed.setDescription('A user has reported this message as pertaining to piracy. Pretendo Network does not support piracy of any kind. Talking about piracy is prohibited. This includes, but is not limited to:\n\n- Sharing game/firmware dumps\n- Sharing console SDK (software development kit) leaks/tools\n- Sharing tools used to acquire pirated content (cdn downloads, warez sites, etc)\n\n_This action has been logged. If you believe this to have been done unfairly please contact a staff member_');

	const message = await interaction.channel.messages.fetch(interaction.targetId);

	if (message.author.bot) {
		throw new Error('Cannot report bot messages');
	}

	const executor = await interaction.member.fetch();

	if (message.author.id === executor.user.id) {
		throw new Error('Cannot report own messages');
	}

	await message.reply({
		embeds: [warnPiracyEmbed],
		files: [
			__dirname + '/../../images/piracy.png'
		]
	});

	const reportEmbed = new Discord.EmbedBuilder();

	reportEmbed.setColor(0xC0C0C0);
	reportEmbed.setTitle('User Report');
	reportEmbed.setDescription('――――――――――――――――――――――――――――――――――');
	reportEmbed.setFields(
		{
			name: 'Target User',
			value: `<@${message.author.id}>\n${message.author.id}`,
			inline: true
		},
		{
			name: 'Reporting User',
			value: `<@${interaction.member.id}>\n${interaction.member.id}`,
			inline: true
		},
		{
			name: 'Channel Tag',
			value: `<#${interaction.channelId}>`,
			inline: true
		},
		{
			name: 'Channel Name',
			value: interaction.channel.name,
			inline: true
		},
		{
			name: 'Reason',
			value: 'Piracy Warning',
			inline: true
		},
		{
			name: 'Message',
			value: message.content.substring(0, 1024),
			inline: true
		}
	);
	reportEmbed.setFooter({
		text: 'Pretendo Network',
		iconURL: interaction.guild.iconURL()
	});
	reportEmbed.setTimestamp(Date.now());

	await reportsChannel.send({
		embeds: [reportEmbed]
	});

	await interaction.reply({
		content: 'Message Warned',
		ephemeral: true
	});
}

const contextMenu = new ContextMenuCommandBuilder();

contextMenu.setDefaultMemberPermissions(Discord.PermissionFlagsBits.SendMessages);
contextMenu.setName('Warn Piracy');
contextMenu.setType(ApplicationCommandType.Message);

module.exports = {
	name: contextMenu.name,
	help: 'Flag a message as relating to piracy. This action will be recorded with the information about yourself and the author of the message to prevent abuse.\n```\nUsage: Right click a message and navigate to \'Apps > Warn Piracy\'\n```',
	handler: warnPiracyHandler,
	deploy: contextMenu.toJSON()
};