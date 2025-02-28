require('dotenv').config()

const { Client, Intents, MessageEmbed } = require('discord.js')
const client = new Client({
  intents: Intents.FLAGS.GUILDS | Intents.FLAGS.GUILD_MESSAGES,
})
const serp = require('serp')
const events = require('./events.json')
const cron = require('node-cron')
const prefix = 'n.'
const { inspect } = require('util')

cron.schedule('0,15 * * * *', () => {
  client.channels.cache
    .get('871749703132381185')
    .send('定期実行を開始しました。')

  for (const event of events) {
    const timeLag = Date.now() - Date.parse(event.date)

    if (timeLag >= -60000 && timeLag <= 600000) {
      const mentionRole = client.guilds.cache
        .get('755774191613247568')
        .roles.cache.filter((role) => role.name === event.role)
        .first().id

      client.channels.cache
        .get('805732155606171658')
        .send(`<@&${mentionRole}> ${event.name}`)
    }
  }

  client.channels.cache
    .get('871749703132381185')
    .send('定期実行が完了しました。')
})

client
  .once('ready', () => {
    console.log(`${client.user.tag} でログインしました。`)
  })
  .on('messageCreate', async (message) => {
    if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/ +/)
      const command = args.shift().toLowerCase()

      if (command === 'eval') {
        if (message.author.id !== '723052392911863858') return

        try {
          // eslint-disable-next-line no-eval
          const evaled = await eval(args.join(' '))
          message.reply({
            embeds: [
              new MessageEmbed()
                .setTitle('出力')
                .setDescription(`\`\`\`js\n${inspect(evaled)}\n\`\`\``)
                .setColor('BLURPLE'),
            ],
          })
        } catch (e) {
          message.reply({
            embeds: [
              new MessageEmbed()
                .setTitle('エラー')
                .setDescription(`\`\`\`js\n${e}\n\`\`\``)
                .setColor('RED'),
            ],
          })
        }
      }
    }
  })

const commands = {
  async db(interaction) {
    try {
      const options = {
        host: 'google.co.jp',
        qs: {
          q:
            interaction.options.get('word').value +
            '+site:https://battlecats-db.com/',
          filter: 0,
          pws: 0,
        },
        num: 3,
      }
      const links = await serp.search(options)

      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`「${interaction.options.get('word').value}」の検索結果`)
            .setDescription(
              `[${links[0].title}](https://www.google.co.jp${links[0].url})\n\n[${links[1].title}](https://www.google.co.jp${links[1].url})\n\n[${links[2].title}](https://www.google.co.jp${links[2].url})`,
            ),
        ],
      })
    } catch (error) {
      await interaction.reply({
        content: `「**${
          interaction.options.get('word').value
        }**」が見つかりませんでした。\n誤字/脱字等がないか確認の上、再度お試しください。`,
        ephemeral: true,
      })
    }
  },

  async progress(interaction) {
    const img = async (user) => {
      try {
        const n = await client.channels.cache
          .get('822771682157658122')
          .messages.fetch({ limit: 100 })
          .then((a) =>
            a
              .filter((a) => a.author.id === user && a.attachments.first())
              .first()
              .attachments.map((a) => a.url),
          )
        return n
      } catch {
        return null
      }
    }
    const res = await img(interaction.options.get('user').value)

    if (res) {
      return await interaction.reply({
        files: res,
      })
    } else {
      return await interaction.reply({
        content:
          'メッセージが取得できませんでした。\nDiscord標準の検索機能を利用してください。',
        ephemeral: true,
      })
    }
  },
}

async function onInteraction(interaction) {
  if (!interaction.isCommand()) return
  return commands[interaction.commandName](interaction)
}

client.on('interactionCreate', (interaction) => onInteraction(interaction))

// メッセージ編集
client.on('messageUpdate', (oldMessage, newMessage) => {
  if (newMessage.author.bot) return

  if (newMessage.channel.guildId === '755774191613247568') {
    client.channels.cache.get('872863093359800330').send({
      embeds: [
        new MessageEmbed()
          .setTitle('メッセージ編集')
          .setAuthor(
            newMessage.author.tag,
            newMessage.author.displayAvatarURL({ dynamic: true }),
          )
          .setDescription(`メッセージに移動: [こちら](${newMessage.url})`)
          .addField('編集前', oldMessage.content || '*なし*')
          .addField('編集後', newMessage.content || '*なし*')
          .addField(
            '添付ファイル',
            newMessage.attachments
              .map((a) => `[URL](${a.proxyURL})`)
              .join(', ') || '*なし*',
          )
          .addField(
            'チャンネル',
            `${newMessage.channel} (#${newMessage.channel.name}/${newMessage.channel.id})`,
            true,
          )
          .addField(
            'カテゴリ',
            `${newMessage.channel.parent.name || '*なし*'} (${
              newMessage.channel.parentId || '*なし*'
            })`,
            true,
          )
          .setTimestamp()
          .setColor('BLURPLE'),
      ],
    })
  }
})

// メッセージ削除
client.on('messageDelete', (message) => {
  if (message.author.bot) return

  if (message.channel.guildId === '755774191613247568') {
    client.channels.cache.get('872863093359800330').send({
      embeds: [
        new MessageEmbed()
          .setTitle('メッセージ削除')
          .setAuthor(
            message.author.tag,
            message.author.displayAvatarURL({ dynamic: true }),
          )
          .addField('メッセージ', message.content || '*なし*')
          .addField(
            '添付ファイル',
            message.attachments.map((a) => `[URL](${a.proxyURL})`).join(', ') ||
              '*なし*',
          )
          .addField(
            'チャンネル',
            `${message.channel} (#${message.channel.name}/${message.channel.id})`,
            true,
          )
          .addField(
            'カテゴリ',
            `${message.channel.parent.name || '*なし*'} (${
              message.channel.parentId || '*なし*'
            })`,
            true,
          )
          .setTimestamp()
          .setColor('RED'),
      ],
    })
  }
})

client.login(process.env.DISCORD_TOKEN)
