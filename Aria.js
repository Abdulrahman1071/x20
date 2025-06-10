const _0x13cf03=_0x5ebe;function _0x51eb(){const _0x450828=['colors','4238479gtlWdb','306235YMWABP','264555twQCGU','245388OgprCF','18EMEioa','log','3545160enVpUB','blue','568oXBWVj','\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20█████\x20\x20██████\x20\x20██\x20\x20█████\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20██\x20\x20\x20██\x20██\x20\x20\x20██\x20██\x20██\x20\x20\x20██\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20███████\x20██████\x20\x20██\x20███████\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20██\x20\x20\x20██\x20██\x20\x20\x20██\x20██\x20██\x20\x20\x20██\x0a┏╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾┓\x0a┃\x20\x20\x20\x20\x20\x20\x20\x20\x20</>\x20All\x20rights\x20reserved\x20to\x20Beban\x20Community\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20┃\x0a┃\x20\x20\x20\x20*Please\x20respect\x20our\x20work\x20by\x20not\x20removing\x20the\x20credits\x20\x20\x20\x20\x20\x20┃\x0a┗╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾┛','48002PZDMqt','113956EfYsvA'];_0x51eb=function(){return _0x450828;};return _0x51eb();}function _0x5ebe(_0x3185d4,_0x96591c){const _0x51eb1a=_0x51eb();return _0x5ebe=function(_0x5ebe05,_0x589ae4){_0x5ebe05=_0x5ebe05-0xfe;let _0x24691e=_0x51eb1a[_0x5ebe05];return _0x24691e;},_0x5ebe(_0x3185d4,_0x96591c);}(_0x51eb,0x54034);const colors=require(_0x13cf03(0xfe));console[_0x13cf03(0x104)](colors[_0x13cf03(0x106)](_0x13cf03(0x108)));

const { Client, GatewayIntentBits, GatewayDispatchEvents } = require("discord.js");
const { readdirSync } = require("fs");
const { CommandKit } = require("commandkit");
const { connect } = require("mongoose");
const { logger } = require("./utils/logger");
const { Riffy } = require("riffy");
const SpotifyWebApi = require('spotify-web-api-node');
const config = require("./config");
const path = require("path");

class AriaBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
            ],
        });

        this.client.spotify = new SpotifyWebApi({
            clientId: config.spotify.clientId,
            clientSecret: config.spotify.clientSecret
        });
        
        this.initializeRiffy();
        this.initializeCommandKit();
    }

    initializeRiffy() {
        this.client.riffy = new Riffy(
            this.client,
            config.riffyNodes,
            {
                ...config.riffyOptions,
                send: (payload) => {
                    const guild = this.client.guilds.cache.get(payload.d.guild_id);
                    if (guild) guild.shard.send(payload);
                },
            },
        );

        this.client.on("raw", (d) => {
            if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
            this.client.riffy.updateVoiceState(d);
        });
    }

    initializeCommandKit() {
        new CommandKit({
            client: this.client,
            commandsPath: path.join(__dirname, "commands"),
            eventsPath: path.join(__dirname, "./events/botEvents"),
            validationsPath: path.join(__dirname, "validations"),
            devGuildIds: config.clientOptions.devGuild,
            devUserIds: config.clientOptions.devId,
        });
    }

    async start() {
        await this.checkConfig();
        await this.loadRiffy();
        await this.loadDb();
        await this.getSpotifyAccessToken();

        try {
            await this.client.login(config.clientOptions.clientToken);
        } catch (err) {
            logger(`Failed to log in: ${err.message}`, "error");
            process.exit(1);
        }

        // ✅ Presence: Streaming Mode
        this.client.user.setPresence({
            status: "online",
            activities: [
                {
                    name: "Made by x20",
                    type: 1, // STREAMING
                    url: "https://twitch.tv/dl1"
                }
            ]
        });

        setInterval(() => {
            this.getSpotifyAccessToken();
        }, 3000000);
    }

    async checkConfig() {
        const requiredFields = [
            'clientToken',
            'clientId',
            'embedColor',
            'mongoUri',
            'devId',
            'devGuild',
            'defaultSearchPlatform',
            'spotify.clientId',
            'spotify.clientSecret',
            'riffyNodes'
        ];
    
        const missingFields = [];
    
        requiredFields.forEach(field => {
            const keys = field.split('.');
            let value = config;
    
            for (const key of keys) {
                value = value[key];
                if (value === undefined) {
                    break;
                }
            }
    
            if (value === "" || value === null || (Array.isArray(value) && value.length === 0)) {
                missingFields.push(field);
            }
        });
    
        if (Array.isArray(config.clientOptions.devId) && config.clientOptions.devId.length === 0) {
            missingFields.push('devId');
        }
        if (Array.isArray(config.clientOptions.devGuild) && config.clientOptions.devGuild.length === 0) {
            missingFields.push('devGuild');
        }
    
        if (missingFields.length > 0) {
            logger(`Missing required configuration fields: ${missingFields.join(', ')}`, "error");
            process.exit(1);
        } else {
            logger("All required configuration fields are filled", "success");
        }
    }

    async loadDb() {
        try {
            await connect(config.clientOptions.mongoUri);
            logger(`Successfully connected to MongoDB`, "debug");
        } catch (err) {
            logger(`Failed to connect to MongoDB: ${err}`, "error");
            process.exit(1);
        }
    }

    async loadRiffy() {
        logger("Initiating Riffy events", "warn");
    
        const eventDirs = readdirSync('./events/riffyEvents');
    
        for (const dir of eventDirs) {
            const eventFiles = readdirSync(`./events/riffyEvents/${dir}`).filter(file => file.endsWith('.js'));
    
            for (const file of eventFiles) {
                try {
                    const event = require(`./events/riffyEvents/${dir}/${file}`);
    
                    if (typeof event !== 'function') {
                        logger(`Couldn't load the Riffy event ${file}, error: Exported value is not a function.`, "error");
                        continue;
                    }
    
                    await event(this.client);
                } catch (err) {
                    logger(`Couldn't load the Riffy event ${file}, error: ${err}`, "error");
                    logger(err, "error");
                    continue;
                }
            }
        }
        this.client.riffy.init(config.clientOptions.clientId)
        logger(`Successfully initiate Riffy events`, "debug");
    }

    async getSpotifyAccessToken() {
        try {
            const data = await this.client.spotify.clientCredentialsGrant();
            logger("Successfully retrieved fresh Spotify access token", "success");
            this.client.spotify.setAccessToken(data.body['access_token']);
        } catch (err) {
            logger(`Error retrieving Spotify access token: ${err}`);
        }
    }
}

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(3000, () => {
  console.log("Web server is running on port 3000");
});

const Aria = new AriaBot();
Aria.start();
