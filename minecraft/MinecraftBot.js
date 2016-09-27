const MessageQueue = require('../objects/MessageQueue');
const EventEmitter = require('events');

var log            = require('frozor-logger');

var mc_color_to_chalk = {
    4: log.chalk.red,
    c: log.chalk.red,
    6: log.chalk.yellow,
    e: log.chalk.yellow,
    2: log.chalk.green,
    a: log.chalk.green,
    b: log.chalk.blue,
    3: log.chalk.cyan,
    1: log.chalk.blue,
    9: log.chalk.blue,
    d: log.chalk.magenta,
    5: log.chalk.magenta,
    f: log.chalk.white,
    7: log.chalk.gray,
    l: log.chalk.bold,
    n: log.chalk.underline,
    o: log.chalk.italics,
    m: log.chalk.strikethrough,
    r: log.chalk.reset,
}

class MinecraftBot extends EventEmitter{
    /**
     * @param mineflayer - Mineflayer
     * @param {string} host - The IP of the server you are connecting to.
     * @param {string} username - The username you want to log in with
     * @param {string} password - The password you want to use to log in
     */
    constructor(mineflayer, host, port, username, password){
        super();

        this.self     = this;
        this._mf      = mineflayer;
        this._bot     = null;
        this.host     = host;
        this.port     = port;
        this.username = username;
        this.password = password;

        this.messageQueue    = new MessageQueue();
        this.messageQueue.on('message', (msg)=>{this.chat(msg);})

    }

    /**
     * Actually starts the bot.
     * If you want to override
     * events, do so BEFORE
     * calling this method.
     */

    initialize(){
        log.logInfo(`Logging into ${log.chalk.cyan(this.host)}...`, 'SELF');
        
        this._bot = this._mf.createBot({
            host    : this.host,
            port    : this.port,
            username: this.username,
            password: this.password
        });

        //this.setChatPatterns();
        this.registerEvents();
    }

    getBot(){
        return this._bot;
    }

    /**
     * Default behavior for the bot.
     * If you want to override any
     * of the bot's events, do so
     * using the overrideEvents()
     * method.
     *
     * By default, the bot just
     * logs in, prints all chat
     * messages to the console
     * with colors (chalk), and
     * emits events for login/
     * chat events.
     */
    registerEvents(){
        this.getBot().on('login', ()=>{
            log.logInfo(`Logged into ${log.chalk.cyan(this.host)} as ${log.chalk.cyan(this._bot.username)}`, "SELF");
            this.emit('login');
        });

        this.getBot().on('message', (packet)=>{
            var message = packet.toString().replace('  ', ' ');

            var coloredMessage = this.consoleColorChat(message, packet);

            if(coloredMessage == log.chalk.stripColor(coloredMessage)) log.logDebug(JSON.stringify(packet), 'SELF');

            log.logInfo(coloredMessage, "SELF|CHAT");

            this.self.emit('chat', message.replace(new RegExp('/(\u00A7[A-fK-oRr1-9])/g'), ''));
        });

    }

    overrideEvents(override_function){
        this.registerEvents = override_function;
    }

    slackFormatChat(chat){

    }

    consoleColorChat(chat, packet){
        var split = chat.split(`§`);

        if(split.length == 1){
            var extra = packet.json.extra;
            for(var item of extra){

            }
            return;
        }

        var coloredMessage = "";
        for(var index in split){
            var message = split[index];
            if(message.length == 1) continue;
            var colorCode = message.substring(0, 1);
            var colorCodeFunction = mc_color_to_chalk[colorCode];

            if(colorCode == "l" || colorCode == "m" || colorCode == "n" || colorCode == "o"){
                coloredMessage += mc_color_to_chalk[split[index-1]](colorCodeFunction(message.substring(1)));
                continue;
            }

            if(!colorCodeFunction){
                coloredMessage += message;
                continue;
            }
            coloredMessage += colorCodeFunction(message.substring(1));
            //log.logDebug(`Chat ${chat} - Code ${colorCode}. ${colorCodeFunction(message)}`)
        }
        return coloredMessage;
    }

    /**
     * @method - Generally, don't use this method directly.
     * Only for high-priority messages that need to be sent immediately.
     *
     * @param message - The message to send in chat.
     */
    chat(message){
        this.getBot().chat(message);
    }

    queueMessage(message){
        this.messageQueue.queue(message);
    }

    getMessageQueue(){
        return this.messageQueue.getQueue();
    }

    end(){
        if(!this.getBot()) return;
        this.getBot().quit();
        this.getBot().end();
    }
}

module.exports = MinecraftBot;