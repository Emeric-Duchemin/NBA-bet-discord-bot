const Discord = require("discord.js");
const { exec } = require("child_process");
const NBA = require("nba");
const { Client } = require('pg');
//const db = new Database()

require("dotenv").config();
const fs = require('fs');
let sem = require("async-mutex");
const sdv = require("sportsdataverse");
const client = new Discord.Client();
let mutex = new sem.Mutex();
let guild = undefined;
let channel = undefined;
let betRemaining = -1;
let hasBet = "29/09/2021";
let inter = 0;
let myInterval;
let msgBets;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
});
client.on("message", (msg) => {
    guild = msg.guild;
    channel = msg.channel.name;
    check = parseMessage(msg);
    if (check[0]) {
        msg.reply(check[1]);
    }
    /*      const rep = NBA.stats.scoreboard({LeagueID: "00",DayOffset:"1",gameDate:"04/22/2021"}).then(console.log);
          console.log(rep);
        msg.reply("Player Id : "+ rep.playerId);
    }*/
});

function parseMessage(message){
    const cont = message.content
    let index = 0
    while(cont.charAt(index) === " "){
        index += 1
    }
    let ret = [-1,""]
    if(cont.substring(index,index+4) === "!nba"){
        ret = getAction(cont.substring(index+4,cont.length),message);
    }

    switch(ret[0]){
        case 0 :
            return [true,ret[1]];
        case -1 :
            return [false,""]
        case 1 :
            return [true, "This command does not exist. Need help ? Easy ! Just ask : \n"+
            "!nba help"];
        default :
            return [false,""]
    }
}

function getAction(message,completeMessage){
    let index = 0;
    let lstTest = message.split("\n");
    let addIndex = lstTest[0].length;
    while(message.charAt(index) == " "){
        index += 1;
    }
    if(message.substring(index, index+6) === "matchs"){
        printMatch(message.substring(addIndex,message.length),completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+7) === "results"){
        printResult(message.substring(index+7,message.length),completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+6) === "mybets"){
        displayBet(completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+4) === "bets"){
        treatBet(message.substring(addIndex,message.length),completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+5) === "check"){
        checkBets(message.substring(addIndex,message.length),completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+6) === "change"){
        modifyBets(message.substring(addIndex,message.length),completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+5) === "reset"){
        reset(completeMessage);
        return [-1,""];
    }
    if(message.substring(index,index+4) === "add "){
        let mess = message.substring(index+4,message.length);
        let scoreanduser = mess.split(" ");
        let user = scoreanduser[0].substring(2,scoreanduser[0].length-1);
        //changeScoreJson(false,user,scoreanduser[1]);
        return [-1,""];
    }
    if(message.substring(index,index+7) === "remove "){
        let mess = message.substring(index+7,message.length);
        let scoreanduser = mess.split(" ");
        let user = scoreanduser[0].substring(2,scoreanduser[0].length-1);
        //changeScoreJson(true,user,scoreanduser[1]);
        //BLALALALALAL
        return [-1,""];
    }
    if(message.substring(index,index+4) === "help"){
        let mess = ""
        mess += "If you want to see today's matches, just ask:\n";
        mess += "**!nba matchs**\n\n";
        mess += "If you want to see yesterday's results, ask: \n";
        mess += "**!nba results**\n\n";
        mess += "If you want to see the result from a specific date, request:\n";
        mess += "**!nba results [date]** \n\n";
        mess += "If you want to bet all your money today, easy:\n";
        mess += "**!nba bets**\n\n";
        mess += "If you want to show everybody you won yesterday, inquire:\n";
        mess += "**!nba check**\n\n";
        mess+= "If your memory is a bit too old, refresh it with:\n"
        mess+= "**!nba mybets**";
        //mess += "Note that last command requires privilege";
        return [0,mess];
    }
    return [1, "Wrong command"];
}

async function reset(message){
    //let mess = await message.channel.messages.fetchPinned();
    //mess.array()[0].edit("NBA bets !");
    let matches = await db.list("score");
    for(let i=0;i<matches.length; i++){
      db.set(matches[i],0);
    }
    return;
}

function getTimeOfDay(){
    var d = new Date();
    var hour = d.getHours();
    if (hour < 7){
    	var d = ( function(){this.setDate(this.getDate()-1); return this} )
                .call(new Date);
    }
    var date = d.getDate();
    //date ++;
    if (date < 10){
    	date = "0" + date
    }
    // Là ici
    var month = d.getMonth() + 1;
    if (month < 10){
    	month = "0" + month
    }
    //console.log(month + "/" + date + "/" + d.getFullYear());
    return month + "/" + date + "/" + d.getFullYear();
}


function getDateTimeOfDay(){
    let date = getTimeOfDay();
    // ICI la oui
    //date = "01/06/2021"
    date = date.split("/");
    return date;
}

function getTimeOfPastDay(){
    var d = ( function(){this.setDate(this.getDate()-1); return this} )
            .call(new Date);
    var hour = d.getHours();
    if (hour < 7){
      var d = ( function(){this.setDate(this.getDate()-2); return this} )
                .call(new Date);
    }
    var date = d.getDate()
    if (date < 10){
      date = "0" + d.getDate()
    }
    var month = d.getMonth() + 1
    if (month < 10){
      month = "0" + (d.getMonth() + 1)
    }
    return month + "/" + date + "/" + d.getFullYear();
}

function printMatch(message,completeMessage){
    index = 0;
    while(message.charAt(index) == " "){
        index += 1;
    }
    let timeofday = "";
    let dateTimeOfDay = [];
    if(index >= message.length){
        timeofday = getTimeOfDay();
        dateTimeOfDay = getDateTimeOfDay();
    }else{
        // TODO : vérifier que l'utilisateur ne s'est pas planté dans la date
        // TODO : vérifier que la date demander ne dépasse pas getTimeOfDay
        date = message.substring(index,index+10);
        timeofday = date.substring(3,5) + "/" + date.substring(0,2) + "/" + date.substring(6,10);
        dateTimeOfDay = [date.substring(3,5),date.substring(0,2),date.substring(6,10)];
    }
    let rep = 0;
    const inputs = {
        year: parseInt(dateTimeOfDay[2]),
        month: parseInt(dateTimeOfDay[0]),
        day: parseInt(dateTimeOfDay[1])
    };
    sdv.nba.getScoreboard(inputs).then(result => {let msg = getMatchs(result);replyMessage(msg,completeMessage);});
    // console.log(result);
}


function printResult(message,completMessage){
    index = 0;
    while(message.charAt(index) == " "){
        index += 1;
    }
    timeofday = "";
    if(index >= message.length){
        timeofday = getTimeOfPastDay();
    }else{
        // TODO : vérifier que l'utilisateur ne s'est pas planté dans la date
        // TODO : vérifier que la date demander ne dépasse pas getTimeOfDay
        date = message.substring(index,index+10);
        timeofday = date.substring(3,5) + "/" + date.substring(0,2) + "/" + date.substring(6,10);
    }
    let rep = 0;
    NBA.stats.scoreboard({LeagueID: "00",DayOffset:"0",gameDate:timeofday}).then(result =>
        {msg = getResults(result);replyMessage(msg,completeMessage)});
}

function getMatchs(result){
    let lstMatch = result.events;
    let msg = "";
    let teams = "";
    for(let i=0 ; i<lstMatch.length ;i++){
        teams = lstMatch[i].name.split(" at ");
        msg += (i+1) + " " + teams[0] + " - " + teams[1] +  "\n";
        // if(i%2 == 0){
        //     if(i != 0){
        //         msg += "\n";
        //         msg += i/2 + 1 + " ";
        //     }
        // }
        // if(i%2 == 1){
        //     msg += " - ";
        // }
        // msg += teams[i%2].teamCityName;
    }
    if(msg == ""){
        msg = "No match to display";
    }
    return msg;
}

function getResults(result){
    lstMatch = result.lineScore;
    msg = "";
    let gras1 = "";
    let gras2 = "";
    for(let i=0 ; i<lstMatch.length ;i++){
        if(i%2 == 0 && i != 0){
            msg += "\n";
        }
        if(i%2 == 1){
            if(lstMatch[i].pts == null){
                msg += " - " + " " + lstMatch[i].teamCityName;
            }else{
                msg += " - " + lstMatch[i].pts + " " + gras2 +lstMatch[i].teamCityName + gras2;
            }
        }
        if(i%2 == 0){
            if(lstMatch[i].pts == null){
                gras1 = "";
                gras2 = "";
            }
            else if(lstMatch[i].pts>lstMatch[i+1].pts){
                gras1 = "**";
                gras2 = "";
            }else{
                gras1 = "";
                gras2 = "**";
            }
            if(lstMatch[i].pts == null){
                msg += lstMatch[i].teamCityName + " ";
            }else{
                msg += gras1 + lstMatch[i].teamCityName + gras1 + " " + lstMatch[i].pts;
            }
        }
    }
    if(msg == ""){
        return "No match to display";
    }
    return msg;
}

async function displayBet(message){
    let dateTimeOfDay = getDateTimeOfDay();
    const inputs = {
        year: parseInt(dateTimeOfDay[2]),
        month: parseInt(dateTimeOfDay[0]),
        day: parseInt(dateTimeOfDay[1])
    };
    const date = getTimeOfDay();
    let result = await sdv.nba.getScoreboard(inputs);
    let lstMatch = result.events;
    let user = message.author.id;
    const jsonBetList = await getJsonsUser(date, user);
    if(jsonBetList.length <= 0){
        replyMessage("No bets done, hurry up ! Better three hours too soon, than one minute too late",message);
        return;
    }
    let keys = Object.keys(jsonBetList);
    let messageReturn = "Your current bets : \n";
    for(let i = 0; i<keys.length; i++){
        let teamsAbb = lstMatch[parseInt(keys[i])-1].shortName.split(" @ ");
        let teams = lstMatch[parseInt(keys[i])-1].name.split(" at ");
        if(jsonBetList[keys[i]] == teamsAbb[0]){
            messageReturn += "**"+teams[0]+"**" +" - " + teams[1] +"\n";
        }else{
            messageReturn += teams[0] +" - " + "**" + teams[1] +"**" + "\n";
        }
    }
    replyMessage(messageReturn,message);
    return messageReturn;
}

async function treatBet(text,message){
    const dateTimeOfDay = getDateTimeOfDay();
    const date = getTimeOfDay();
    if(hasBet == date){
        replyMessage("bets was already called, check the pinned messages",message);
        return;
    }
    msgBets = message;
    hasBet = date;
    const release = await mutex.acquire();
    try{

        const inputs = {
            year: parseInt(dateTimeOfDay[2]),
            month: parseInt(dateTimeOfDay[0]),
            day: parseInt(dateTimeOfDay[1])
        };
        let result = await sdv.nba.getScoreboard(inputs);
        let msg = await constructMessagesBet(text,message,result);
        if(msg != -1){
            replyMessage(msg,message);
        }
        release();
    }
    catch(e){
        console.log(e);
        replyMessage("Error while calling NBA API",message);
        release();
    }
}

// Traiter le cas pas de bet
async function constructMessagesBet(text,message,matchs){
    const lstMatch = matchs.events;
    const filter = (reaction) => {
	       return ['🇧', '🇦'].includes(reaction.emoji.name);
    };
    let topin = null;
    for(let i = 0; i<lstMatch.length;i++){
    //for(let i = 0; i<1;i++){
        let matchDate = constructMatchDate(lstMatch[i].date);
        let teams = lstMatch[i].name.split(" at ");
        let teamsShort = lstMatch[i].shortName.split(" @ ");
        let msg = (i+1) + " " + teams[0] + " - " + teams[1] +  "\n";
        let date = getTimeOfDay();
        if(i == 0){
            msg = "Match of " + toAmericanDate(date) + ":\n" + msg;
            myInterval = setInterval(setInt,500000);
        }
        let channel = message.channel.name;
        const chan = client.channels.cache.find(chann => chann.name === channel);
        let messa = await chan.send(msg);
        if(i == 0){
            topin = messa;
        }
        await messa.react('🇦');
        await messa.react('🇧');
        const collector = messa.createReactionCollector(filter, {time: 100000000, dispose: true}); // temps en milliseconds
        collector.on('collect', (reaction, user) =>{
                    inter = 0;
                    if(reaction.emoji.name == '🇦' || reaction.emoji.name == '🇧'){
                        if(reaction.emoji.name == '🇦'){
                            messa.reactions.resolve('🇧').users.remove(user);
                        }else{
                            messa.reactions.resolve('🇦').users.remove(user);
                        }
                        const oldDate = new Date();
                        const currDate = new Date(oldDate.getUTCFullYear(),oldDate.getUTCMonth(),oldDate.getUTCDate(),oldDate.getUTCHours(),oldDate.getMinutes()-10);
                        currDate.setTime( currDate.getTime() - currDate.getTimezoneOffset() * 60 * 1000 );
                        //// LLLLLLLLLLLLLLLLLLLLLLLLLLLLAAAAAAAAAAAAAAAAAAAAAAAAA > à changer
                        if(currDate-matchDate>0){
                          if(reaction.emoji.name == '🇦'){
                            messa.reactions.resolve('🇦').users.remove(user);
                          }else{
                            messa.reactions.resolve('🇧').users.remove(user);
                          }
                            replyEmojiMessage("Come on! You can't bet when match has already begun! Maybe next time, but probably not");
                        }else {
                            modifyBetsDone(user, message, reaction.emoji.name  == '🇦', lstMatch[i], teams, teamsShort, i+1);
                        }
                    }
                });
        collector.on('remove', (reaction, user) =>{
            if(reaction.emoji.name == '🇦' || reaction.emoji.name == '🇧'){
                const currDate = new Date();
                let teamChosen = (reaction.emoji.name == '🇦') ? 0 : 1;
                removeFromJson(user, teamsShort[teamChosen], i+1);
            }
        });
    }
    if(topin != null){
        let msg = await message.channel.messages.fetchPinned();
        if(msg.array().length == 1){
            topin.pin();
        }if(msg.array().length == 2){
            await msg.array()[0].unpin();
            topin.pin();
        }
    }
    return -1;
}


async function modifyBetsDone(user, message, teamFirst, match, teams, teamsShort, idMatch){
    let teamChosen = teamFirst ? 0 : 1;
    let id = user.id;
    let date = getTimeOfDay();
    let jsonBetList = await getJsonsUser(date, id);
    // let jsonScoreList = await getJsonScore();
    let newComers = [];
    // let keys = Object.keys(jsonScoreList)
    // if(!keys.includes(id)){
    //     jsonScoreList[id] = -1;
    // }
    let idMessage = -1;
    let postedMessage = "";
    jsonBetList[idMatch] = teamsShort[teamChosen];
    writeJsonUser(id, date, jsonBetList);
    // addNewComers(jsonScoreList);
}

async function removeFromJson(user, team, idMatch){
    let date = getTimeOfDay();
    let id = user.id;
    deleteJsonBet(id,date,idMatch,team);
}

function getLineBet(text){
    if(text == undefined){
      return -1;
    }
    content = text.split(' ');
    if(content.length < 2){
        return -2;
    }
    if(!isNumeric(content[0]) || parseInt(content[0]) == 0 ){
        return -2;
    }
    if(content[1].toLowerCase() != "a" && content[1].toLowerCase() != "b"){
        return [parseInt(content[0]),"c"];
    }
    nbMatch = parseInt(content[0])
    result = content[1];
    return [nbMatch,result];
}


async function checkBets(txt,message){
    let dicResult = {};
    if(betRemaining > -1){
        replyMessage("I'm traiting a nba check demand. Keep calm and play basketball",message)
        return -1;
    }
    //let mutex = new sem.Mutex();
    const release = await mutex.acquire();
    try{
        let msg = await message.channel.messages.fetchPinned()
        if(msg.array().length <= 1){
            replyMessage("NBA Leaderboard",message);
        }
        else{
            const results = await treatNextBet(msg.array()[1].content,msg.array()[1],message);
            replyMessage(results,message);
            //msg.array()[0].edit(newNbaBets);
        }
        release();
    }catch(e){
        console.log(e);
        replyMessage("Error while calling NBA API",message);
        release();
    }
}

async function treatNextBet(leaderboard, msgLeaderboard, question){
        let dicResult = {};
        let scores = [];
        let jsonScore = await getJsonScore();
        const timeofday = getTimeOfDay();
        let users = await getJsonsUsers();
        for(let i = 0; i<users.length ; i++){
            let user = users[i];
            let dates = await getJsonsDates(user);
            for(let j=0; j<dates.length; j++){
                // RIGHT HERE rajouter !
                if(isHigherDate(timeofday,dates[j])){
                    if(!dicResult.hasOwnProperty(dates[j])){
                        const date = dates[j].split("/");
                        const inputs = {
                            year: parseInt(date[2]),
                            month: parseInt(date[0]),
                            day: parseInt(date[1])
                        };
                        dicResult[dates[j]] = await sdv.nba.getScoreboard(inputs);
                    }
                    jsonBetList = await getJsonsUser(dates[j], user);
                    const keys = Object.keys(jsonBetList);
                    const lstMatch = dicResult[dates[j]].events;
                    let score = 0;
                    for(let l = 0; l<keys.length; l++){
                        let teamsAbb = lstMatch[parseInt(keys[l])-1].shortName.split(" @ ");
                        let teams = lstMatch[parseInt(keys[l])-1].name.split(" at ");
                        if((parseInt(lstMatch[parseInt(keys[l])-1].competitions[0].competitors[0].score) > parseInt(lstMatch[parseInt(keys[l])-1].competitions[0].competitors[1].score) && jsonBetList[keys[l]] === lstMatch[parseInt(keys[l])-1].competitions[0].competitors[0].team.abbreviation) ||
                           (parseInt(lstMatch[parseInt(keys[l])-1].competitions[0].competitors[0].score) < parseInt(lstMatch[parseInt(keys[l])-1].competitions[0].competitors[1].score) && jsonBetList[keys[l]] === lstMatch[parseInt(keys[l])-1].competitions[0].competitors[1].team.abbreviation)){
                            score += 3;
                        }
                    }
                    deleteJson(user,dates[j]);
                    if(Object.keys(jsonScore).includes(user)){
                        jsonScore[user] = parseInt(jsonScore[user]) + score;
                    }else{
                        jsonScore[user] = score;
                    }
                    scores.push([user,score]);
                }
            }

        }
        jsonScore = Object.fromEntries(
            Object.entries(jsonScore).sort(([,a],[,b]) => b-a)
        );
        writeJsonScore(jsonScore);
        if(scores.length == 0){
            return "Nothing to check";
        }
        scores.sort(compareSecondColumn);
        user = question.guild.members.cache.get(scores[scores.length-1][0]);
        let myName = "";
        if(user === undefined){
            myName = "Unknown";
        }else{
            myName = user.nickname;
            if(myName == null){
                myName = user.user.username;
            }
        }
        let mess = "Hey well done **" + myName + "** you got the highest score\n||";
        for(let j=scores.length; j>=1; j--){
            user = msgLeaderboard.guild.members.cache.get(scores[j-1][0]);
            let myName = "";
            if(user === undefined){
                myName = "Unknown";
            }else{
                myName = user.nickname;
                if(myName == null){
                    myName = user.user.username;
                }
            }
            let pos = scores.length+1-j
            mess += pos + ". " + myName + "   " + scores[j-1][1] + "\n";
        }
        mess += "||"
        updateLeaderboard(jsonScore, msgLeaderboard);
        return mess;
}





function updateLeaderboard(jsonData, msgLeaderboard){
    let retScore = "Leaderboard :\n";
    let pos = 1;
    for (const [key, value] of Object.entries(jsonData)) {
        user = msgLeaderboard.guild.members.cache.get(key);
        let myName = "";
        if(user === undefined){
            myName = "Unknown";
        }else{
            myName = user.nickname;
            if(myName == null){
                myName = user.user.username;
            }
        }
        retScore += pos + ". " + myName + "   " + value + "\n";
        pos += 1;
    }
    msgLeaderboard.edit(retScore);
}







// utility tools
function constructMatchDate(txt){
    let yMDTable = txt.split("-");
    const year = parseInt(yMDTable[0]);
    const month = parseInt(yMDTable[1]);
    let hours = parseInt(yMDTable[2].substring(3,5))
    let dayOffset = 0;
    const day = parseInt(yMDTable[2].substring(0,2))+dayOffset;
    const minutes = parseInt(yMDTable[2].substring(6,8));
    let date = new Date(year, month-1, day, hours, minutes);
    date.setTime( date.getTime() - date.getTimezoneOffset() * 60 * 1000 );
    return date
}

function isHigherDate(date1, date2){
    d1 = date1.split("/");
    d2 = date2.split("/");
    if(parseInt(d1[2]) != parseInt(d2[2])){
        return parseInt(d1[2]) > parseInt(d2[2]);
    }
    if(parseInt(d1[0]) != parseInt(d2[0])){
        return parseInt(d1[0]) > parseInt(d2[0]);
    }
    if(parseInt(d1[1]) != parseInt(d2[1])){
        return parseInt(d1[1]) > parseInt(d2[1]);
    }
    return false;
}

function applyModification(toWrite, message){
    content = message.content;
    content += toWrite;
    message.edit(content);
}

async function deleteJsonBet(user, date, id, team){
    let key = user + " " + date + " " + id;
    executeQuery("DELETE FROM bets where bet_id = '" + key + "' and result = '"+ team +"';");
    //db.delete(key);
}

async function deleteJson(user, date){
    // let list_delete = [];
    // let matches = await db.list(user + " " + date);
    let key = user + " " + date;
    executeQuery("DELETE FROM bets where bet_id like '" + key + "%';");
    // for(let i=0;i<matches.length; i++){
    //   list_delete.push(matches[i])
    //   }
    // for(let j=0;j<list_delete.length; j++){
    //   db.delete(list_delete[j]);
    // }
}

async function getJsonsUser(date, user){
    let values = [];
    let key = user + " " + date;
    let query = await executeQuery("SELECT * FROM bets where bet_id like '" + key + "%';");
    let matches = query['bet_id'];
    for(let i=0;i<matches.length; i++){
        let pars = matches[i].split(" ");
        values[pars[2]] = query['result'][i];
    }
    return values
}

async function getJsonsDates(user){
    let dateList = [];
    let query = await executeQuery("SELECT bet_id FROM bets where bet_id like '%" + user + "%';");
    let matches = query['bet_id'];
    for(let i=0;i<matches.length; i++){
        let pars = matches[i].split(" ");
        if(!dateList.includes(pars[1])){
            dateList.push(pars[1]);
        }
    }
    return dateList;
}

async function getJsonsUsers(){
    let userList = [];
    let query = await executeQuery("SELECT DISTINCT SPLIT_PART(bet_id,' ','1') as user_id FROM bets;");
    let matches = query['user_id']
    for(let i=0;i<matches.length; i++){
        let pars = matches[i].split(" ");
        if(!userList.includes(pars[0]) && pars[0] != "score"){
            userList.push(pars[0]);
        }
    }
    return userList;
}

async function getJsonScore(){
    let scores = [];
    let query = await executeQuery("SELECT * FROM scores;");
    let matches = query['user_id'];
    let scoring = query['score'];
    for(let i=0;i<matches.length; i++){
        scores[matches[i]] = scoring[i];
    }
    return scores;
}

async function addNewComers(listJson){
    let keys = Object.keys(listJson);
    for(let i=0; i<keys.length; i++){
        let key = keys[i]
        if(listJson[key] == -1){
            executeQuery("INSERT INTO scores(user_id,score) VALUES ('" + key + "',0);");
        }
        return;
    }

}
async function writeJsonUser(user, date, list){
  let keys = Object.keys(list);
  for(let i=0; i<keys.length; i++){
    let key = user + " " + date + " " + keys[i];
    executeQuery("INSERT INTO bets VALUES ('"+key +"','"+list[keys[i]]+"') ON CONFLICT(bet_id) DO UPDATE SET result = '"+list[keys[i]]+"';");
  }
}

async function changeScoreJson(remove,user,score){
  //console.log(user);
  let query = await executeQuery("SELECT * from score WHERE user_id="+ user+";");
  // "SELECT * from score;"
  let users = query['user_id'];
  let scores = query['score']
  for(let i=0;i<users.length; i++){
      userId = matches[i]
    if(userId == user){
      let oldScore = scores[i];
      //console.log(oldScore);
      if(remove){
          oldScore = oldScore-parseInt(score);
      }else{
          oldScore = oldScore+parseInt(score);
      }
      executeQuery("UPDATE scores SET score = '" + oldScore +"' WHERE user_id ='" + user + "';");
      return true;
    }
  }
  return false;
}

async function writeJsonScore(scores){
  let keys = Object.keys(scores);
  for(let i=0; i<keys.length; i++){
    let user = keys[i];
    //console.log("UPDATE scores set score = '" + scores[keys[i]]+"' WHERE user_id = '"+key+"';");
    //executeQuery("UPDATE scores set score = '" + scores[keys[i]]+"' WHERE user_id = '"+user+"';");
    executeQuery("INSERT INTO scores VALUES ('"+user +"','"+scores[user]+"') ON CONFLICT(user_id) DO UPDATE SET score = '"+scores[user]+"';");
    //
  }
}

function findBet(lst, date, pseudo){
    for(let i= 0; i<lst.length; i++){
        if(lst[i][lst[i].length-4] == "." || lst[i][lst[i].length-3] == "." || lst[i][lst[i].length-5] == "."){
            continue;
        }
        subList = lst[i].split("  ");
        if(date == subList[1] && pseudo == subList[0]){
            i += 1;
            const rem = i;
            while(i<lst.length && (lst[i][lst[i].length-4] == "." || lst[i][lst[i].length-3] == "." || lst[i][lst[i].length-5] == ".")){
                i += 1
            }
            return [rem, i];
        }
    }
    return -1;
}

function setInt(){
  inter += 1
  if(inter == 12){
    inter = 0;
  }
   clearInterval(myInterval)
}

function errorOnBet(content){
    if(content.length < 2){
        return true;
    }
    if(!isNumeric(content[0]) || parseInt(content[0]) == 0){
        return true;
    }
    return false;
}

function compareSecondColumn(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}

function compareFirstColumn(a, b) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}

function find(searchList, elemList, index){
    elem = elemList[index][0]
    for(let i = 0; i<searchList.length; i++){
        if(searchList[i][0] == elem){
            return i;
        }
    }
    return -1
}

function findNumber(lstBet,indBeg, indEnd,numb){
    let i = indBeg;
    for (i= indBeg; i<indEnd;i++){
        check = lstBet[i].split(".");
        if(check[0] == numb){
            return[true,i];
        }
        if(parseInt(check[0]) >= parseInt(numb)){
            return [false,i];
        }
    }
    return[false,i];
}

function replyMessage(toRep,msg){
    let channelId = msg.channel.id;
    const chan = client.channels.cache.get(channelId);
    chan.send(toRep);
}

function replyEmojiMessage(toRep){
    let channelId = msgBets.channel.id;
    const chan = client.channels.cache.get(channelId);
    chan.send(toRep);
}

function toAmericanDate(date){
    return date.substring(3,5) + "/" + date.substring(0,2) + "/" + date.substring(6,10);
}

function isNumeric(value) {
    return /^\d+$/.test(value);
}


function getFollowingBet(lstBet, ind){
    let i = ind+1;
    while(i<lstBet.length && lstBet[i][lstBet[i].length-4] == "."){
        i += 1;
    }
    let clone = lstBet.slice();
    return clone.splice(ind, i-1);
}

async function executeQuery(query){
    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    await db.connect();
    res = await db.query(query);
    let result = {};
    if(res.rows.length > 0) {
        for(let i=0; i<res.fields.length;i++){
            let key = res.fields[i].name;
            result[key] =  res.rows.map((values)=>values[key]);
        }
    }else{
        for(let i=0; i<res.fields.length;i++){
            result[res.fields[i].name] = [];
        }
    }
    await db.end();
    return result;
}

client.login(process.env.CLIENT_TOKEN);
//client.on("error", (e) => {console.log;exec("node index.js");exec("kill 1");} );

// TODO
// Gérer les cas d'erreur sur les paris
// Si plusieurs paris merge les scores des joueurs dans le retour de check
// FAire en sorte qu'on réponde sur le bon channel


// Gérer des exécutions concurrentes (sémaphore). //
// Passage sur Repl.it //
// on ne peut pas parier si le match a déjà commencé //


// Are you drunk n'affiche pas certains paris //
// Virer are you drunk à chaque fois //
// être plus intelligent sur le check et pas juste réinitialiser, on garde les paris qui sont pas encore passé //
// Faire un tableau qui retient les dates qu'on a déjà demandé pour pas les redemander 500 fois (check) //
// Cas de bug, on met plusieurs fois le même matchs + on dépasse sur les matchs + gérer le cas ou tout a été viré du coup liste vide + avertir numéro de bets non valides //
// !nba change affiche les paris actuels //
// Si y a un espace à la fin du bet on s'en bat le steack mais pour le moment ça marche pas //
// TO lowercase A B des paris //
// Vérifier dans le check qu'il y a bien des paris //
